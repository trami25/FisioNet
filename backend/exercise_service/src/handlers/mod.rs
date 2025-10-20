use axum::{
    extract::{Path, Extension, Json, Query},
    http::StatusCode,
    response::IntoResponse,
};
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use crate::models::*;
use axum::http::HeaderMap;
use axum::extract::Multipart;
use std::fs;
use std::env;
use sqlx::Row;
use sanitize_filename;

#[derive(Debug, Deserialize)]
pub struct AuthHeader {
    pub user_id: String,
}

async fn ensure_admin_or_physio(pool: &SqlitePool, user_id: &str) -> Result<(), (StatusCode, Json<ErrorResponse>)> {
    // Query user role from users table in auth database
    let row = sqlx::query_scalar::<_, String>("SELECT role FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse { error: format!("Database error: {}", e) }),
            )
        })?;

    let role = row.ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse { error: "User not found".to_string() }),
        )
    })?;

    if role != "admin" && role != "physiotherapist" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse { error: "Insufficient permissions".to_string() }),
        ));
    }

    Ok(())
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Deserialize)]
pub struct FilterParams {
    pub category: Option<String>,
    pub difficulty: Option<String>,
    pub search: Option<String>,
}

pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

// Get all exercises with optional filters
pub async fn get_exercises(
    Extension(pool): Extension<SqlitePool>,
    Query(params): Query<FilterParams>,
) -> Result<Json<Vec<ExerciseResponse>>, (StatusCode, Json<ErrorResponse>)> {
    let mut query = "SELECT * FROM exercises WHERE 1=1".to_string();
    
    if let Some(category) = &params.category {
        query.push_str(&format!(" AND category = '{}'", category));
    }
    
    if let Some(difficulty) = &params.difficulty {
        query.push_str(&format!(" AND difficulty_level = '{}'", difficulty));
    }
    
    if let Some(search) = &params.search {
        query.push_str(&format!(
            " AND (title LIKE '%{}%' OR description LIKE '%{}%')",
            search, search
        ));
    }
    
    query.push_str(" ORDER BY created_at DESC");
    
    let exercises = sqlx::query_as::<_, Exercise>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse { error: format!("Database error: {}", e) }),
            )
        })?;

    let mut response: Vec<ExerciseResponse> = exercises.into_iter().map(|e| e.into()).collect();

    // Attach images for each exercise in the list efficiently in a single query
    let ids: Vec<i64> = response.iter().map(|r| r.id).collect();
    if !ids.is_empty() {
        // build placeholders for IN clause like ?,?,?
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let images_query = format!(
            "SELECT exercise_id, url FROM exercise_images WHERE exercise_id IN ({}) ORDER BY exercise_id, position ASC",
            placeholders
        );

        let mut q = sqlx::query(&images_query);
        for id in &ids {
            q = q.bind(id);
        }

        let rows = q
            .fetch_all(&pool)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse { error: format!("Database error: {}", e) }),
                )
            })?;

        use std::collections::HashMap;
        let mut map: HashMap<i64, Vec<String>> = HashMap::new();
        for row in rows {
            let ex_id: i64 = row.get::<i64, _>("exercise_id");
            let url: String = row.get::<String, _>("url");
            map.entry(ex_id).or_default().push(url);
        }

        for resp in response.iter_mut() {
            if let Some(imgs) = map.get(&resp.id) {
                resp.images = Some(imgs.clone());
            } else {
                resp.images = None;
            }
        }
    }

    Ok(Json(response))
}

// Get single exercise
pub async fn get_exercise(
    Extension(pool): Extension<SqlitePool>,
    Path(exercise_id): Path<i64>,
) -> Result<Json<ExerciseResponse>, (StatusCode, Json<ErrorResponse>)> {
    let exercise = sqlx::query_as::<_, Exercise>(
        "SELECT * FROM exercises WHERE id = ?"
    )
    .bind(exercise_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?
    .ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "Exercise not found".to_string() }),
        )
    })?;

    let mut resp: ExerciseResponse = exercise.into();
    // load images
    match load_images(&pool, exercise_id).await {
        Ok(imgs) => resp.images = Some(imgs),
        Err(_) => resp.images = None,
    }

    Ok(Json(resp))
}

