use axum::{
    http::{StatusCode, HeaderMap},
    Json, Extension, extract::Path,
};
use sqlx::SqlitePool;
use tracing;
use serde::Serialize;

use crate::models::*;
use crate::utils::*;

// Helper function to extract Bearer token from headers
fn extract_bearer_token(headers: &HeaderMap) -> Result<&str, (StatusCode, Json<ErrorResponse>)> {
    let auth_header = headers.get("authorization")
        .ok_or_else(|| (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse { 
                error: "missing_authorization".to_string(),
                message: "Missing authorization header".to_string() 
            })
        ))?;
    
    let auth_str = auth_header.to_str()
        .map_err(|_| (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse { 
                error: "invalid_header".to_string(),
                message: "Invalid authorization header".to_string() 
            })
        ))?;
    
    if !auth_str.starts_with("Bearer ") {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse { 
                error: "invalid_format".to_string(),
                message: "Invalid authorization format".to_string() 
            })
        ));
    }
    
    Ok(&auth_str[7..]) // Remove "Bearer " prefix
}

// Helper function to verify admin role
async fn verify_admin_role(pool: &SqlitePool, headers: &HeaderMap) -> Result<User, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_bearer_token(headers)?;
    
    let claims = verify_jwt_token(token).map_err(|e| {
        tracing::warn!("Token verification failed: {}", e);
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "invalid_token".to_string(),
                message: "Invalid or expired token".to_string(),
            }),
        )
    })?;

    let user = User::find_by_id(pool, &claims.sub)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Internal server error".to_string(),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "user_not_found".to_string(),
                    message: "User not found".to_string(),
                }),
            )
        })?;

    if user.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "insufficient_permissions".to_string(),
                message: "Admin role required".to_string(),
            }),
        ));
    }

    Ok(user)
}

#[derive(Serialize)]
pub struct UsersResponse {
    pub users: Vec<UserProfile>,
    pub total: usize,
}

#[derive(Serialize)]
pub struct UserStatsResponse {
    pub total: usize,
    pub patients: usize,
    pub physiotherapists: usize,
    pub admins: usize,
}

// Get all users (admin only)
pub async fn get_all_users(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
) -> Result<Json<UsersResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify admin role
    verify_admin_role(&pool, &headers).await?;

    let users = User::get_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to fetch users".to_string(),
                }),
            )
        })?;

    let user_profiles: Vec<UserProfile> = users.into_iter().map(|u| u.to_profile()).collect();
    let total = user_profiles.len();

    tracing::info!("Admin fetched {} users", total);

    Ok(Json(UsersResponse {
        users: user_profiles,
        total,
    }))
}

// Create new user (admin only)
pub async fn create_user(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<UserProfile>, (StatusCode, Json<ErrorResponse>)> {
    // Verify admin role
    verify_admin_role(&pool, &headers).await?;

    // Validate role
    let role = payload.role.as_deref().unwrap_or("patient");
    let user_role = role.parse::<UserRole>().map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_role".to_string(),
                message: "Invalid role. Must be 'patient', 'physiotherapist', or 'admin'".to_string(),
            }),
        )
    })?;

    // Check if user already exists
    if let Ok(Some(_)) = User::find_by_email(&pool, &payload.email).await {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "user_exists".to_string(),
                message: "User with this email already exists".to_string(),
            }),
        ));
    }

    // Hash password
    let password_hash = hash_password(&payload.password).map_err(|e| {
        tracing::error!("Password hashing error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "hash_error".to_string(),
                message: "Failed to process password".to_string(),
            }),
        )
    })?;

    // Create user
    let user = User::create(
        &pool,
        payload.email,
        password_hash,
        payload.first_name,
        payload.last_name,
        payload.phone,
        payload.birth_date,
        payload.height,
        payload.weight,
        payload.job_type,
        user_role,
    )
    .await
    .map_err(|e| {
        tracing::error!("Database insert error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to create user".to_string(),
            }),
        )
    })?;

    tracing::info!("Admin created new user: {} with role: {}", user.email, user.role.to_string());

    Ok(Json(user.to_profile()))
}

// Delete user (admin only)
pub async fn delete_user(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Path(user_id): Path<String>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Verify admin role
    let admin_user = verify_admin_role(&pool, &headers).await?;

    // Prevent admin from deleting themselves
    if admin_user.id == user_id {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "cannot_delete_self".to_string(),
                message: "Cannot delete your own account".to_string(),
            }),
        ));
    }

    // Check if user exists
    let user = User::find_by_id(&pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Internal server error".to_string(),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "user_not_found".to_string(),
                    message: "User not found".to_string(),
                }),
            )
        })?;

    // Delete user
    User::delete(&pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Database delete error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to delete user".to_string(),
                }),
            )
        })?;

    tracing::info!("Admin deleted user: {} ({})", user.email, user_id);

    Ok(StatusCode::NO_CONTENT)
}

// Get user statistics (admin only)
pub async fn get_user_stats(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
) -> Result<Json<UserStatsResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Verify admin role
    verify_admin_role(&pool, &headers).await?;

    let users = User::get_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to fetch users".to_string(),
                }),
            )
        })?;

    let total = users.len();
    let patients = users.iter().filter(|u| u.role == UserRole::Patient).count();
    let physiotherapists = users.iter().filter(|u| u.role == UserRole::Physiotherapist).count();
    let admins = users.iter().filter(|u| u.role == UserRole::Admin).count();

    Ok(Json(UserStatsResponse {
        total,
        patients,
        physiotherapists,
        admins,
    }))
}