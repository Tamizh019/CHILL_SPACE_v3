use actix::prelude::*;
use actix_web_actors::ws;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use uuid::Uuid;

// =============================================================================
// CONSTANTS
// =============================================================================

const GRID_WIDTH: i32 = 50;
const GRID_HEIGHT: i32 = 35;
const TICK_INTERVAL: Duration = Duration::from_millis(150);
const TICKS_PER_SECOND: u32 = (1000 / 150) as u32; // 
const COUNTDOWN_DURATION: u8 = 3; 
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);
const MAX_PLAYERS: usize = 4;
const INITIAL_SNAKE_LENGTH: usize = 3;
const POWERUP_SPAWN_INTERVAL: Duration = Duration::from_secs(10); 
const POWERUP_SPEED_DURATION: Duration = Duration::from_secs(5);   
const POWERUP_SHIELD_DURATION: Duration = Duration::from_secs(3);   
const POWERUP_GHOST_DURATION: Duration = Duration::from_secs(2);   

// Player colors (violet theme palette)
const PLAYER_COLORS: [&str; 4] = ["#a855f7", "#22d3ee", "#f472b6", "#4ade80"];

// =============================================================================
// ROOM SETTINGS
// =============================================================================

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum GameSpeed {
    Slow,   
    Normal, 
    Fast,   
}

