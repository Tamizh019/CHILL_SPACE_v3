mod game_state;
mod games;
mod code_runner;
mod routes;
mod middleware;
mod config;
mod error;
mod metrics;

use actix_web::{web, App, HttpServer, middleware as actix_middleware};
use actix_cors::Cors;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::signal;
use game_state::GameState;
use config::ServerConfig;
use metrics::MetricsCollector;

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const DEFAULT_WORKERS: usize = 4;
const DEFAULT_KEEP_ALIVE: u64 = 75;
const DEFAULT_CLIENT_TIMEOUT: u64 = 30;
const DEFAULT_SHUTDOWN_TIMEOUT: u64 = 60;
const MAX_PAYLOAD_SIZE: usize = 10 * 1024 * 1024; // 10MB
const MAX_CONNECTIONS: usize = 25000;

// ============================================================================
// APPLICATION STATE
// ============================================================================

#[derive(Clone)]
pub struct AppState {
    pub game_state: web::Data<Mutex<GameState>>,
    pub metrics: Arc<Mutex<MetricsCollector>>,
    pub config: Arc<ServerConfig>,
    pub start_time: std::time::Instant,
}

impl AppState {
    pub fn new(config: ServerConfig) -> Self {
        Self {
            game_state: web::Data::new(Mutex::new(GameState::new())),
            metrics: Arc::new(Mutex::new(MetricsCollector::new())),
            config: Arc::new(config),
            start_time: std::time::Instant::now(),
        }
    }

    pub fn uptime_seconds(&self) -> u64 {
        self.start_time.elapsed().as_secs()
    }
}

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

fn init_logger() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format_timestamp_millis()
        .init();
}

fn load_config() -> ServerConfig {
    ServerConfig {
        host: std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
        port: std::env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8080),
        workers: std::env::var("WORKERS")
            .ok()
            .and_then(|w| w.parse().ok())
            .unwrap_or(DEFAULT_WORKERS),
        keep_alive: Duration::from_secs(DEFAULT_KEEP_ALIVE),
        client_timeout: Duration::from_secs(DEFAULT_CLIENT_TIMEOUT),
        shutdown_timeout: Duration::from_secs(DEFAULT_SHUTDOWN_TIMEOUT),
        enable_cors: std::env::var("ENABLE_CORS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(true),
        max_connections: std::env::var("MAX_CONNECTIONS")
            .ok()
            .and_then(|m| m.parse().ok())
            .unwrap_or(MAX_CONNECTIONS),
        tls_enabled: std::env::var("TLS_ENABLED")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(false),
    }
}

fn configure_cors(enabled: bool) -> Cors {
    if enabled {
        Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600)
            .supports_credentials()
    } else {
        Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::ACCEPT,
                actix_web::http::header::CONTENT_TYPE,
            ])
            .max_age(3600)
    }
}

// ============================================================================
// APPLICATION FACTORY
// ============================================================================

fn create_app(app_state: AppState) -> App<
    impl actix_web::dev::ServiceFactory<
        actix_web::dev::ServiceRequest,
        Config = (),
        Response = actix_web::dev::ServiceResponse,
        Error = actix_web::Error,
        InitError = (),
    >,
> {
    let cors = configure_cors(app_state.config.enable_cors);

    App::new()
        // Middleware stack (order matters!)
        .wrap(cors)
        .wrap(actix_middleware::Logger::default())
        .wrap(actix_middleware::Compress::default())
        .wrap(actix_middleware::NormalizePath::trim())
        .wrap(middleware::RateLimiter::new(100, Duration::from_secs(60)))
        .wrap(middleware::RequestId::new())
        .wrap(middleware::SecurityHeaders::new())
        
        // Application state
        .app_data(app_state.game_state.clone())
        .app_data(web::Data::new(app_state.metrics.clone()))
        .app_data(web::Data::new(app_state.config.clone()))
        
        // Payload size limit
        .app_data(web::PayloadConfig::new(MAX_PAYLOAD_SIZE))
        
        // Routes
        .service(
            web::scope("/api/v1")
                .service(routes::health_check)
                .service(routes::metrics)
                .configure(routes::game_routes)
                .configure(routes::code_runner_routes)
        )
        .service(routes::index)
        .default_service(web::route().to(routes::not_found))
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            log::info!("Received Ctrl+C signal");
        },
        _ = terminate => {
            log::info!("Received SIGTERM signal");
        },
    }

    log::info!("Initiating graceful shutdown...");
}

