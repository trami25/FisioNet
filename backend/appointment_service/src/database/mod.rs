use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use anyhow::Result;
use std::str::FromStr;

pub async fn create_pool(database_url: &str) -> Result<SqlitePool> {
    let options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true);
    
    let pool = SqlitePool::connect_with(options).await?;
    Ok(pool)
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}