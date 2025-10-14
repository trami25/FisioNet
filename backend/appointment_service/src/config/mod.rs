use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub server_port: u16,
    pub auth_service_url: String,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();

        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite:./appointment_service.db".to_string()),
            server_port: env::var("PORT")
                .unwrap_or_else(|_| "8002".to_string())
                .parse()
                .expect("PORT must be a number"),
            auth_service_url: env::var("AUTH_SERVICE_URL")
                .unwrap_or_else(|_| "http://localhost:8001".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key".to_string()),
        }
    }
}