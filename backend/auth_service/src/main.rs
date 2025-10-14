use axum::{
    routing::{get, post, put, delete},
    Router, Extension,
    extract::DefaultBodyLimit,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use anyhow::Result;

mod models;
mod handlers;
mod utils;
mod config;
mod database;

use config::Config;
use database::{create_pool, run_migrations};
use handlers::{auth::*, admin::*, users::{get_physiotherapists, get_patients, get_users_by_role, get_user_profile}};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = Config::from_env();
    tracing::info!("Starting Auth Service with config: {:?}", config);

    // Initialize database
    let pool = create_pool(&config.database_url).await?;
    tracing::info!("Database pool created");

    // Run migrations
    run_migrations(&pool).await?;
    tracing::info!("Database migrations completed");

    // Build application routes
    let app = Router::new()
        .route("/", get(root))
        .route("/auth/login", post(login))
        .route("/auth/register", post(register))
        .route("/auth/verify", get(verify_token))
        .route("/auth/profile", get(get_profile))
        .route("/auth/profile", put(update_profile))
        // Admin routes
        .route("/admin/users", get(get_all_users))
        .route("/admin/users", post(create_user))
        .route("/admin/users/:user_id", delete(delete_user))
        .route("/admin/users/stats", get(get_user_stats))
        // User routes for role-based access
        .route("/users/physiotherapists", get(get_physiotherapists))
        .route("/users/patients", get(get_patients))
        .route("/users/by-role", get(get_users_by_role))
        .route("/users/profile/:user_id", get(get_user_profile))
        .route("/users/:user_id", get(get_user_profile)) // Alias for profile endpoint
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024)) // 10MB limit
        .layer(Extension(pool))
        .layer(CorsLayer::permissive());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Auth service listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
