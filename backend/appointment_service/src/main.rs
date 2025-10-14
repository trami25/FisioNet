use axum::{
    routing::{get, post, put},
    Router,
    Extension,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use sqlx::sqlite::SqlitePoolOptions;

mod handlers;

use handlers::*;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    tracing::info!("Starting Appointment Service");

    // Initialize database connection
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "../auth_service/data/fisionet.db".to_string());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("Connected to database");

    // Build application routes
    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        // Available slots endpoint
        .route("/physiotherapists/:id/available-slots", get(get_available_slots))
        // Appointment management
        .route("/appointments", post(create_appointment))
        .route("/appointments", get(get_user_appointments))
        .route("/appointments/:id/status", put(update_appointment_status))
        .layer(Extension(pool))
        .layer(CorsLayer::permissive());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 8002));
    tracing::info!("Appointment service listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
