use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,    // user ID
    pub email: String,
    pub role: String,
    pub exp: usize,     // expiration time
    pub iat: usize,     // issued at
}

pub fn verify_jwt_token(token: &str) -> Result<Claims> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    ).map_err(|e| anyhow!("Invalid token: {}", e))?;

    Ok(token_data.claims)
}