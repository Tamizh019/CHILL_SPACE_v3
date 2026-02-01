use std::time::Duration;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
    pub keep_alive: Duration,
    pub client_timeout: Duration,
    pub shutdown_timeout: Duration,
    pub enable_cors: bool,
    pub max_connections: usize,
    pub tls_enabled: bool,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8080,
            workers: 4,
            keep_alive: Duration::from_secs(75),
            client_timeout: Duration::from_secs(30),
            shutdown_timeout: Duration::from_secs(60),
            enable_cors: true,
            max_connections: 25000,
            tls_enabled: false,
        }
    }
}