impl GameSpeed {
    pub fn to_millis(&self) -> u64 {
        match self {
            GameSpeed::Slow => 200,
            GameSpeed::Normal => 150,
            GameSpeed::Fast => 100,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum MapSize {
    Small,  
    Medium, 
    Large,  
}

impl MapSize {
    pub fn dimensions(&self) -> (i32, i32) {
        match self {
            MapSize::Small => (40, 30),
            MapSize::Medium => (50, 35),
            MapSize::Large => (60, 40),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RoomSettings {
    pub max_players: usize,
    pub speed: GameSpeed,
    pub power_ups_enabled: bool,
    pub rounds: u8,
    pub map_size: MapSize,
}

impl Default for RoomSettings {
    fn default() -> Self {
        RoomSettings {
            max_players: 4,
            speed: GameSpeed::Normal,
            power_ups_enabled: true,
            rounds: 1,
            map_size: MapSize::Medium,
        }
    }
}

// =============================================================================
// GAME TYPES
// =============================================================================

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Copy)]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
}

impl Direction {
    pub fn opposite(&self) -> Self {
        match self {
            Direction::Up => Direction::Down,
            Direction::Down => Direction::Up,
            Direction::Left => Direction::Right,
            Direction::Right => Direction::Left,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Snake {
    pub body: Vec<Point>,
    pub direction: Direction,
    pub next_direction: Direction,
    pub alive: bool,
    pub score: u32,
    pub color: String,
}

impl Snake {
    pub fn new(start: Point, direction: Direction, color: String) -> Self {
        let mut body = vec![start.clone()];
        for i in 1..INITIAL_SNAKE_LENGTH {
            let offset = match direction {
                Direction::Up => Point { x: start.x, y: start.y + i as i32 },
                Direction::Down => Point { x: start.x, y: start.y - i as i32 },
                Direction::Left => Point { x: start.x + i as i32, y: start.y },
                Direction::Right => Point { x: start.x - i as i32, y: start.y },
            };
            body.push(offset);
        }
        Snake {
            body,
            direction,
            next_direction: direction,
            alive: true,
            score: 0,
            color,
        }
    }

    pub fn head(&self) -> &Point {
        &self.body[0]
    }

    pub fn set_direction(&mut self, dir: Direction) {
        if dir != self.direction.opposite() {
            self.next_direction = dir;
        }
    }

    pub fn move_forward(&mut self) {
        self.direction = self.next_direction;
        let head = self.head().clone();
        let new_head = match self.direction {
            Direction::Up => Point { x: head.x, y: head.y - 1 },
            Direction::Down => Point { x: head.x, y: head.y + 1 },
            Direction::Left => Point { x: head.x - 1, y: head.y },
            Direction::Right => Point { x: head.x + 1, y: head.y },
        };
        self.body.insert(0, new_head);
        self.body.pop();
    }

    pub fn grow(&mut self) {
        if let Some(tail) = self.body.last().cloned() {
            self.body.push(tail);
        }
        self.score += 10;
    }
}

// =============================================================================
// POWER-UPS
// =============================================================================

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum PowerUpType {
    SpeedBoost,   // 2x speed for 5s
    Shield,       // Invincible for 3s
    Grow,         // +5 length instantly
    Ghost,        // Pass through walls/snakes for 2s
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PowerUp {
    pub id: String,
    pub position: Point,
    pub power_type: PowerUpType,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ActivePowerUp {
    pub power_type: PowerUpType,
    pub ticks_remaining: u32, // Ticks until power-up expires
}

// =============================================================================
// BOT AI
// =============================================================================

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Copy)]
pub enum BotDifficulty {
    Easy,   // Random movement with occasional food seeking
    Medium, // Active food seeking with wall avoidance
    Hard,   // Advanced pathfinding with collision prediction
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Player {
    pub id: String,          
    pub user_id: Option<String>,
    pub access_token: Option<String>, 
    pub name: String,
    pub snake: Snake,
    pub ready: bool,
    pub active_power: Option<ActivePowerUp>, // Current active power-up
    pub is_bot: bool,                        // Whether this player is AI-controlled
    pub difficulty: Option<BotDifficulty>,   // AI difficulty level (if bot)
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum GamePhase {
    Lobby,
    Countdown,   // New: 3-2-1-GO countdown
    Playing,
    GameOver,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GameState {
    pub phase: GamePhase,
    pub players: HashMap<String, Player>,
    pub food: Vec<Point>,
    pub grid_width: i32,
    pub grid_height: i32,
    pub winner: Option<String>,
    pub countdown: u8,  // Countdown timer (3, 2, 1, 0)
    pub countdown_ticks: u32, // Tick counter for countdown timing
    pub power_ups: Vec<PowerUp>, // Active power-ups on the grid
}

impl Default for GameState {
    fn default() -> Self {
        Self::new()
    }
}

impl GameState {
    pub fn new() -> Self {
        GameState {
            phase: GamePhase::Lobby,
            players: HashMap::new(),
            food: Vec::new(),
            grid_width: GRID_WIDTH,
            grid_height: GRID_HEIGHT,
            winner: None,
            countdown: 0,
            countdown_ticks: 0,
            power_ups: Vec::new(),
        }
    }

    pub fn spawn_food(&mut self) {
        let mut rng = rand::thread_rng();
        let mut attempts = 0;
        loop {
            let point = Point {
                x: rng.gen_range(1..self.grid_width - 1),
                y: rng.gen_range(1..self.grid_height - 1),
            };
            
            // Check not on any snake
            let on_snake = self.players.values()
                .any(|p| p.snake.body.contains(&point));
            
            if !on_snake && !self.food.contains(&point) {
                self.food.push(point);
                break;
            }
            
            attempts += 1;
            if attempts > 100 {
                break;
            }
        }
    }

    pub fn get_spawn_position(player_index: usize) -> (Point, Direction) {
        match player_index % 4 {
            0 => (Point { x: 5, y: GRID_HEIGHT / 2 }, Direction::Right),
            1 => (Point { x: GRID_WIDTH - 6, y: GRID_HEIGHT / 2 }, Direction::Left),
            2 => (Point { x: GRID_WIDTH / 2, y: 5 }, Direction::Down),
            _ => (Point { x: GRID_WIDTH / 2, y: GRID_HEIGHT - 6 }, Direction::Up),
        }
    }
}

// =============================================================================
// BOT AI DECISION MAKING
// =============================================================================

impl GameState {
    /// Bot makes a movement decision based on difficulty level
    pub fn bot_decide_direction(&self, player_id: &str) -> Option<Direction> {
        let player = self.players.get(player_id)?;
        if !player.is_bot {
            return None;
        }

        let difficulty = player.difficulty?;
        let current_direction = player.snake.direction;
        let head = player.snake.head();

        match difficulty {
            BotDifficulty::Easy => self.bot_easy_decision(head, current_direction),
            BotDifficulty::Medium => self.bot_medium_decision(head, current_direction),
            BotDifficulty::Hard => self.bot_hard_decision(player_id, head, current_direction),
        }
    }

    /// Easy AI: 70% random, 30% move toward food
    fn bot_easy_decision(&self, head: &Point, current: Direction) -> Option<Direction> {
        let mut rng = rand::thread_rng();
        
        // 30% chance to seek food
        if rng.gen_bool(0.3) && !self.food.is_empty() {
            let target = &self.food[0];
            return Some(self.direction_toward(head, target, current));
        }

        // 70% random movement
        let options = self.valid_turns(current);
        if options.is_empty() {
            return Some(current);
        }
        Some(options[rng.gen_range(0..options.len())])
    }

    /// Medium AI: Actively seek food, avoid walls
    fn bot_medium_decision(&self, head: &Point, current: Direction) -> Option<Direction> {
        if self.food.is_empty() {
            return Some(current);
        }

        let target = &self.food[0];
        let desired = self.direction_toward(head, target, current);
        
        // Check if desired direction is safe (not wall)
        if self.is_direction_safe(head, desired) {
            return Some(desired);
        }

        // Try alternative safe directions
        let alternatives = self.valid_turns(current);
        for dir in alternatives {
            if self.is_direction_safe(head, dir) {
                return Some(dir);
            }
        }

        Some(current)
    }

    /// Hard AI: Advanced pathfinding with collision prediction
    fn bot_hard_decision(&self, player_id: &str, head: &Point, current: Direction) -> Option<Direction> {
        if self.food.is_empty() {
            return Some(current);
        }

        let target = &self.food[0];
        
        // Evaluate all possible directions
        let mut best_dir = current;
        let mut best_score = -1000.0;

        for dir in self.valid_turns(current) {
            let score = self.evaluate_direction(player_id, head, dir, target);
            if score > best_score {
                best_score = score;
                best_dir = dir;
            }
        }

        Some(best_dir)
    }

    /// Get valid turn directions (not opposite)
    fn valid_turns(&self, current: Direction) -> Vec<Direction> {
        use Direction::*;
        match current {
            Up | Down => vec![Up, Down, Left, Right],
            Left | Right => vec![Left, Right, Up, Down],
        }
        .into_iter()
        .filter(|d| *d != current.opposite())
        .collect()
    }

    /// Get direction toward target
    fn direction_toward(&self, from: &Point, to: &Point, _current: Direction) -> Direction {
        let dx = to.x - from.x;
        let dy = to.y - from.y;

        // Prioritize larger difference
        if dx.abs() > dy.abs() {
            if dx > 0 { Direction::Right } else { Direction::Left }
        } else if dy > 0 {
            Direction::Down
        } else {
            Direction::Up
        }
    }

    /// Check if direction leads to wall or immediate collision
    fn is_direction_safe(&self, head: &Point, dir: Direction) -> bool {
        let next = self.next_position(head, dir);
        
        // Check walls
        if next.x <= 0 || next.x >= self.grid_width - 1 ||
           next.y <= 0 || next.y >= self.grid_height - 1 {
            return false;
        }

        // Check snake bodies
        for player in self.players.values() {
            if player.snake.body.contains(&next) {
                return false;
            }
        }

        true
    }

    /// Evaluate direction score for hard AI
    fn evaluate_direction(&self, player_id: &str, head: &Point, dir: Direction, target: &Point) -> f32 {
        let next = self.next_position(head, dir);
        let mut score = 0.0;

        // Wall penalty
        if next.x <= 0 || next.x >= self.grid_width - 1 ||
           next.y <= 0 || next.y >= self.grid_height - 1 {
            return -1000.0;
        }

        // Collision penalty
        for player in self.players.values() {
            if player.snake.body.contains(&next) {
                return -1000.0;
            }
        }

        // Distance to food (closer is better)
        let dist = ((target.x - next.x).abs() + (target.y - next.y).abs()) as f32;
        score -= dist;

        // Space availability (more open space is better)
        score += self.count_reachable_spaces(&next, player_id) as f32 * 0.1;

        // Power-up proximity bonus
        for powerup in &self.power_ups {
            let pu_dist = ((powerup.position.x - next.x).abs() + (powerup.position.y - next.y).abs()) as f32;
            if pu_dist < 5.0 {
                score += 2.0;
            }
        }

        score
    }

    /// Count reachable spaces (simple flood fill)
    fn count_reachable_spaces(&self, start: &Point, _player_id: &str) -> usize {
        use std::collections::VecDeque;
        
        let mut visited = std::collections::HashSet::new();
        let mut queue = VecDeque::new();
        queue.push_back(*start);
        visited.insert(*start);

        let mut count = 0;
        let max_depth = 10; // Limit search depth

        while let Some(pos) = queue.pop_front() {
            count += 1;
            if count >= max_depth {
                break;
            }

            for dir in [Direction::Up, Direction::Down, Direction::Left, Direction::Right] {
                let next = self.next_position(&pos, dir);
                
                if visited.contains(&next) {
                    continue;
                }

                // Check bounds
                if next.x <= 0 || next.x >= self.grid_width - 1 ||
                   next.y <= 0 || next.y >= self.grid_height - 1 {
                    continue;
                }

                // Check snake bodies
                let mut blocked = false;
                for player in self.players.values() {
                    if player.snake.body.contains(&next) {
                        blocked = true;
                        break;
                    }
                }

                if !blocked {
                    visited.insert(next);
                    queue.push_back(next);
                }
            }
        }

        count
    }

    /// Get next position given current position and direction
    fn next_position(&self, pos: &Point, dir: Direction) -> Point {
        match dir {
            Direction::Up => Point { x: pos.x, y: pos.y - 1 },
            Direction::Down => Point { x: pos.x, y: pos.y + 1 },
            Direction::Left => Point { x: pos.x - 1, y: pos.y },
            Direction::Right => Point { x: pos.x + 1, y: pos.y },
        }
    }
}

// =============================================================================
// MESSAGES
// =============================================================================

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "payload")]
pub enum ClientMessage {
    Join { 
        name: String,
        user_id: Option<String>,
        access_token: Option<String>
    },
    Ready,
    Direction { direction: Direction },
    StartGame,
    Restart,
    PlayAgain, 
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum ServerMessage {
    Welcome { player_id: String },
    GameState(GameState),
    PlayerJoined { player_id: String, name: String },
    PlayerLeft { player_id: String },
    Error { message: String },
    GameStarted,
    GameOver { winner: Option<String> },
}

// =============================================================================
// SUPABASE HELPERS
// =============================================================================

#[derive(Serialize)]
struct ScoreSubmission {
    user_id: String,
    game_id: String,
    score: u32,
    created_at: String, // ISO 8601
}

fn save_score(user_id: &str, score: u32, token: &str) {
    let supabase_url = std::env::var("SUPABASE_URL").unwrap_or_default();
    let supabase_key = std::env::var("SUPABASE_KEY").unwrap_or_default();
    
    if supabase_url.is_empty() || supabase_key.is_empty() {
        log::warn!("Supabase credentials not configured, skipping score save.");
        return;
    }

    let url = format!("{}/rest/v1/game_scores", supabase_url);
    let submission = ScoreSubmission {
        user_id: user_id.to_string(),
        game_id: "snake-battle".to_string(),
        score,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    let client = reqwest::Client::new();
    let token = token.to_string();
    
    // Spawn async task to avoid blocking the actor
    actix_web::rt::spawn(async move {
        match client.post(&url)
            .header("apikey", supabase_key)
            .header("Authorization", format!("Bearer {}", token))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .json(&submission)
            .send()
            .await 
        {
            Ok(res) => {
                if res.status().is_success() {
                    log::info!("Score saved for user {}", submission.user_id);
                } else {
                    log::error!("Failed to save score: {}", res.status());
                }
            },
            Err(e) => log::error!("Error saving score: {}", e),
        }
    });
}


// =============================================================================
// GAME ROOM ACTOR
// =============================================================================

#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub addr: Addr<SnakeSession>,
    pub id: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientAction {
    pub id: String,
    pub msg: ClientMessage,
}

#[derive(Message)]
#[rtype(result = "()")]
struct GameTick;

#[derive(Message)]
#[rtype(result = "()")]
pub struct SpawnBot {
    pub difficulty: BotDifficulty,
}

// =============================================================================
// ROOM MANAGER - Handles multiple game rooms
// =============================================================================

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RoomInfo {
    pub code: String,
    pub owner_name: Option<String>,
    pub player_count: usize,
    pub max_players: usize,
    pub settings: RoomSettings,
    pub status: String,
}

#[derive(Message)]
#[rtype(result = "Option<(String, Addr<GameRoom>)>")]
pub struct CreateRoom {
    pub settings: RoomSettings,
    pub is_public: bool,
}

#[derive(Message)]
#[rtype(result = "Option<Addr<GameRoom>>")]
pub struct JoinRoom {
    pub code: String,
}

#[derive(Message)]
#[rtype(result = "Option<Addr<GameRoom>>")]
pub struct QuickMatch;

#[derive(Message)]
#[rtype(result = "Vec<RoomInfo>")]
pub struct ListRooms;

pub struct RoomManager {
    pub rooms: HashMap<String, Addr<GameRoom>>,
    pub room_codes: HashMap<String, String>, // code -> room_id
}

impl Default for RoomManager {
    fn default() -> Self {
        RoomManager {
            rooms: HashMap::new(),
            room_codes: HashMap::new(),
        }
    }
}

impl Actor for RoomManager {
    type Context = Context<Self>;
}

impl Handler<CreateRoom> for RoomManager {
    type Result = Option<(String, Addr<GameRoom>)>;

    fn handle(&mut self, msg: CreateRoom, _ctx: &mut Self::Context) -> Self::Result {
        let room_id = Uuid::new_v4().to_string();
        let room_code = GameRoom::generate_room_code();
        
        // Ensure unique code
        let mut code = room_code.clone();
        while self.room_codes.contains_key(&code) {
            code = GameRoom::generate_room_code();
        }
        
        let room = GameRoom::new(room_id.clone(), code.clone(), msg.settings, msg.is_public);
        let room_addr = room.start();
        
        self.rooms.insert(room_id.clone(), room_addr.clone());
        self.room_codes.insert(code.clone(), room_id);
        
        log::info!("Created room with code: {}", code);
        Some((code, room_addr))
    }
}

impl Handler<JoinRoom> for RoomManager {
    type Result = Option<Addr<GameRoom>>;

    fn handle(&mut self, msg: JoinRoom, _ctx: &mut Self::Context) -> Self::Result {
        let code = msg.code.to_uppercase();
        if let Some(room_id) = self.room_codes.get(&code) {
            if let Some(room_addr) = self.rooms.get(room_id) {
                log::info!("Player joining room: {}", code);
                return Some(room_addr.clone());
            }
        }
        log::warn!("Room not found: {}", code);
        None
    }
}

impl Handler<QuickMatch> for RoomManager {
    type Result = Option<Addr<GameRoom>>;

    fn handle(&mut self, _msg: QuickMatch, ctx: &mut Self::Context) -> Self::Result {
        // Find a public room that's not full and not in game
        // For now, create a new public room if none available
        // TODO: Actually find existing public rooms
        
        let result = self.handle(CreateRoom {
            settings: RoomSettings::default(),
            is_public: true,
        }, ctx);
        
        result.map(|(_, addr)| addr)
    }
}

// =============================================================================
// GAME ROOM
// =============================================================================

pub struct GameRoom {
    pub room_id: String,
    pub room_code: String,
    pub owner_id: Option<String>,
    pub settings: RoomSettings,
    pub sessions: HashMap<String, Addr<SnakeSession>>,
    pub state: GameState,
    pub powerup_spawn_ticks: u32, 
    pub game_loop_running: bool,
    pub is_public: bool,
}

impl GameRoom {
    pub fn new(room_id: String, room_code: String, settings: RoomSettings, is_public: bool) -> Self {
        let (width, height) = settings.map_size.dimensions();
        let mut state = GameState::new();
        state.grid_width = width;
        state.grid_height = height;
        
        GameRoom {
            room_id,
            room_code,
            owner_id: None,
            settings,
            sessions: HashMap::new(),
            state,
            powerup_spawn_ticks: 0,
            game_loop_running: false,
            is_public,
        }
    }

    pub fn generate_room_code() -> String {
        const CHARS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let mut rng = rand::thread_rng();
        (0..6)
            .map(|_| {
                let idx = rng.gen_range(0..CHARS.len());
                CHARS[idx] as char
            })
            .collect()
    }

    fn broadcast(&self, msg: ServerMessage) {
        let msg_str = serde_json::to_string(&msg).unwrap();
        for addr in self.sessions.values() {
            addr.do_send(WsMessage(msg_str.clone()));
        }
    }

    fn send_to(&self, id: &str, msg: ServerMessage) {
        if let Some(addr) = self.sessions.get(id) {
            let msg_str = serde_json::to_string(&msg).unwrap();
            addr.do_send(WsMessage(msg_str));
        }
    }

    /// Spawn a bot player with specified difficulty
    pub fn spawn_bot(&mut self, difficulty: BotDifficulty) {
        if self.state.players.len() >= MAX_PLAYERS {
            return; // Room is full
        }

        let bot_id = format!("bot_{}", Uuid::new_v4());
        let bot_name = format!("{} Bot", match difficulty {
            BotDifficulty::Easy => "Easy",
            BotDifficulty::Medium => "Medium",
            BotDifficulty::Hard => "Hard",
        });

        let idx = self.state.players.len();
        let (pos, dir) = GameState::get_spawn_position(idx);
        let color = PLAYER_COLORS[idx % 4].to_string();

        let bot_player = Player {
            id: bot_id.clone(),
            user_id: None,
            access_token: None,
            name: bot_name.clone(),
            snake: Snake::new(pos, dir, color),
            ready: true,                    // Bots are always ready
            active_power: None,
            is_bot: true,
            difficulty: Some(difficulty),
        };

        self.state.players.insert(bot_id.clone(), bot_player);
        self.broadcast(ServerMessage::PlayerJoined { 
            player_id: bot_id, 
            name: bot_name 
        });
        self.broadcast(ServerMessage::GameState(self.state.clone()));
    }

    fn tick(&mut self) {
        // Handle countdown phase
        if self.state.phase == GamePhase::Countdown {
            if self.state.countdown > 0 {
                // Increment tick counter
                self.state.countdown_ticks += 1;
                
                // Decrement countdown every second (TICKS_PER_SECOND ticks)
                if self.state.countdown_ticks >= TICKS_PER_SECOND {
                    self.state.countdown -= 1;
                    self.state.countdown_ticks = 0; // Reset tick counter
                    self.broadcast(ServerMessage::GameState(self.state.clone()));
                }
                
                if self.state.countdown == 0 {
                    // Countdown finished, start playing
                    self.state.phase = GamePhase::Playing;
                    self.broadcast(ServerMessage::GameStarted);
                    self.broadcast(ServerMessage::GameState(self.state.clone()));
                }
            }
            return; 
        }
        
        if self.state.phase != GamePhase::Playing {
            return;
        }

        // =================================================================
        // POWER-UP SPAWNING
        // =================================================================
        
        if self.state.phase == GamePhase::Playing {
            self.powerup_spawn_ticks += 1;
            
            // Spawn power-up every 10 seconds (~67 ticks at 150ms per tick)
            if self.powerup_spawn_ticks >= (POWERUP_SPAWN_INTERVAL.as_millis() / TICK_INTERVAL.as_millis()) as u32 {
                self.powerup_spawn_ticks = 0;
                
                // Spawn a random power-up
                let mut rng = rand::thread_rng();
                let power_types = [PowerUpType::SpeedBoost, PowerUpType::Shield, PowerUpType::Grow, PowerUpType::Ghost];
                let power_type = power_types[rng.gen_range(0..power_types.len())].clone();
                
                // Find random empty position
                for _ in 0..50 {  // Try 50 times
                    let pos = Point {
                        x: rng.gen_range(1..self.state.grid_width - 1),
                        y: rng.gen_range(1..self.state.grid_height - 1),
                    };
                    
                    // Check if position is empty
                    let on_snake = self.state.players.values().any(|p| p.snake.body.contains(&pos));
                    let on_food = self.state.food.contains(&pos);
                    let on_powerup = self.state.power_ups.iter().any(|pu| pu.position == pos);
                    
                    if !on_snake && !on_food && !on_powerup {
                        self.state.power_ups.push(PowerUp {
                            id: Uuid::new_v4().to_string(),
                            position: pos,
                            power_type,
                        });
                        break;
                    }
                }
            }
        }

        // =================================================================
        // BOT AI DECISIONS
        // =================================================================
        
        // Bots decide their next direction
        let bot_ids: Vec<String> = self.state.players.iter()
            .filter(|(_, p)| p.is_bot && p.snake.alive)
            .map(|(id, _)| id.clone())
            .collect();
            
        for bot_id in bot_ids {
            if let Some(new_dir) = self.state.bot_decide_direction(&bot_id) {
                if let Some(player) = self.state.players.get_mut(&bot_id) {
                    player.snake.set_direction(new_dir);
                }
            }
        }

        // Move all alive snakes
        for player in self.state.players.values_mut() {
            if player.snake.alive {
                player.snake.move_forward();
            }
        }

        // Check wall collisions
        for player in self.state.players.values_mut() {
            if player.snake.alive {
                let head = player.snake.head();
                if head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT {
                    // Ghost can pass through walls (wrap around)
                    if let Some(ref power) = player.active_power {
                        if power.power_type == PowerUpType::Ghost {
                            // Wrap around
                            let new_x = if head.x < 0 { GRID_WIDTH - 1 } 
                                       else if head.x >= GRID_WIDTH { 0 } 
                                       else { head.x };
                            let new_y = if head.y < 0 { GRID_HEIGHT - 1 } 
                                       else if head.y >= GRID_HEIGHT { 0 } 
                                       else { head.y };
                            player.snake.body[0] = Point { x: new_x, y: new_y };
                        } else if power.power_type == PowerUpType::Shield {
                            // Shield just prevents death, but snake still dies if not ghost
                        } else {
                            player.snake.alive = false;
                        }
                    } else {
                        player.snake.alive = false;
                    }
                }
            }
        }

        // Check self-collision (Shield and Ghost both protect)
        for player in self.state.players.values_mut() {
            if player.snake.alive {
                let head = player.snake.head().clone();
                let has_protection = player.active_power.as_ref()
                    .map(|p| p.power_type == PowerUpType::Shield || p.power_type == PowerUpType::Ghost)
                    .unwrap_or(false);
                    
                if !has_protection && player.snake.body.iter().skip(1).any(|p| *p == head) {
                    player.snake.alive = false;
                }
            }
        }

        // Check player-to-player collision (Shield and Ghost both protect)
        let player_ids: Vec<String> = self.state.players.keys().cloned().collect();
        for id in &player_ids {
            let (head, has_protection) = {
                let player = self.state.players.get(id).unwrap();
                if !player.snake.alive {
                    continue;
                }
                let protected = player.active_power.as_ref()
                    .map(|p| p.power_type == PowerUpType::Shield || p.power_type == PowerUpType::Ghost)
                    .unwrap_or(false);
                (player.snake.head().clone(), protected)
            };

            // Skip collision check if player has protection
            if has_protection {
                continue;
            }

            for other_id in &player_ids {
                if id == other_id {
                    continue;
                }
                let other = self.state.players.get(other_id).unwrap();
                if other.snake.body.contains(&head) {
                    self.state.players.get_mut(id).unwrap().snake.alive = false;
                    break;
                }
            }
        }

        // Check food consumption
        let mut eaten_food: Vec<Point> = Vec::new();
        for player in self.state.players.values_mut() {
            if player.snake.alive {
                let head = player.snake.head().clone();
                if let Some(idx) = self.state.food.iter().position(|f| *f == head) {
                    eaten_food.push(self.state.food.remove(idx));
                    player.snake.grow();
                }
            }
        }

        // Spawn new food if eaten
        for _ in eaten_food {
            self.state.spawn_food();
        }

        // =================================================================
        // POWER-UP COLLECTION
        // =================================================================
        
        let mut collected_powerups: Vec<String> = Vec::new();
        for player in self.state.players.values_mut() {
            if player.snake.alive {
                let head = player.snake.head().clone();
                if let Some(idx) = self.state.power_ups.iter().position(|pu| pu.position == head) {
                    let powerup = self.state.power_ups[idx].clone();
                    collected_powerups.push(powerup.id.clone());
                    
                    // Apply power-up effect
                    match powerup.power_type {
                        PowerUpType::Grow => {
                            // Instant effect: grow +5 segments
                            for _ in 0..5 {
                                player.snake.grow();
                            }
                        },
                        PowerUpType::SpeedBoost => {
                            let ticks = (POWERUP_SPEED_DURATION.as_millis() / TICK_INTERVAL.as_millis()) as u32;
                            player.active_power = Some(ActivePowerUp {
                                power_type: PowerUpType::SpeedBoost,
                                ticks_remaining: ticks,
                            });
                        },
                        PowerUpType::Shield => {
                            let ticks = (POWERUP_SHIELD_DURATION.as_millis() / TICK_INTERVAL.as_millis()) as u32;
                            player.active_power = Some(ActivePowerUp {
                                power_type: PowerUpType::Shield,
                                ticks_remaining: ticks,
                            });
                        },
                        PowerUpType::Ghost => {
                            let ticks = (POWERUP_GHOST_DURATION.as_millis() / TICK_INTERVAL.as_millis()) as u32;
                            player.active_power = Some(ActivePowerUp {
                                power_type: PowerUpType::Ghost,
                                ticks_remaining: ticks,
                            });
                        },
                    }
                }
            }
        }
        
        // Remove collected power-ups
        self.state.power_ups.retain(|pu| !collected_powerups.contains(&pu.id));

        // Update active power-ups (decrement timers)
        for player in self.state.players.values_mut() {
            if let Some(ref mut active_power) = player.active_power {
                active_power.ticks_remaining = active_power.ticks_remaining.saturating_sub(1);
                if active_power.ticks_remaining == 0 {
                    player.active_power = None;
                }
            }
        }

        // Check game over
        let alive_count = self.state.players.values().filter(|p| p.snake.alive).count();
        let total_players = self.state.players.len();
        
        if total_players > 1 && alive_count <= 1 {
            self.state.phase = GamePhase::GameOver;
            self.state.winner = self.state.players.values()
                .find(|p| p.snake.alive)
                .map(|p| p.name.clone());
            
            self.broadcast(ServerMessage::GameOver { 
                winner: self.state.winner.clone() 
            });
        } else if total_players == 1 && alive_count == 0 {
            self.state.phase = GamePhase::GameOver;
            self.state.winner = None;
            self.broadcast(ServerMessage::GameOver { winner: None });
        }

        // Save scores if game over
        if self.state.phase == GamePhase::GameOver {
            for player in self.state.players.values() {
                if let (Some(user_id), Some(token)) = (&player.user_id, &player.access_token) {
                    save_score(user_id, player.snake.score, token);
                }
            }
        }

        self.broadcast(ServerMessage::GameState(self.state.clone()));
    }

    fn start_game(&mut self, ctx: &mut Context<Self>) {
        if self.state.players.is_empty() {
            return;
        }

        // Reset snakes to spawn positions
        let player_ids: Vec<String> = self.state.players.keys().cloned().collect();
        for (idx, id) in player_ids.iter().enumerate() {
            let (pos, dir) = GameState::get_spawn_position(idx);
            let color = PLAYER_COLORS[idx % 4].to_string();
            if let Some(player) = self.state.players.get_mut(id) {
                player.snake = Snake::new(pos, dir, color);
            }
        }

        // Spawn initial food
        self.state.food.clear();
        for _ in 0..3 {
            self.state.spawn_food();
        }

        // Clear power-ups
        self.state.power_ups.clear();
        self.powerup_spawn_ticks = 0;

        // Start countdown instead of playing immediately
        self.state.phase = GamePhase::Countdown;
        self.state.countdown = COUNTDOWN_DURATION;
        self.state.countdown_ticks = 0; // Reset tick counter
        self.state.winner = None;
        self.broadcast(ServerMessage::GameState(self.state.clone()));

        // Start game loop ONLY if not already running (prevents speed accumulation!)
        if !self.game_loop_running {
            self.game_loop_running = true;
            ctx.run_interval(TICK_INTERVAL, |act, _ctx| {
                act.tick();
            });
        }
    }
}

impl Actor for GameRoom {
    type Context = Context<Self>;
}

impl Handler<Connect> for GameRoom {
    type Result = ();

    fn handle(&mut self, msg: Connect, _ctx: &mut Self::Context) -> Self::Result {
        let id = msg.id.clone();
        self.sessions.insert(id.clone(), msg.addr);
        self.send_to(&id.clone(), ServerMessage::Welcome { player_id: id.clone() });
        // Send initial game state so frontend can render lobby
        self.send_to(&id, ServerMessage::GameState(self.state.clone()));
    }
}

impl Handler<Disconnect> for GameRoom {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _ctx: &mut Self::Context) -> Self::Result {
        let id = msg.id.clone();
        self.sessions.remove(&id);
        self.state.players.remove(&id);
        self.broadcast(ServerMessage::PlayerLeft { player_id: id });
        
        // Reset game to Lobby when all players leave
        if self.state.players.is_empty() {
            self.state.phase = GamePhase::Lobby;
            self.state.food.clear();
            self.state.power_ups.clear();
            self.state.winner = None;
            self.state.countdown = 0;
            self.game_loop_running = false; // Allow new game loop to start
            self.powerup_spawn_ticks = 0;
        }
        
        self.broadcast(ServerMessage::GameState(self.state.clone()));
    }
}

impl Handler<ClientAction> for GameRoom {
    type Result = ();

    fn handle(&mut self, action: ClientAction, ctx: &mut Self::Context) -> Self::Result {
        match action.msg {
            ClientMessage::Join { name, user_id, access_token } => {
                if self.state.players.len() >= MAX_PLAYERS {
                    self.send_to(&action.id, ServerMessage::Error { 
                        message: "Room is full (max 4 players)".to_string() 
                    });
                    return;
                }

                if self.state.phase == GamePhase::Playing {
                    self.send_to(&action.id, ServerMessage::Error { 
                        message: "Game already in progress".to_string() 
                    });
                    return;
                }

                let idx = self.state.players.len();
                let (pos, dir) = GameState::get_spawn_position(idx);
                let color = PLAYER_COLORS[idx % 4].to_string();

                let player = Player {
                    id: action.id.clone(),
                    user_id,
                    access_token,
                    name: name.clone(),
                    snake: Snake::new(pos, dir, color),
                    ready: false,
                    active_power: None,
                    is_bot: false,              // Human player
                    difficulty: None,           // No AI difficulty for humans
                };

                self.state.players.insert(action.id.clone(), player);
                self.broadcast(ServerMessage::PlayerJoined { 
                    player_id: action.id, 
                    name 
                });
                self.broadcast(ServerMessage::GameState(self.state.clone()));
            }

            ClientMessage::Ready => {
                if let Some(player) = self.state.players.get_mut(&action.id) {
                    player.ready = true;
                }
                self.broadcast(ServerMessage::GameState(self.state.clone()));
            }

            ClientMessage::Direction { direction } => {
                if let Some(player) = self.state.players.get_mut(&action.id) {
                    player.snake.set_direction(direction);
                }
            }

            ClientMessage::StartGame => {
                // Only start if all players are ready
                let all_ready = !self.state.players.is_empty() 
                    && self.state.players.values().all(|p| p.ready);
                
                if all_ready && self.state.phase == GamePhase::Lobby {
                    self.start_game(ctx);
                }
            }

            ClientMessage::Restart => {
                if self.state.phase == GamePhase::GameOver {
                    self.state.phase = GamePhase::Lobby;
                    for player in self.state.players.values_mut() {
                        player.ready = false;
                    }
                    self.broadcast(ServerMessage::GameState(self.state.clone()));
                }
            }

            ClientMessage::PlayAgain => {
                if self.state.phase == GamePhase::GameOver {
                    // Quick rematch - reset ready states and auto-start if all ready
                    for player in self.state.players.values_mut() {
                        player.ready = false;
                    }
                    self.state.phase = GamePhase::Lobby;
                    self.broadcast(ServerMessage::GameState(self.state.clone()));
                }
            }
        }
    }
}

impl Handler<SpawnBot> for GameRoom {
    type Result = ();

    fn handle(&mut self, msg: SpawnBot, _ctx: &mut Self::Context) -> Self::Result {
        self.spawn_bot(msg.difficulty);
    }
}

// =============================================================================
// WEBSOCKET SESSION
// =============================================================================

#[derive(Message)]
#[rtype(result = "()")]
pub struct WsMessage(pub String);

pub struct SnakeSession {
    pub id: String,
    pub room: Addr<GameRoom>,
    pub hb: Instant,
}

impl SnakeSession {
    pub fn new(room: Addr<GameRoom>) -> Self {
        SnakeSession {
            id: Uuid::new_v4().to_string(),
            room,
            hb: Instant::now(),
        }
    }

    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                log::warn!("WebSocket client heartbeat failed, disconnecting!");
                act.room.do_send(Disconnect { id: act.id.clone() });
                ctx.stop();
                return;
            }
            ctx.ping(b"");
        });
    }
}

impl Actor for SnakeSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);

        self.room.do_send(Connect {
            addr: ctx.address(),
            id: self.id.clone(),
        });
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        self.room.do_send(Disconnect { id: self.id.clone() });
    }
}

impl Handler<WsMessage> for SnakeSession {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) {
        ctx.text(msg.0);
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for SnakeSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                    self.room.do_send(ClientAction {
                        id: self.id.clone(),
                        msg: client_msg,
                    });
                }
            }
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => {}
        }
    }
}
