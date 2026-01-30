# 02 - WebSocket Real-time Communication

> Implement WebSocket connections for real-time collaboration in study rooms.

---

## 🎯 Objective

Build a robust WebSocket system that handles:
- User connections/disconnections
- Room-based message broadcasting
- Presence tracking (who's online)
- Heartbeat/ping-pong for connection health
- Message types for different features (chat, cursor, typing)

---

## 📦 Additional Dependencies

Add to `backend/Cargo.toml`:

```toml
[dependencies]
# ... existing dependencies ...

# WebSocket
axum = { version = "0.7", features = ["ws", "macros"] }
tokio-tungstenite = "0.21"
futures = "0.3"

# State management
dashmap = "5.5"  # Concurrent HashMap
```

---

## 📁 New Files Structure

```
backend/src/
├── ws/
│   ├── mod.rs           # WebSocket module
│   ├── handler.rs       # Connection handler
│   ├── messages.rs      # Message types
│   └── room_manager.rs  # Room state management
```

---

## 🔧 Implementation Steps

### Step 1: Define Message Types

Create `backend/src/ws/messages.rs`:

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Client → Server messages
#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum ClientMessage {
    /// Join a room
    JoinRoom { room_id: Uuid },
    
    /// Leave current room
    LeaveRoom,
    
    /// Send chat message
    Chat { content: String },
    
    /// Update cursor position
    CursorMove { x: f64, y: f64, element_id: Option<String> },
    
    /// User is typing
    Typing { is_typing: bool },
    
    /// Heartbeat ping
    Ping,
}

/// Server → Client messages
#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum ServerMessage {
    /// Welcome message with connection info
    Welcome { connection_id: Uuid },
    
    /// Successfully joined room
    JoinedRoom { room_id: Uuid, users: Vec<UserPresence> },
    
    /// User joined the room
    UserJoined { user: UserPresence },
    
    /// User left the room
    UserLeft { user_id: Uuid },
    
    /// Chat message received
    Chat { user_id: Uuid, username: String, content: String, timestamp: i64 },
    
    /// Cursor position update from another user
    CursorUpdate { user_id: Uuid, x: f64, y: f64, element_id: Option<String> },
    
    /// User typing status
    TypingStatus { user_id: Uuid, is_typing: bool },
    
    /// Heartbeat response
    Pong,
    
    /// Error message
    Error { message: String },
}

#[derive(Debug, Serialize, Clone)]
pub struct UserPresence {
    pub user_id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub cursor: Option<CursorPosition>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CursorPosition {
    pub x: f64,
    pub y: f64,
    pub element_id: Option<String>,
}
```

---

### Step 2: Room Manager (Concurrent State)

Create `backend/src/ws/room_manager.rs`:

```rust
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use super::messages::{ServerMessage, UserPresence};

/// Manages all active rooms and their connections
#[derive(Clone)]
pub struct RoomManager {
    /// Map of room_id → Room
    rooms: Arc<DashMap<Uuid, Room>>,
}

struct Room {
    /// Broadcast channel for room messages
    tx: broadcast::Sender<ServerMessage>,
    /// Connected users
    users: DashMap<Uuid, UserPresence>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
        }
    }

    /// Get or create a room, returns broadcast sender
    pub fn get_or_create_room(&self, room_id: Uuid) -> broadcast::Sender<ServerMessage> {
        self.rooms
            .entry(room_id)
            .or_insert_with(|| {
                let (tx, _) = broadcast::channel(1000);
                Room {
                    tx,
                    users: DashMap::new(),
                }
            })
            .tx
            .clone()
    }

    /// Subscribe to room messages
    pub fn subscribe(&self, room_id: Uuid) -> Option<broadcast::Receiver<ServerMessage>> {
        self.rooms.get(&room_id).map(|room| room.tx.subscribe())
    }

    /// Add user to room
    pub fn join_room(&self, room_id: Uuid, user: UserPresence) -> Vec<UserPresence> {
        if let Some(room) = self.rooms.get(&room_id) {
            room.users.insert(user.user_id, user.clone());
            
            // Broadcast join event
            let _ = room.tx.send(ServerMessage::UserJoined { user });
            
            // Return list of all users
            room.users.iter().map(|r| r.value().clone()).collect()
        } else {
            vec![]
        }
    }

    /// Remove user from room
    pub fn leave_room(&self, room_id: Uuid, user_id: Uuid) {
        if let Some(room) = self.rooms.get(&room_id) {
            room.users.remove(&user_id);
            let _ = room.tx.send(ServerMessage::UserLeft { user_id });

            // Clean up empty rooms
            if room.users.is_empty() {
                drop(room);
                self.rooms.remove(&room_id);
            }
        }
    }

    /// Broadcast message to room
    pub fn broadcast(&self, room_id: Uuid, message: ServerMessage) {
        if let Some(room) = self.rooms.get(&room_id) {
            let _ = room.tx.send(message);
        }
    }

    /// Update user cursor position
    pub fn update_cursor(&self, room_id: Uuid, user_id: Uuid, x: f64, y: f64, element_id: Option<String>) {
        if let Some(room) = self.rooms.get(&room_id) {
            if let Some(mut user) = room.users.get_mut(&user_id) {
                user.cursor = Some(super::messages::CursorPosition { x, y, element_id: element_id.clone() });
            }
            let _ = room.tx.send(ServerMessage::CursorUpdate { user_id, x, y, element_id });
        }
    }
}

