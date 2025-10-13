use axum::{
    routing::{get, post},
    http::StatusCode,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;

#[derive(Serialize, Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize, Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
    first_name: String,
    last_name: String,
    phone: Option<String>,
    birth_date: Option<String>,
    height: Option<f64>,
    weight: Option<f64>,
    job_type: Option<String>,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
    user_id: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/", get(root))
        .route("/auth/login", post(login))
        .route("/auth/register", post(register))
        .route("/auth/verify", get(verify_token))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("Auth service listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn root() -> &'static str {
    "Auth Service - FisioNet"
}

async fn login(Json(payload): Json<LoginRequest>) -> Result<Json<AuthResponse>, StatusCode> {
    // TODO: Implement actual login logic with database
    if payload.email == "test@example.com" && payload.password == "password" {
        Ok(Json(AuthResponse {
            token: "dummy_jwt_token".to_string(),
            user_id: "user_123".to_string(),
        }))
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}

async fn register(Json(payload): Json<RegisterRequest>) -> Result<Json<AuthResponse>, StatusCode> {
    // TODO: Implement actual registration logic with database
    println!("Register request: {:?}", payload.email);
    Ok(Json(AuthResponse {
        token: "dummy_jwt_token".to_string(),
        user_id: "new_user_123".to_string(),
    }))
}

async fn verify_token() -> Result<StatusCode, StatusCode> {
    // TODO: Implement JWT token verification
    Ok(StatusCode::OK)
}
