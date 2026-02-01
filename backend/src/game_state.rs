use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub username: String,
    pub score: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSession {
    pub id: String,
    pub game_type: String, // "galaxy-match" or "code-editor"
    pub players: Vec<Player>,
    pub status: String, // "waiting", "active", "finished"
    pub created_at: i64,
}

pub struct GameState {
    pub sessions: HashMap<String, GameSession>,
}

impl GameState {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    pub fn create_session(&mut self, game_type: String, host: Player) -> GameSession {
        let session_id = Uuid::new_v4().to_string();
        let session = GameSession {
            id: session_id.clone(),
            game_type,
            players: vec![host],
            status: "waiting".to_string(),
            created_at: chrono::Utc::now().timestamp(),
        };
        
        self.sessions.insert(session_id.clone(), session.clone());
        session
    }
}
