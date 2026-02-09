use actix::Actor;
use actix_web::{web, App, HttpServer, HttpRequest, HttpResponse, middleware};
use actix_web_actors::ws;
use actix_cors::Cors;
use serde::{Deserialize, Serialize};

mod code_runner;
mod games;

use games::snake::{GameRoom, SnakeSession, RoomManager, CreateRoom, JoinRoom, QuickMatch, RoomSettings};

// =============================================================================
// TYPES
// =============================================================================

#[derive(Deserialize)]
pub struct CodeRequest {
    pub language: String,
    pub code: String,
}

#[derive(Serialize)]
pub struct CodeResponse {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub duration_ms: u64,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
    pub languages: Vec<String>,
    pub games: Vec<String>,
}

// =============================================================================
// ROUTES
// =============================================================================

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        service: "chill-space-backend".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        languages: vec!["python".to_string(), "javascript".to_string(), "java".to_string()],
        games: vec!["snake-battle".to_string()],
    })
}

async fn run_code(req: web::Json<CodeRequest>) -> HttpResponse {
    let start = std::time::Instant::now();
    
    // Validate language
    let supported = ["python", "javascript", "java"];
    if !supported.contains(&req.language.as_str()) {
        return HttpResponse::BadRequest().json(CodeResponse {
            stdout: String::new(),
            stderr: String::new(),
            exit_code: -1,
            duration_ms: 0,
            error: Some(format!(
                "Language '{}' is not supported. Supported: {:?}",
                req.language, supported
            )),
        });
    }

    // Execute code with security checks and timeout
    let result = code_runner::execute(&req.language, &req.code).await;
    
    let duration_ms = start.elapsed().as_millis() as u64;
    
    match result {
        Ok((stdout, stderr, exit_code)) => {
            HttpResponse::Ok()
                .insert_header(("X-Execution-Time-Ms", duration_ms.to_string()))
                .json(CodeResponse {
                    stdout,
                    stderr,
                    exit_code,
                    duration_ms,
                    error: None,
                })
        }
        Err(e) => {
            HttpResponse::Ok()
                .insert_header(("X-Execution-Time-Ms", duration_ms.to_string()))
                .json(CodeResponse {
                    stdout: String::new(),
                    stderr: String::new(),
                    exit_code: -1,
                    duration_ms,
                    error: Some(e),
                })
        }
    }
}

async fn snake_ws(
    req: HttpRequest,
    stream: web::Payload,
    room: web::Data<actix::Addr<GameRoom>>,
) -> Result<HttpResponse, actix_web::Error> {
    let session = SnakeSession::new(room.get_ref().clone());
    ws::start(session, &req, stream)
}

// Room-based WebSocket connection
async fn snake_room_ws(
    req: HttpRequest,
    stream: web::Payload,
    path: web::Path<String>,
    room_manager: web::Data<actix::Addr<RoomManager>>,
) -> Result<HttpResponse, actix_web::Error> {
    let code = path.into_inner().to_uppercase();
    
    // Get the room address from room manager
    let room_result = room_manager.send(JoinRoom { code: code.clone() }).await;
    
    match room_result {
        Ok(Some(room_addr)) => {
            let session = SnakeSession::new(room_addr);
            ws::start(session, &req, stream)
        }
        _ => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Room not found",
                "code": code
            })))
        }
    }
}

#[derive(Deserialize)]
pub struct CreateRoomRequest {
    pub settings: Option<RoomSettings>,
    pub is_public: Option<bool>,
}

#[derive(Serialize)]
pub struct CreateRoomResponse {
    pub code: String,
    pub message: String,
}

async fn create_room(
    body: web::Json<CreateRoomRequest>,
    room_manager: web::Data<actix::Addr<RoomManager>>,
) -> HttpResponse {
    let settings = body.settings.clone().unwrap_or_default();
    let is_public = body.is_public.unwrap_or(false);
    
    let result = room_manager.send(CreateRoom { settings, is_public }).await;
    
    match result {
        Ok(Some((code, _))) => {
            HttpResponse::Ok().json(CreateRoomResponse {
                code,
                message: "Room created successfully".to_string(),
            })
        }
        _ => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create room"
            }))
        }
    }
}

