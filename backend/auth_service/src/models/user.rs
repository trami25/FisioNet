use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::Result;

// Specialization for physiotherapists
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Specialization {
    pub name: String,
    pub description: Option<String>,
}

// Certification for physiotherapists  
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Certification {
    pub name: String,
    pub issuer: String,
    pub date_obtained: String,
    pub expiry_date: Option<String>,
}

// User roles
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
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
    pub profile_image: Option<String>,
    pub role: UserRole,
    pub specializations: Option<Vec<Specialization>>,
    pub certifications: Option<Vec<Certification>>,
    pub years_of_experience: Option<i32>,
    pub education: Option<String>,
    pub bio: Option<String>,
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
pub struct UpdateUserRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub phone: Option<String>,
    pub birth_date: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub job_type: Option<String>,
    pub profile_image: Option<String>,
    pub specializations: Option<Vec<Specialization>>,
    pub certifications: Option<Vec<Certification>>,
    pub years_of_experience: Option<i32>,
    pub education: Option<String>,
    pub bio: Option<String>,
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
    pub specializations: Option<Vec<Specialization>>,
    pub certifications: Option<Vec<Certification>>,
    pub years_of_experience: Option<i32>,
    pub education: Option<String>,
    pub bio: Option<String>,
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
    pub profile_image: Option<String>,
    pub role: String,
    pub specializations: Option<Vec<Specialization>>,
    pub certifications: Option<Vec<Certification>>,
    pub years_of_experience: Option<i32>,
    pub education: Option<String>,
    pub bio: Option<String>,
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
        specializations: Option<Vec<Specialization>>,
        certifications: Option<Vec<Certification>>,
        years_of_experience: Option<i32>,
        education: Option<String>,
        bio: Option<String>,
    ) -> Result<User> {
        let user_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Serialize vectors to JSON strings
        let specializations_json = specializations.as_ref()
            .map(|s| serde_json::to_string(s).unwrap_or_else(|_| "[]".to_string()));
        let certifications_json = certifications.as_ref()
            .map(|c| serde_json::to_string(c).unwrap_or_else(|_| "[]".to_string()));

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
            profile_image: None, // Default to None for new users
            role: role.clone(),
            specializations,
            certifications,
            years_of_experience,
            education: education.clone(),
            bio: bio.clone(),
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO users (id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, profile_image, role, specializations, certifications, years_of_experience, education, bio, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        .bind(&user.profile_image)
        .bind(&user.role.to_string())
        .bind(&specializations_json)
        .bind(&certifications_json)
        .bind(&user.years_of_experience)
        .bind(&user.education)
        .bind(&user.bio)
        .bind(&user.created_at)
        .bind(&user.updated_at)
        .execute(pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_email(pool: &SqlitePool, email: &str) -> Result<Option<User>> {
        let user_row = sqlx::query(
            "SELECT id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, profile_image, role, specializations, certifications, years_of_experience, education, bio, created_at, updated_at FROM users WHERE email = ?"
        )
        .bind(email)
        .fetch_optional(pool)
        .await?;

        if let Some(row) = user_row {
            // Parse JSON fields
            let specializations: Option<Vec<Specialization>> = row.get::<Option<String>, _>("specializations")
                .and_then(|s| serde_json::from_str(&s).ok());
            let certifications: Option<Vec<Certification>> = row.get::<Option<String>, _>("certifications")
                .and_then(|s| serde_json::from_str(&s).ok());

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
                profile_image: row.get("profile_image"),
                role: row.get::<String, _>("role").parse().unwrap_or(UserRole::Patient),
                specializations,
                certifications,
                years_of_experience: row.get("years_of_experience"),
                education: row.get("education"),
                bio: row.get("bio"),
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
            "SELECT id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, profile_image, role, specializations, certifications, years_of_experience, education, bio, created_at, updated_at FROM users WHERE id = ?"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        if let Some(row) = user_row {
            // Parse JSON fields
            let specializations: Option<Vec<Specialization>> = row.get::<Option<String>, _>("specializations")
                .and_then(|s| serde_json::from_str(&s).ok());
            let certifications: Option<Vec<Certification>> = row.get::<Option<String>, _>("certifications")
                .and_then(|s| serde_json::from_str(&s).ok());

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
                profile_image: row.get("profile_image"),
                role: row.get::<String, _>("role").parse().unwrap_or(UserRole::Patient),
                specializations,
                certifications,
                years_of_experience: row.get("years_of_experience"),
                education: row.get("education"),
                bio: row.get("bio"),
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
            profile_image: self.profile_image.clone(),
            role: self.role.to_string(),
            specializations: self.specializations.clone(),
            certifications: self.certifications.clone(),
            years_of_experience: self.years_of_experience,
            education: self.education.clone(),
            bio: self.bio.clone(),
            created_at: self.created_at,
        }
    }

    pub async fn update_profile(
        pool: &SqlitePool,
        user_id: &str,
        update_data: UpdateUserRequest,
    ) -> Result<User> {
        let now = Utc::now();

        // Serialize vectors to JSON strings
        let specializations_json = update_data.specializations.as_ref()
            .map(|s| serde_json::to_string(s).unwrap_or_else(|_| "[]".to_string()));
        let certifications_json = update_data.certifications.as_ref()
            .map(|c| serde_json::to_string(c).unwrap_or_else(|_| "[]".to_string()));

        sqlx::query(
            r#"
            UPDATE users 
            SET first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone = COALESCE(?, phone),
                birth_date = COALESCE(?, birth_date),
                height = COALESCE(?, height),
                weight = COALESCE(?, weight),
                job_type = COALESCE(?, job_type),
                profile_image = COALESCE(?, profile_image),
                specializations = COALESCE(?, specializations),
                certifications = COALESCE(?, certifications),
                years_of_experience = COALESCE(?, years_of_experience),
                education = COALESCE(?, education),
                bio = COALESCE(?, bio),
                updated_at = ?
            WHERE id = ?
            "#
        )
        .bind(&update_data.first_name)
        .bind(&update_data.last_name)
        .bind(&update_data.phone)
        .bind(&update_data.birth_date)
        .bind(&update_data.height)
        .bind(&update_data.weight)
        .bind(&update_data.job_type)
        .bind(&update_data.profile_image)
        .bind(&specializations_json)
        .bind(&certifications_json)
        .bind(&update_data.years_of_experience)
        .bind(&update_data.education)
        .bind(&update_data.bio)
        .bind(&now)
        .bind(user_id)
        .execute(pool)
        .await?;

        // Fetch and return updated user
        User::find_by_id(pool, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User not found after update"))
    }

    // Get all users (admin function)
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<User>> {
        let users = sqlx::query(
            "SELECT id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, profile_image, role, specializations, certifications, years_of_experience, education, bio, created_at, updated_at FROM users ORDER BY created_at DESC"
        )
        .fetch_all(pool)
        .await?;

        let mut result = Vec::new();
        for row in users {
            let role_str: String = row.get("role");
            let role = role_str.parse::<UserRole>()
                .map_err(|_| anyhow::anyhow!("Invalid role in database: {}", role_str))?;

            // Parse JSON fields
            let specializations: Option<Vec<Specialization>> = row.get::<Option<String>, _>("specializations")
                .and_then(|s| serde_json::from_str(&s).ok());
            let certifications: Option<Vec<Certification>> = row.get::<Option<String>, _>("certifications")
                .and_then(|s| serde_json::from_str(&s).ok());

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
                profile_image: row.get("profile_image"),
                role,
                specializations,
                certifications,
                years_of_experience: row.get("years_of_experience"),
                education: row.get("education"),
                bio: row.get("bio"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            };
            result.push(user);
        }

        Ok(result)
    }

    // Get users by role
    pub async fn get_by_role(pool: &SqlitePool, role: &UserRole) -> Result<Vec<User>> {
        let users = sqlx::query(
            "SELECT id, email, password_hash, first_name, last_name, phone, birth_date, height, weight, job_type, profile_image, role, specializations, certifications, years_of_experience, education, bio, created_at, updated_at FROM users WHERE role = ? ORDER BY first_name, last_name"
        )
        .bind(role.to_string())
        .fetch_all(pool)
        .await?;

        let mut result = Vec::new();
        for row in users {
            let role_str: String = row.get("role");
            let user_role = role_str.parse::<UserRole>()
                .map_err(|_| anyhow::anyhow!("Invalid role in database: {}", role_str))?;

            // Parse JSON fields
            let specializations: Option<Vec<Specialization>> = row.get::<Option<String>, _>("specializations")
                .and_then(|s| serde_json::from_str(&s).ok());
            let certifications: Option<Vec<Certification>> = row.get::<Option<String>, _>("certifications")
                .and_then(|s| serde_json::from_str(&s).ok());

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
                profile_image: row.get("profile_image"),
                role: user_role,
                specializations,
                certifications,
                years_of_experience: row.get("years_of_experience"),
                education: row.get("education"),
                bio: row.get("bio"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            };
            result.push(user);
        }

        Ok(result)
    }

    // Delete user (admin function)
    pub async fn delete(pool: &SqlitePool, user_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM users WHERE id = ?")
            .bind(user_id)
            .execute(pool)
            .await?;

        Ok(())
    }
}