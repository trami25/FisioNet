use axum::{
    routing::{get, post, put, delete},
    Router, Extension,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use anyhow::Result;

mod models;
mod handlers;
mod config;
mod database;

use config::Config;
use database::{create_pool};
use handlers::*;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = Config::from_env();
    tracing::info!("Starting Forum Service with config: {:?}", config);

    // Initialize database (using auth service database)
    let pool = create_pool(&config.database_url).await?;
    tracing::info!("Database pool created (using auth service database)");

   
  
    // Check if forum tables exist, create them if not
    let table_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='posts'"
    )
    .fetch_one(&pool)
    .await?;

    if table_exists == 0 {
        tracing::info!("Creating forum tables...");
        
        // Create posts table (author_id as TEXT to match auth service UUIDs)
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            "#
        )
        .execute(&pool)
        .await?;

        // Create comments table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                author_id TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            )
            "#
        )
        .execute(&pool)
        .await?;

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)")
            .execute(&pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)")
            .execute(&pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)")
            .execute(&pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)")
            .execute(&pool)
            .await?;

        tracing::info!("Forum tables created successfully");
    } else {
        tracing::info!("Forum tables already exist");
    }

    // Build application routes
    let app = Router::new()
        .route("/health", get(health_check))
        // Post routes
        .route("/posts", get(get_posts))
        .route("/posts", post(create_post))
        .route("/posts/:post_id", get(get_post))
        .route("/posts/:post_id", put(update_post))
        .route("/posts/:post_id", delete(delete_post))
        // Comment routes
        .route("/posts/:post_id/comments", get(get_post_comments))
        .route("/posts/:post_id/comments", post(create_comment))
        .route("/posts/:post_id/comments/:comment_id", put(update_comment))
        .route("/posts/:post_id/comments/:comment_id", delete(delete_comment))
        .layer(Extension(pool))
        .layer(CorsLayer::permissive());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Forum service listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