#[derive(Serialize)]
pub struct QuickMatchResponse {
    pub code: String,
    pub message: String,
}

async fn quick_match(
    room_manager: web::Data<actix::Addr<RoomManager>>,
) -> HttpResponse {
    let result = room_manager.send(QuickMatch).await;
    
    match result {
        Ok(Some(_)) => {
            // For quick match, we create a new room
            let create_result = room_manager.send(CreateRoom {
                settings: RoomSettings::default(),
                is_public: true,
            }).await;
            
            match create_result {
                Ok(Some((code, _))) => {
                    HttpResponse::Ok().json(QuickMatchResponse {
                        code,
                        message: "Joined quick match".to_string(),
                    })
                }
                _ => {
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": "Failed to find match"
                    }))
                }
            }
        }
        _ => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to find match"
            }))
        }
    }
}

#[derive(Deserialize)]
pub struct SoloGameRequest {
    pub difficulty: String,  // "Easy", "Medium", or "Hard"
    pub num_bots: u8,        // 1-3
}

#[derive(Serialize)]
pub struct SoloGameResponse {
    pub code: String,
    pub message: String,
}

async fn create_solo_game(
    body: web::Json<SoloGameRequest>,
    room_manager: web::Data<actix::Addr<RoomManager>>,
) -> HttpResponse {
    use crate::games::snake::BotDifficulty;
    
    // Validate num_bots
    if body.num_bots < 1 || body.num_bots > 3 {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "num_bots must be between 1 and 3"
        }));
    }
    
    // Parse difficulty
    let difficulty = match body.difficulty.as_str() {
        "Easy" => BotDifficulty::Easy,
        "Medium" => BotDifficulty::Medium,
        "Hard" => BotDifficulty::Hard,
        _ => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid difficulty. Must be 'Easy', 'Medium', or 'Hard'"
            }));
        }
    };
    
    // Create a room
    let create_result = room_manager.send(CreateRoom {
        settings: RoomSettings::default(),
        is_public: false,
    }).await;
    
    match create_result {
        Ok(Some((code, room_addr))) => {
            // Spawn bots
            for _ in 0..body.num_bots {
                room_addr.do_send(crate::games::snake::SpawnBot { difficulty });
            }
            
            HttpResponse::Ok().json(SoloGameResponse {
                code,
                message: format!("Solo game created with {} bot(s)", body.num_bots),
            })
        }
        _ => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create solo game"
            }))
        }
    }
}

// =============================================================================
// MAIN
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load .env file
    dotenv::dotenv().ok();
    
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));
    
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(7860); // Hugging Face default port
    
    log::info!("🚀 Chill Space Backend v{}", env!("CARGO_PKG_VERSION"));
    log::info!("🔒 Security: Timeout=10s, MaxCode=50KB, MaxOutput=100KB");
    log::info!("🎮 Games: Snake Battle (up to 4 players)");
    log::info!("🌐 Starting server on {}:{}", host, port);
    
    // Start the Room Manager
    let room_manager = RoomManager::default().start();
    
    HttpServer::new(move || {
        // CORS configuration for frontend
        let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
        
        let cors = Cors::default()
            .allowed_origin(&frontend_url)
            .allowed_origin("http://localhost:3000") // Always allow local development
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_methods(vec!["GET", "POST", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::CONTENT_TYPE,
                actix_web::http::header::ACCEPT,
            ])
            .max_age(3600);
        
        App::new()
            .app_data(web::Data::new(room_manager.clone()))
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            .route("/", web::get().to(|| async { 
                HttpResponse::Ok().body("Chill Space Backend API - Visit /api/v1/health") 
            }))
            .route("/api/v1/health", web::get().to(health))
            .route("/api/v1/code/run", web::post().to(run_code))
            // New room routes
            .route("/api/v1/games/snake/rooms", web::post().to(create_room))
            .route("/api/v1/games/snake/quick-match", web::post().to(quick_match))
            .route("/api/v1/games/snake/solo", web::post().to(create_solo_game))
            .route("/api/v1/games/snake/ws/{code}", web::get().to(snake_room_ws))
    })
    .bind((host.as_str(), port))?
    .run()
    .await
}