async fn perform_cleanup(app_state: &AppState) {
    log::info!("Performing cleanup tasks...");

    // Save game state
    if let Ok(game_state) = app_state.game_state.lock() {
        if let Err(e) = game_state.save_to_disk("./data/game_state.json") {
            log::error!("Failed to save game state: {}", e);
        } else {
            log::info!("Game state saved successfully");
        }
    }

    // Save metrics
    if let Ok(metrics) = app_state.metrics.lock() {
        log::info!("Final metrics:");
        log::info!("  Total requests: {}", metrics.total_requests);
        log::info!("  Total errors: {}", metrics.total_errors);
        log::info!("  Avg response time: {}ms", metrics.avg_response_time_ms());
    }

    log::info!("Cleanup completed");
}

// ============================================================================
// HEALTH CHECK & MONITORING
// ============================================================================

async fn start_health_monitor(app_state: AppState) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            
            if let Ok(metrics) = app_state.metrics.lock() {
                log::debug!(
                    "Health check - Uptime: {}s, Requests: {}, Errors: {}",
                    app_state.uptime_seconds(),
                    metrics.total_requests,
                    metrics.total_errors
                );
            }
        }
    });
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logger
    init_logger();
    
    log::info!("╔══════════════════════════════════════════╗");
    log::info!("║     Chill Space Game Server v1.0.0      ║");
    log::info!("╚══════════════════════════════════════════╝");
    
    // Load configuration
    let config = load_config();
    let bind_address = format!("{}:{}", config.host, config.port);
    
    log::info!("Configuration loaded:");
    log::info!("  Host: {}", config.host);
    log::info!("  Port: {}", config.port);
    log::info!("  Workers: {}", config.workers);
    log::info!("  Keep-Alive: {}s", config.keep_alive.as_secs());
    log::info!("  Max Connections: {}", config.max_connections);
    log::info!("  CORS: {}", if config.enable_cors { "enabled" } else { "disabled" });
    
    // Create application state
    let app_state = AppState::new(config.clone());
    let app_state_clone = app_state.clone();
    
    // Start background health monitor
    start_health_monitor(app_state.clone());
    
    // Create HTTP server
    let server = HttpServer::new(move || create_app(app_state.clone()))
        .workers(config.workers)
        .keep_alive(config.keep_alive)
        .client_request_timeout(config.client_timeout)
        .shutdown_timeout(config.shutdown_timeout.as_secs())
        .max_connections(config.max_connections)
        .bind(&bind_address)?;
    
    log::info!("🚀 Server starting at http://{}", bind_address);
    log::info!("📊 Metrics available at http://{}/api/v1/metrics", bind_address);
    log::info!("💚 Health check at http://{}/api/v1/health", bind_address);
    log::info!("Press Ctrl+C to stop");
    
    // Run server with graceful shutdown
    let server_handle = server.run();
    let server_handle_clone = server_handle.handle();
    
    // Spawn shutdown handler
    tokio::spawn(async move {
        shutdown_signal().await;
        server_handle_clone.stop(true).await;
    });
    
    // Wait for server to complete
    let result = server_handle.await;
    
    // Perform cleanup
    perform_cleanup(&app_state_clone).await;
    
    log::info!("✅ Server shutdown complete");
    
    result
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, http::StatusCode};

    #[actix_web::test]
    async fn test_health_check() {
        let config = ServerConfig::default();
        let app_state = AppState::new(config);
        let app = test::init_service(create_app(app_state)).await;
        
        let req = test::TestRequest::get()
            .uri("/api/v1/health")
            .to_request();
        let resp = test::call_service(&app, req).await;
        
        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[actix_web::test]
    async fn test_not_found() {
        let config = ServerConfig::default();
        let app_state = AppState::new(config);
        let app = test::init_service(create_app(app_state)).await;
        
        let req = test::TestRequest::get()
            .uri("/nonexistent")
            .to_request();
        let resp = test::call_service(&app, req).await;
        
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn test_config_loading() {
        std::env::set_var("PORT", "9000");
        let config = load_config();
        assert_eq!(config.port, 9000);
    }
}
