use redis::Client;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::{Mutex, mpsc};
use std::collections::HashMap;

pub type WsSender = mpsc::UnboundedSender<String>;

pub struct AppState {
    pub redis: RedisClient,
    pub db_pool: SqlitePool,
    pub ws_connections: Arc<Mutex<HashMap<String, WsSender>>>,
}

pub struct RedisClient {
    client: Arc<Mutex<redis::aio::MultiplexedConnection>>,
}

impl RedisClient {
    pub async fn new(redis_url: &str) -> Result<Self, redis::RedisError> {
        let client = Client::open(redis_url)?;
        let conn = client.get_multiplexed_tokio_connection().await?;
        Ok(Self { client: Arc::new(Mutex::new(conn)) })
    }

    pub async fn get<T: redis::FromRedisValue>(&self, key: &str) -> Result<Option<T>, redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("GET").arg(key).query_async(&mut *conn).await
    }

    pub async fn set(&self, key: &str, value: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("SET").arg(key).arg(value).query_async(&mut *conn).await
    }

    pub async fn hget<T: redis::FromRedisValue>(&self, key: &str, field: &str) -> Result<Option<T>, redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("HGET").arg(key).arg(field).query_async(&mut *conn).await
    }

    pub async fn hset(&self, key: &str, field: &str, value: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("HSET").arg(key).arg(field).arg(value).query_async(&mut *conn).await
    }

    pub async fn rpush(&self, key: &str, value: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("RPUSH").arg(key).arg(value).query_async(&mut *conn).await
    }

    pub async fn lrange<T: redis::FromRedisValue>(&self, key: &str, start: isize, stop: isize) -> Result<Vec<T>, redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("LRANGE").arg(key).arg(start).arg(stop).query_async(&mut *conn).await
    }

    pub async fn sadd(&self, key: &str, member: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("SADD").arg(key).arg(member).query_async(&mut *conn).await
    }

    pub async fn smembers<T: redis::FromRedisValue>(&self, key: &str) -> Result<Vec<T>, redis::RedisError> {
        let mut conn = self.client.lock().await;
        redis::cmd("SMEMBERS").arg(key).query_async(&mut *conn).await
    }
}
