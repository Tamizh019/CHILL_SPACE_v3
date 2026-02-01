use actix_web::{HttpResponse, ResponseError};
use serde::Serialize;
use std::fmt::{Display, Formatter};

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

#[derive(Debug)]
pub enum ServiceError {
    BadRequest(String),
    InternalServerError(String),
    NotFound(String),
    Unauthorized(String),
}

impl Display for ServiceError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::BadRequest(msg) => write!(f, "Bad Request: {}", msg),
            ServiceError::InternalServerError(msg) => write!(f, "Internal Server Error: {}", msg),
            ServiceError::NotFound(msg) => write!(f, "Not Found: {}", msg),
            ServiceError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
        }
    }
}

impl ResponseError for ServiceError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ServiceError::BadRequest(msg) => HttpResponse::BadRequest().json(ErrorResponse {
                error: "bad_request".to_string(),
                message: msg.clone(),
            }),
            ServiceError::InternalServerError(msg) => HttpResponse::InternalServerError().json(ErrorResponse {
                error: "internal_server_error".to_string(),
                message: msg.clone(),
            }),
            ServiceError::NotFound(msg) => HttpResponse::NotFound().json(ErrorResponse {
                error: "not_found".to_string(),
                message: msg.clone(),
            }),
            ServiceError::Unauthorized(msg) => HttpResponse::Unauthorized().json(ErrorResponse {
                error: "unauthorized".to_string(),
                message: msg.clone(),
            }),
        }
    }
}
