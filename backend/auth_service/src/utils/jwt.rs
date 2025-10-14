use anyhow::Result;
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use crate::models::User;

// JWT Configuration
const JWT_SECRET: &str = "fisionet_jwt_secret_key_2024";
const JWT_EXPIRATION: i64 = 24 * 60 * 60; // 24 hours in seconds

// JWT Claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub email: String,
    pub role: String,
    pub exp: i64,
}

pub fn generate_jwt_token(user: &User) -> Result<String> {
    let expiration = Utc::now().timestamp() + JWT_EXPIRATION;
    let claims = Claims {
        sub: user.id.clone(),
        email: user.email.clone(),
        role: user.role.to_string(),
        exp: expiration,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_ref()),
    )?;

    Ok(token)
}

pub fn verify_jwt_token(token: &str) -> Result<Claims> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_ref()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}