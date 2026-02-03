use actix_web::{web, App, HttpServer, HttpResponse, middleware};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};

mod code_runner;

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
}

// =============================================================================
// ROUTES
// =============================================================================

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        service: "chill-space-code-runner".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        languages: vec!["python".to_string(), "javascript".to_string(), "java".to_string()],
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

// =============================================================================
// MAIN
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));
    
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(7860); // Hugging Face default port
    
    log::info!("🚀 Chill Space Code Runner v{}", env!("CARGO_PKG_VERSION"));
    log::info!("🔒 Security: Timeout=10s, MaxCode=50KB, MaxOutput=100KB");
    log::info!("🌐 Starting server on {}:{}", host, port);
    
    HttpServer::new(|| {
        // CORS configuration for frontend
        let cors = Cors::default()
            .allowed_origin("https://tamizh-loginpage.netlify.app")
            .allowed_origin("http://localhost:3000") // Local development
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_methods(vec!["GET", "POST", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::CONTENT_TYPE,
                actix_web::http::header::ACCEPT,
            ])
            .max_age(3600);
        
        App::new()
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            .route("/", web::get().to(|| async { 
                HttpResponse::Ok().body("Chill Space Code Runner API - Visit /api/v1/health") 
            }))
            .route("/api/v1/health", web::get().to(health))
            .route("/api/v1/code/run", web::post().to(run_code))
    })
    .bind((host.as_str(), port))?
    .run()
    .await
}
