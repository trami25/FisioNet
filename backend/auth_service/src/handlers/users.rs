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

// Helper function to verify user authentication and get user
async fn get_authenticated_user(pool: &SqlitePool, headers: &HeaderMap) -> Result<User, (StatusCode, Json<ErrorResponse>)> {
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

    Ok(user)
}

#[derive(Serialize)]
pub struct UsersListResponse {
    pub users: Vec<UserProfile>,
    pub total: usize,
    pub user_role: String,
}

// Get physiotherapists for patients, or patients for physiotherapists
pub async fn get_users_by_role(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
) -> Result<Json<UsersListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get authenticated user
    let current_user = get_authenticated_user(&pool, &headers).await?;

    let target_role = match current_user.role {
        UserRole::Patient => UserRole::Physiotherapist,
        UserRole::Physiotherapist => UserRole::Patient,
        UserRole::Admin => {
            return Err((
                StatusCode::FORBIDDEN,
                Json(ErrorResponse {
                    error: "invalid_role".to_string(),
                    message: "This endpoint is for patients and physiotherapists only".to_string(),
                }),
            ));
        }
    };

    let users = User::get_by_role(&pool, &target_role)
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

    tracing::info!(
        "{} ({}) fetched {} {}s", 
        current_user.email, 
        current_user.role.to_string(),
        total,
        target_role.to_string()
    );

    Ok(Json(UsersListResponse {
        users: user_profiles,
        total,
        user_role: target_role.to_string(),
    }))
}

// Get physiotherapists (specifically for patients)
pub async fn get_physiotherapists(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
) -> Result<Json<UsersListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get authenticated user
    let current_user = get_authenticated_user(&pool, &headers).await?;

    // Only patients can access this endpoint
    if current_user.role != UserRole::Patient {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "insufficient_permissions".to_string(),
                message: "Only patients can access physiotherapists list".to_string(),
            }),
        ));
    }

    let physiotherapists = User::get_by_role(&pool, &UserRole::Physiotherapist)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to fetch physiotherapists".to_string(),
                }),
            )
        })?;

    let user_profiles: Vec<UserProfile> = physiotherapists.into_iter().map(|u| u.to_profile()).collect();
    let total = user_profiles.len();

    tracing::info!("Patient {} fetched {} physiotherapists", current_user.email, total);

    Ok(Json(UsersListResponse {
        users: user_profiles,
        total,
        user_role: "physiotherapist".to_string(),
    }))
}

// Get patients (specifically for physiotherapists)
pub async fn get_patients(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
) -> Result<Json<UsersListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get authenticated user
    let current_user = get_authenticated_user(&pool, &headers).await?;

    // Only physiotherapists can access this endpoint
    if current_user.role != UserRole::Physiotherapist {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "insufficient_permissions".to_string(),
                message: "Only physiotherapists can access patients list".to_string(),
            }),
        ));
    }

    let patients = User::get_by_role(&pool, &UserRole::Patient)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to fetch patients".to_string(),
                }),
            )
        })?;

    let user_profiles: Vec<UserProfile> = patients.into_iter().map(|u| u.to_profile()).collect();
    let total = user_profiles.len();

    tracing::info!("Physiotherapist {} fetched {} patients", current_user.email, total);

    Ok(Json(UsersListResponse {
        users: user_profiles,
        total,
        user_role: "patient".to_string(),
    }))
}

// Get user profile by ID
pub async fn get_user_profile(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Path(user_id): Path<String>,
) -> Result<Json<UserProfile>, (StatusCode, Json<ErrorResponse>)> {
    tracing::info!("Profile fetch request for user: {}", user_id);

    // Verify authentication
    let current_user = get_authenticated_user(&pool, &headers).await?;

    // Authorization: Users can view their own profile, admins can view any profile,
    // physiotherapists can view patient profiles, patients can view physiotherapist profiles
    let target_user = User::find_by_id(&pool, &user_id)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to fetch user profile".to_string(),
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

    // Check permissions
    let can_view = match current_user.role {
        UserRole::Admin => true, // Admin can view any profile
        _ if current_user.id == target_user.id => true, // Users can view their own profile
        UserRole::Physiotherapist if target_user.role == UserRole::Patient => true, // Physiotherapists can view patients
        UserRole::Patient if target_user.role == UserRole::Physiotherapist => true, // Patients can view physiotherapists
        _ => false,
    };

    if !can_view {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "insufficient_permissions".to_string(),
                message: "You don't have permission to view this profile".to_string(),
            }),
        ));
    }

    tracing::info!("User {} accessed profile of {}", current_user.email, target_user.email);

    Ok(Json(target_user.to_profile()))
}