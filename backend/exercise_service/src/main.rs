use axum::{
    routing::{get, post, put, delete},
    Router, Extension,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tracing_subscriber;
use anyhow::Result;
use std::fs;
use std::env;

mod models;
mod handlers;
mod config;
mod database;

use config::Config;
use database::create_pool;
use handlers::*;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = Config::from_env();
    tracing::info!("Starting Exercise Service with config: {:?}", config);

    // Initialize database (using auth service database)
    let pool = create_pool(&config.database_url).await?;
    tracing::info!("Database pool created (using auth service database)");

    // Check if exercises table exists, create it if not
    let table_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='exercises'"
    )
    .fetch_one(&pool)
    .await?;

    if table_exists == 0 {
        tracing::info!("Creating exercises table...");
        
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                difficulty_level TEXT NOT NULL,
                duration_minutes INTEGER,
                equipment_needed TEXT NOT NULL,
                instructions TEXT NOT NULL,
                image_url TEXT,
                video_url TEXT,
                youtube_url TEXT,
                target_muscles TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                is_specialized INTEGER NOT NULL DEFAULT 0
            )
            "#
        )
        .execute(&pool)
        .await?;

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category)")
            .execute(&pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty_level)")
            .execute(&pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at)")
            .execute(&pool)
            .await?;

        tracing::info!("Exercises table created successfully");
    } else {
        tracing::info!("Exercises table already exists");
    }

    // Run migrations
    let current_dir = env::current_dir()?;
    let migrations_dir = current_dir.join("migrations");
    let migration_files = fs::read_dir(&migrations_dir)?
        .filter_map(Result::ok)
        .filter(|entry| entry.path().extension().map_or(false, |ext| ext == "sql"))
        .collect::<Vec<_>>();

    for migration in migration_files {
        let migration_path = migration.path();
        let migration_sql = fs::read_to_string(&migration_path)?;
        tracing::info!("Running migration: {:?}", migration_path);
        sqlx::query(&migration_sql).execute(&pool).await?;
    }

    tracing::info!("Migrations completed successfully");

    // Build application routes
    // ensure static images directory exists
    let static_dir = current_dir.join("static").join("images");
    if !static_dir.exists() {
        fs::create_dir_all(&static_dir)?;
        tracing::info!("Created static images directory: {:?}", static_dir);
    }

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/exercises", get(get_exercises))
        .route("/exercises", post(create_exercise))
        .route("/exercises/:exercise_id", get(get_exercise))
        .route("/exercises/:exercise_id", put(update_exercise))
        .route("/exercises/:exercise_id", delete(delete_exercise))
        // upload and manage images
        .route("/exercises/:exercise_id/images", post(upload_exercise_images))
        .route("/exercises/:exercise_id/images/:image_id", delete(delete_exercise_image))
        // serve static images from ./static
        .nest_service(
            "/static",
            ServeDir::new(current_dir.join("static"))
        )
        .layer(Extension(pool))
        .layer(CorsLayer::permissive());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Exercise service listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
