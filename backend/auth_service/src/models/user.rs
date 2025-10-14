use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::Result;

// User roles
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum UserRole {
    Patient,
    Physiotherapist,
    Admin,
}

impl std::str::FromStr for UserRole {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "patient" => Ok(UserRole::Patient),
            "physiotherapist" => Ok(UserRole::Physiotherapist),
            "admin" => Ok(UserRole::Admin),
            _ => Err(format!("Invalid role: {}", s)),
        }
    }
}

impl ToString for UserRole {
    fn to_string(&self) -> String {
        match self {
            UserRole::Patient => "patient".to_string(),
            UserRole::Physiotherapist => "physiotherapist".to_string(),
            UserRole::Admin => "admin".to_string(),
        }
    }
}

// Database model
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub email: String,
    pub password_hash: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub birth_date: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub job_type: Option<String>,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Request models
#[derive(Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub birth_date: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub job_type: Option<String>,
    pub role: Option<String>, // defaults to "patient"
}

// Response models
#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user_id: String,
    pub email: String,
    pub role: String,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Serialize)]
pub struct UserProfile {
    pub id: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub birth_date: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub job_type: Option<String>,
    pub role: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

// Database operations
impl User {
    pub async fn create(
        pool: &SqlitePool,
        email: String,
        password_hash: String,
        first_name: String,
        last_name: String,
        phone: Option<String>,
        birth_date: Option<String>,
        height: Option<f64>,
        weight: Option<f64>,
        job_type: Option<String>,
        role: UserRole,
    ) -> Result<User> {
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let user = User {
            id: user_id.clone(),
            email: email.clone(),
            password_hash: password_hash.clone(),
            first_name: first_name.clone(),
            last_name: last_name.clone(),
            phone: phone.clone(),
            birth_date: birth_date.clone(),
            height,
            weight,
            job_type: job_type.clone(),
            role: role.clone(),
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO users (id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&user.id)
        .bind(&user.email)
        .bind(&user.password_hash)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(&user.phone)
        .bind(&user.birth_date)
        .bind(&user.height)
        .bind(&user.weight)
        .bind(&user.job_type)
        .bind(&user.role.to_string())
        .bind(&user.created_at)
        .bind(&user.updated_at)
        .execute(pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_email(pool: &SqlitePool, email: &str) -> Result<Option<User>> {
        let user_row = sqlx::query(
            "SELECT id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, role, created_at, updated_at FROM users WHERE email = ?"
        )
        .bind(email)
        .fetch_optional(pool)
        .await?;

        if let Some(row) = user_row {
            let user = User {
                id: row.get("id"),
                email: row.get("email"),
                password_hash: row.get("password_hash"),
                first_name: row.get("first_name"),
                last_name: row.get("last_name"),
                phone: row.get("phone"),
                birth_date: row.get("birth_date"),
                height: row.get("height"),
                weight: row.get("weight"),
                job_type: row.get("job_type"),
                role: row.get::<String, _>("role").parse().unwrap_or(UserRole::Patient),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            };
            Ok(Some(user))
        } else {
            Ok(None)
        }
    }

    pub async fn find_by_id(pool: &SqlitePool, user_id: &str) -> Result<Option<User>> {
        let user_row = sqlx::query(
            "SELECT id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, role, created_at, updated_at FROM users WHERE id = ?"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        if let Some(row) = user_row {
            let user = User {
                id: row.get("id"),
                email: row.get("email"),
                password_hash: row.get("password_hash"),
                first_name: row.get("first_name"),
                last_name: row.get("last_name"),
                phone: row.get("phone"),
                birth_date: row.get("birth_date"),
                height: row.get("height"),
                weight: row.get("weight"),
                job_type: row.get("job_type"),
                role: row.get::<String, _>("role").parse().unwrap_or(UserRole::Patient),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            };
            Ok(Some(user))
        } else {
            Ok(None)
        }
    }

    pub async fn email_exists(pool: &SqlitePool, email: &str) -> Result<bool> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE email = ?")
            .bind(email)
            .fetch_one(pool)
            .await?;
        Ok(count > 0)
    }

    pub fn to_profile(&self) -> UserProfile {
        UserProfile {
            id: self.id.clone(),
            email: self.email.clone(),
            first_name: self.first_name.clone(),
            last_name: self.last_name.clone(),
            phone: self.phone.clone(),
            birth_date: self.birth_date.clone(),
            height: self.height,
            weight: self.weight,
            job_type: self.job_type.clone(),
            role: self.role.to_string(),
            created_at: self.created_at,
        }
    }
}