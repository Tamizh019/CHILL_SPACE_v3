use actix_web::{web, HttpResponse, Responder, get, post};
use std::sync::Mutex;
use crate::game_state::{GameState, Player};
use serde::Deserialize;

#[get("/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok", "service": "chill-space-backend" }))
}

#[derive(Deserialize)]
struct CreateGameRequest {
    game_type: String,
    username: String,
    user_id: String,
}

#[post("/api/game/create")]
async fn create_game(
    data: web::Data<Mutex<GameState>>,
    req: web::Json<CreateGameRequest>,
) -> impl Responder {
    let mut state = data.lock().unwrap();
    
    let host = Player {
        id: req.user_id.clone(),
        username: req.username.clone(),
        score: 0,
    };

    let session = state.create_session(req.game_type.clone(), host);
    
    HttpResponse::Ok().json(session)
}

#[get("/api/game/sessions")]
async fn list_sessions(data: web::Data<Mutex<GameState>>) -> impl Responder {
    let state = data.lock().unwrap();
    let sessions: Vec<_> = state.sessions.values().cloned().collect();
    
    HttpResponse::Ok().json(sessions)
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(create_game);
    cfg.service(list_sessions);
}
