# 01 - Rust Backend Setup (Axum + Tokio)

> Set up a high-performance async Rust backend using Axum web framework.

---

## 🎯 Objective

Create the foundation Rust server with:
- Axum HTTP server
- Tokio async runtime
- CORS configuration for Next.js frontend
- Environment configuration
- Health check endpoints
- Connection to Supabase PostgreSQL

---

## 📦 Dependencies

Create `backend/Cargo.toml`:

```toml
[package]
name = "chill-space-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web Framework
axum = { version = "0.7", features = ["ws", "macros"] }
tokio = { version = "1.35", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }

# Utilities
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
thiserror = "1.0"

# Auth
jsonwebtoken = "9.2"
```

---

## 📁 Project Structure

```
backend/
├── Cargo.toml
├── .env
└── src/
    ├── main.rs           # Entry point + server setup
    ├── config.rs         # Environment configuration
    ├── error.rs          # Custom error types
    ├── routes/
    │   ├── mod.rs        # Route aggregation
    │   ├── health.rs     # Health check endpoints
    │   └── rooms.rs      # Room CRUD operations
    └── models/
        ├── mod.rs
        └── room.rs       # Room data structures
```

---

## 🔧 Implementation Steps

### Step 1: Environment Configuration

Create `backend/.env`:

```env
# Server
HOST=127.0.0.1
PORT=8080

# Database (from Supabase dashboard)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# JWT Secret (from Supabase)
JWT_SECRET=your-supabase-jwt-secret
```

---

### Step 2: Configuration Module

Create `backend/src/config.rs`:

```rust
use std::env;

#[derive(Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub frontend_url: String,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        dotenvy::dotenv().ok();
        
        Ok(Config {
            host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .expect("PORT must be a number"),
            database_url: env::var("DATABASE_URL")?,
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            jwt_secret: env::var("JWT_SECRET")?,
        })
    }
}
```

---

### Step 3: Error Handling

Create `backend/src/error.rs`:

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Unauthorized")]
    Unauthorized,
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.as_str()),
        };

        let body = Json(json!({
            "error": message,
            "status": status.as_u16()
        }));

        (status, body).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
```

---

### Step 4: Health Check Routes

Create `backend/src/routes/health.rs`:

```rust
use axum::{Json, extract::State};
use serde::Serialize;
use sqlx::PgPool;

use crate::error::Result;

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    version: String,
    database: String,
}

pub async fn health_check(State(pool): State<PgPool>) -> Result<Json<HealthResponse>> {
    // Test database connection
    let db_status = match sqlx::query("SELECT 1").execute(&pool).await {
        Ok(_) => "connected".to_string(),
        Err(e) => format!("error: {}", e),
    };

    Ok(Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: db_status,
    }))
}
```

---

### Step 5: Route Aggregation

Create `backend/src/routes/mod.rs`:

```rust
pub mod health;

use axum::{routing::get, Router};
use sqlx::PgPool;

pub fn create_router(pool: PgPool) -> Router {
    Router::new()
        .route("/health", get(health::health_check))
        .route("/api/v1/ping", get(|| async { "pong" }))
        .with_state(pool)
}
```

---

### Step 6: Main Entry Point

Create `backend/src/main.rs`:

```rust
mod config;
mod error;
mod routes;

use std::net::SocketAddr;

use axum::http::{HeaderValue, Method};
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env().expect("Failed to load configuration");
    
    tracing::info!("🦀 Starting Chill Space Backend v{}", env!("CARGO_PKG_VERSION"));

    // Create database pool
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("✅ Connected to database");

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(config.frontend_url.parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(tower_http::cors::Any);

    // Build router
    let app = routes::create_router(pool)
        .layer(cors)
        .layer(tower_http::trace::TraceLayer::new_for_http());

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], config.port));
    tracing::info!("🚀 Server running on http://{}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
```

---

## ✅ Testing

### Run the server:

```bash
cd backend
cargo run
```

### Test endpoints:

```bash
# Health check
curl http://localhost:8080/health

# Ping
curl http://localhost:8080/api/v1/ping
```

### Expected output:

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "database": "connected"
}
```

---

## 📝 Next Steps

After completing this setup:
1. ✅ Server is running with Axum + Tokio
2. ✅ Database connection established
3. ✅ CORS configured for frontend
4. → Proceed to [02_WEBSOCKET_REALTIME.md](./02_WEBSOCKET_REALTIME.md)

---

## 🔗 Resources

- [Axum Documentation](https://docs.rs/axum/latest/axum/)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [SQLx Guide](https://github.com/launchbadge/sqlx)
