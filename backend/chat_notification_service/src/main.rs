use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::Mutex;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use sqlx::sqlite::SqlitePoolOptions;

mod handlers;
mod models;
mod state;

use handlers::*;
use state::{AppState, RedisClient};

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    tracing::info!("Starting Chat & Notification Service");

    // Load environment variables
    dotenv::dotenv().ok();

    // Redis connection
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    let redis = RedisClient::new(&redis_url)
        .await
        .expect("Failed to connect to Redis");

    tracing::info!("Connected to Redis");

    // Database connection (SQLite - auth service database for user info)
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "../auth_service/data/fisionet.db".to_string());
    
    let db_pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("Connected to database");

    // Create app state
    let state = Arc::new(AppState {
        redis,
        db_pool,
        ws_connections: Arc::new(Mutex::new(HashMap::new())),
    });

    // Build application routes
    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        // WebSocket endpoint
        .route("/ws/:user_id", get(ws_handler))
        // REST endpoints
        .route("/users/:user_id/messages", post(send_message))
        .route("/users/:user_id/conversations", get(get_conversations))
        .route("/users/:user_id/conversations/:conversation_id/messages", get(get_messages))
        .route("/users/:user_id/conversations/:conversation_id/read", post(mark_conversation_read))
        .route("/users/:user_id/unread", get(get_unread_count))
        .with_state(state)
        .layer(CorsLayer::permissive());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 8003));
    tracing::info!("Chat service listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