// helper to load images for an exercise
async fn load_images(pool: &SqlitePool, exercise_id: i64) -> Result<Vec<String>, (StatusCode, Json<ErrorResponse>)> {
    let rows = sqlx::query("SELECT url FROM exercise_images WHERE exercise_id = ? ORDER BY position ASC")
        .bind(exercise_id)
        .fetch_all(pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Database error: {}", e) })))?;

    let urls = rows.into_iter().map(|r| r.get::<String, _>("url")).collect();
    Ok(urls)
}

// Create exercise
pub async fn create_exercise(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Json(req): Json<CreateExerciseRequest>,
) -> Result<Json<ExerciseResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Extract user id from header
    let user_id = match headers.get("x-user-id") {
        Some(v) => v.to_str().ok().map(|s| s.to_string()),
        None => None,
    };

    let user_id = user_id.ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(ErrorResponse { error: "Missing or invalid x-user-id header".to_string() })))?;

    ensure_admin_or_physio(&pool, &user_id).await?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let equipment_json = serde_json::to_string(&req.equipment_needed).unwrap();
    let instructions_json = serde_json::to_string(&req.instructions).unwrap();
    let target_muscles_json = serde_json::to_string(&req.target_muscles).unwrap();
    let is_specialized = if req.is_specialized.unwrap_or(false) { 1 } else { 0 };

    let result = sqlx::query(
        r#"
        INSERT INTO exercises (
            title, description, category, difficulty_level, duration_minutes,
            equipment_needed, instructions, image_url, video_url, youtube_url,
            target_muscles, created_at, is_specialized
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.category)
    .bind(&req.difficulty_level)
    .bind(req.duration_minutes)
    .bind(&equipment_json)
    .bind(&instructions_json)
    .bind(&req.image_url)
    .bind(&req.video_url)
    .bind(&req.youtube_url)
    .bind(&target_muscles_json)
    .bind(now)
    .bind(is_specialized)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    let exercise = ExerciseResponse {
        id: result.last_insert_rowid(),
        title: req.title,
        description: req.description,
        category: req.category,
        difficulty_level: req.difficulty_level,
        duration_minutes: req.duration_minutes,
        equipment_needed: req.equipment_needed,
        instructions: req.instructions,
        image_url: req.image_url,
        images: None,
        video_url: req.video_url,
        youtube_url: req.youtube_url,
        target_muscles: req.target_muscles,
        created_at: now,
        is_specialized: req.is_specialized.unwrap_or(false),
    };

    Ok(Json(exercise))
}

// Update exercise
pub async fn update_exercise(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Path(exercise_id): Path<i64>,
    Json(req): Json<UpdateExerciseRequest>,
) -> Result<Json<ExerciseResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = match headers.get("x-user-id") {
        Some(v) => v.to_str().ok().map(|s| s.to_string()),
        None => None,
    };

    let user_id = user_id.ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(ErrorResponse { error: "Missing or invalid x-user-id header".to_string() })))?;

    ensure_admin_or_physio(&pool, &user_id).await?;
    // Get existing exercise
    let existing = sqlx::query_as::<_, Exercise>(
        "SELECT * FROM exercises WHERE id = ?"
    )
    .bind(exercise_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?
    .ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "Exercise not found".to_string() }),
        )
    })?;

    let title = req.title.unwrap_or(existing.title);
    let description = req.description.unwrap_or(existing.description);
    let category = req.category.unwrap_or(existing.category);
    let difficulty_level = req.difficulty_level.unwrap_or(existing.difficulty_level);
    let duration_minutes = req.duration_minutes.or(existing.duration_minutes);
    
    let equipment_json = if let Some(eq) = req.equipment_needed {
        serde_json::to_string(&eq).unwrap()
    } else {
        existing.equipment_needed
    };
    
    let instructions_json = if let Some(inst) = req.instructions {
        serde_json::to_string(&inst).unwrap()
    } else {
        existing.instructions
    };
    
    let target_muscles_json = if let Some(tm) = req.target_muscles {
        serde_json::to_string(&tm).unwrap()
    } else {
        existing.target_muscles
    };

    let image_url = req.image_url.or(existing.image_url);
    let video_url = req.video_url.or(existing.video_url);
    let youtube_url = req.youtube_url.or(existing.youtube_url);

    sqlx::query(
        r#"
        UPDATE exercises 
        SET title = ?, description = ?, category = ?, difficulty_level = ?,
            duration_minutes = ?, equipment_needed = ?, instructions = ?,
            image_url = ?, video_url = ?, youtube_url = ?, target_muscles = ?
        WHERE id = ?
        "#
    )
    .bind(&title)
    .bind(&description)
    .bind(&category)
    .bind(&difficulty_level)
    .bind(duration_minutes)
    .bind(&equipment_json)
    .bind(&instructions_json)
    .bind(&image_url)
    .bind(&video_url)
    .bind(&youtube_url)
    .bind(&target_muscles_json)
    .bind(exercise_id)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    // Fetch updated exercise
    let exercise = sqlx::query_as::<_, Exercise>(
        "SELECT * FROM exercises WHERE id = ?"
    )
    .bind(exercise_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    Ok(Json(exercise.into()))
}

