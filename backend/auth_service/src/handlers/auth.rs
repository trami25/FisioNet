use axum::{
    http::{StatusCode, HeaderMap},
    Json, Extension,
};
use sqlx::SqlitePool;
use tracing;

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

pub async fn root() -> &'static str {
    "Auth Service - FisioNet"
}

pub async fn register(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    tracing::info!("Registration attempt for email: {}", payload.email);

    // Validate input
    if payload.email.is_empty() || payload.password.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "validation_error".to_string(),
                message: "Email and password are required".to_string(),
            }),
        ));
    }

    if payload.password.len() < 6 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "validation_error".to_string(),
                message: "Password must be at least 6 characters long".to_string(),
            }),
        ));
    }

    // Check if user already exists
    let user_exists = User::email_exists(&pool, &payload.email)
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
        })?;

    if user_exists {
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
                error: "hashing_error".to_string(),
                message: "Failed to process password".to_string(),
            }),
        )
    })?;

    // Parse role
    let role = payload.role
        .unwrap_or_else(|| "patient".to_string())
        .parse::<UserRole>()
        .map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "validation_error".to_string(),
                    message: "Invalid role. Must be 'patient', 'physiotherapist', or 'admin'".to_string(),
                }),
            )
        })?;

    // Create new user
    let user = User::create(
        &pool,
        payload.email.clone(),
        password_hash,
        payload.first_name.clone(),
        payload.last_name.clone(),
        payload.phone,
        payload.birth_date,
        payload.height,
        payload.weight,
        payload.job_type,
        role,
        payload.specializations,
        payload.certifications,
        payload.years_of_experience,
        payload.education,
        payload.bio,
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

    // Generate JWT token
    let token = generate_jwt_token(&user).map_err(|e| {
        tracing::error!("JWT generation error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "token_error".to_string(),
                message: "Failed to generate authentication token".to_string(),
            }),
        )
    })?;

    tracing::info!("User registered successfully: {}", user.email);

    Ok(Json(AuthResponse {
        token,
        user_id: user.id,
        email: user.email,
        role: user.role.to_string(),
        first_name: user.first_name,
        last_name: user.last_name,
    }))
}

pub async fn login(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    tracing::info!("Login attempt for email: {}", payload.email);

    // Validate input
    if payload.email.is_empty() || payload.password.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "validation_error".to_string(),
                message: "Email and password are required".to_string(),
            }),
        ));
    }

    // Find user by email
    let user = User::find_by_email(&pool, &payload.email)
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
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "invalid_credentials".to_string(),
                    message: "Invalid email or password".to_string(),
                }),
            )
        })?;

    // Verify password
    let is_valid = verify_password(&payload.password, &user.password_hash).map_err(|e| {
        tracing::error!("Password verification error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "verification_error".to_string(),
                message: "Failed to verify password".to_string(),
            }),
        )
    })?;

    if !is_valid {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "invalid_credentials".to_string(),
                message: "Invalid email or password".to_string(),
            }),
        ));
    }

    // Generate JWT token
    let token = generate_jwt_token(&user).map_err(|e| {
        tracing::error!("JWT generation error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "token_error".to_string(),
                message: "Failed to generate authentication token".to_string(),
            }),
        )
    })?;

    tracing::info!("User logged in successfully: {}", user.email);

    Ok(Json(AuthResponse {
        token,
        user_id: user.id,
        email: user.email,
        role: user.role.to_string(),
        first_name: user.first_name,
        last_name: user.last_name,
    }))
}

pub async fn verify_token(
    headers: HeaderMap,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_bearer_token(&headers)?;
    
    verify_jwt_token(token).map_err(|e| {
        tracing::warn!("Token verification failed: {}", e);
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "invalid_token".to_string(),
                message: "Invalid or expired token".to_string(),
            }),
        )
    })?;

    Ok(StatusCode::OK)
}

pub async fn get_profile(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
) -> Result<Json<UserProfile>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_bearer_token(&headers)?;
    
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

    // Get user from database
    let user = User::find_by_id(&pool, &claims.sub)
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

    Ok(Json(user.to_profile()))
}

pub async fn update_profile(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<UserProfile>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_bearer_token(&headers)?;
    
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

    // Update user profile
    let updated_user = User::update_profile(&pool, &claims.sub, payload)
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "database_error".to_string(),
                    message: "Failed to update profile".to_string(),
                }),
            )
        })?;

    tracing::info!("User profile updated successfully: {}", updated_user.email);

    Ok(Json(updated_user.to_profile()))
}