impl Default for RoomManager {
    fn default() -> Self {
        Self::new()
    }
}
```

---

### Step 3: WebSocket Handler

Create `backend/src/ws/handler.rs`:

```rust
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::Response,
};
use futures::{SinkExt, StreamExt};
use uuid::Uuid;

use super::{
    messages::{ClientMessage, ServerMessage, UserPresence},
    room_manager::RoomManager,
};

#[derive(Clone)]
pub struct WsState {
    pub room_manager: RoomManager,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<WsState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: WsState) {
    let (mut sender, mut receiver) = socket.split();
    
    let connection_id = Uuid::new_v4();
    let mut current_room: Option<Uuid> = None;
    let user_id = Uuid::new_v4(); // In production, extract from JWT
    
    // Send welcome message
    let welcome = ServerMessage::Welcome { connection_id };
    if sender.send(Message::Text(serde_json::to_string(&welcome).unwrap())).await.is_err() {
        return;
    }

    tracing::info!("New WebSocket connection: {}", connection_id);

    // Spawn task to receive room broadcasts
    let room_manager = state.room_manager.clone();
    let (internal_tx, mut internal_rx) = tokio::sync::mpsc::channel::<ServerMessage>(100);

    // Forward broadcast messages to client
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = internal_rx.recv().await {
            if sender.send(Message::Text(serde_json::to_string(&msg).unwrap())).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages
    let recv_room_manager = room_manager.clone();
    let internal_tx_clone = internal_tx.clone();
    
    while let Some(Ok(msg)) = receiver.next().await {
        match msg {
            Message::Text(text) => {
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                    match client_msg {
                        ClientMessage::JoinRoom { room_id } => {
                            // Leave previous room if any
                            if let Some(old_room) = current_room.take() {
                                recv_room_manager.leave_room(old_room, user_id);
                            }

                            // Join new room
                            let _ = recv_room_manager.get_or_create_room(room_id);
                            let user = UserPresence {
                                user_id,
                                username: "User".to_string(), // Get from JWT
                                avatar_url: None,
                                cursor: None,
                            };
                            
                            let users = recv_room_manager.join_room(room_id, user);
                            current_room = Some(room_id);

                            // Subscribe to room broadcasts
                            if let Some(mut rx) = recv_room_manager.subscribe(room_id) {
                                let tx = internal_tx_clone.clone();
                                tokio::spawn(async move {
                                    while let Ok(msg) = rx.recv().await {
                                        if tx.send(msg).await.is_err() {
                                            break;
                                        }
                                    }
                                });
                            }

                            let _ = internal_tx_clone.send(ServerMessage::JoinedRoom { room_id, users }).await;
                        }
                        
                        ClientMessage::LeaveRoom => {
                            if let Some(room_id) = current_room.take() {
                                recv_room_manager.leave_room(room_id, user_id);
                            }
                        }
                        
                        ClientMessage::Chat { content } => {
                            if let Some(room_id) = current_room {
                                recv_room_manager.broadcast(
                                    room_id,
                                    ServerMessage::Chat {
                                        user_id,
                                        username: "User".to_string(),
                                        content,
                                        timestamp: chrono::Utc::now().timestamp(),
                                    },
                                );
                            }
                        }
                        
                        ClientMessage::CursorMove { x, y, element_id } => {
                            if let Some(room_id) = current_room {
                                recv_room_manager.update_cursor(room_id, user_id, x, y, element_id);
                            }
                        }
                        
                        ClientMessage::Typing { is_typing } => {
                            if let Some(room_id) = current_room {
                                recv_room_manager.broadcast(
                                    room_id,
                                    ServerMessage::TypingStatus { user_id, is_typing },
                                );
                            }
                        }
                        
                        ClientMessage::Ping => {
                            let _ = internal_tx_clone.send(ServerMessage::Pong).await;
                        }
                    }
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    // Cleanup on disconnect
    if let Some(room_id) = current_room {
        room_manager.leave_room(room_id, user_id);
    }
    
    send_task.abort();
    tracing::info!("WebSocket disconnected: {}", connection_id);
}
```

---

### Step 4: Module Export

Create `backend/src/ws/mod.rs`:

```rust
pub mod handler;
pub mod messages;
pub mod room_manager;

pub use handler::{ws_handler, WsState};
pub use room_manager::RoomManager;
```

---

### Step 5: Update Main Router

Update `backend/src/routes/mod.rs`:

```rust
pub mod health;

use axum::{routing::get, Router};
use sqlx::PgPool;

use crate::ws::{ws_handler, WsState, RoomManager};

pub fn create_router(pool: PgPool) -> Router {
    let ws_state = WsState {
        room_manager: RoomManager::new(),
    };

    Router::new()
        .route("/health", get(health::health_check))
        .route("/api/v1/ping", get(|| async { "pong" }))
        .route("/ws", get(ws_handler))
        .with_state(ws_state)
        .with_state(pool)
}
```

---

## 🖥️ Frontend Integration

### React Hook for WebSocket:

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react';

type ServerMessage = {
  type: string;
  payload: any;
};

export function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  const send = useCallback((type: string, payload: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    send('JoinRoom', { room_id: roomId });
  }, [send]);

  const sendChat = useCallback((content: string) => {
    send('Chat', { content });
  }, [send]);

  return { isConnected, lastMessage, send, joinRoom, sendChat };
}
```

---

## ✅ Testing

### Test WebSocket with websocat:

```bash
# Install websocat
cargo install websocat

# Connect to WebSocket
websocat ws://localhost:8080/ws

# Send join room message
{"type":"JoinRoom","payload":{"room_id":"550e8400-e29b-41d4-a716-446655440000"}}

# Send chat message
{"type":"Chat","payload":{"content":"Hello, room!"}}
```

---

## 📝 Next Steps

After completing WebSocket implementation:
1. ✅ Real-time connections working
2. ✅ Room-based broadcasting
3. ✅ Presence tracking
4. → Proceed to [03_CRDT_COLLABORATION.md](./03_CRDT_COLLABORATION.md)

---

## 🔗 Resources

- [Axum WebSocket Example](https://github.com/tokio-rs/axum/tree/main/examples/websockets)
- [Tokio Broadcast Channels](https://tokio.rs/tokio/tutorial/channels)