// Upload images for an exercise (multipart/form-data)
pub async fn upload_exercise_images(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Path(exercise_id): Path<i64>,
    mut multipart: Multipart,
) -> Result<Json<Vec<String>>, (StatusCode, Json<ErrorResponse>)> {
    let user_id = match headers.get("x-user-id") {
        Some(v) => v.to_str().ok().map(|s| s.to_string()),
        None => None,
    };

    let user_id = user_id.ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(ErrorResponse { error: "Missing or invalid x-user-id header".to_string() })))?;
    ensure_admin_or_physio(&pool, &user_id).await?;

    // ensure exercise exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM exercises WHERE id = ?")
        .bind(exercise_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Database error: {}", e) })))?;

    if exists == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Exercise not found".to_string() })));
    }

    let current_dir = env::current_dir().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Server error: {}", e) })))?;
    let images_dir = current_dir.join("static").join("images");

    let mut saved_urls: Vec<String> = Vec::new();

    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, Json(ErrorResponse { error: format!("Multipart parse error: {}", e) })))? {
        if let Some(file_name) = field.file_name().map(|s| s.to_string()) {
            let data = field.bytes().await.map_err(|e| (StatusCode::BAD_REQUEST, Json(ErrorResponse { error: format!("Error reading field bytes: {}", e) })))?;
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as i128)
                .unwrap_or(0) as i64;
            let safe_name = format!("{}-{}", timestamp, sanitize_filename::sanitize(&file_name));
            let file_path = images_dir.join(&safe_name);
            fs::write(&file_path, &data).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Failed to save file: {}", e) })))?;

            // store URL (serve under /static/images/<name>)
            let url = format!("/static/images/{}", safe_name);

            // determine next position
            let position: i64 = sqlx::query_scalar("SELECT COALESCE(MAX(position), -1) + 1 FROM exercise_images WHERE exercise_id = ?")
                .bind(exercise_id)
                .fetch_one(&pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Database error: {}", e) })))?;

            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);
            sqlx::query("INSERT INTO exercise_images (exercise_id, url, position, created_at) VALUES (?, ?, ?, ?)")
                .bind(exercise_id)
                .bind(&url)
                .bind(position)
                .bind(now)
                .execute(&pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Database error: {}", e) })))?;

            saved_urls.push(url);
        }
    }

    Ok(Json(saved_urls))
}

pub async fn delete_exercise_image(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Path((exercise_id, image_id)): Path<(i64, i64)>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let user_id = match headers.get("x-user-id") {
        Some(v) => v.to_str().ok().map(|s| s.to_string()),
        None => None,
    };

    let user_id = user_id.ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(ErrorResponse { error: "Missing or invalid x-user-id header".to_string() })))?;
    ensure_admin_or_physio(&pool, &user_id).await?;

    // fetch url
    let row = sqlx::query("SELECT url FROM exercise_images WHERE id = ? AND exercise_id = ?")
        .bind(image_id)
        .bind(exercise_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Database error: {}", e) })))?;

    let url = row.ok_or_else(|| (StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Image not found".to_string() })))?.get::<String, _>("url");

    // delete DB row
    let res = sqlx::query("DELETE FROM exercise_images WHERE id = ?")
        .bind(image_id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Database error: {}", e) })))?;

    // attempt remove file on disk if it points to /static/images/
    if url.starts_with("/static/images/") {
        let file_name = url.trim_start_matches("/static/images/");
        let current_dir = env::current_dir().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Server error: {}", e) })))?;
        let file_path = current_dir.join("static").join("images").join(file_name);
        let _ = fs::remove_file(file_path);
    }

    if res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Image not found".to_string() })));
    }

    Ok(StatusCode::NO_CONTENT)
}

// Delete exercise
pub async fn delete_exercise(
    Extension(pool): Extension<SqlitePool>,
    headers: HeaderMap,
    Path(exercise_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let user_id = match headers.get("x-user-id") {
        Some(v) => v.to_str().ok().map(|s| s.to_string()),
        None => None,
    };

    let user_id = user_id.ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(ErrorResponse { error: "Missing or invalid x-user-id header".to_string() })))?;

    ensure_admin_or_physio(&pool, &user_id).await?;
    let result = sqlx::query("DELETE FROM exercises WHERE id = ?")
        .bind(exercise_id)
        .execute(&pool)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse { error: format!("Database error: {}", e) }),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "Exercise not found".to_string() }),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}
