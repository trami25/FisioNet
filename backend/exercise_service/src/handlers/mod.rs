use axum::{
    extract::{Path, Extension, Json, Query},
    http::StatusCode,
    response::IntoResponse,
};
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use crate::models::*;

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

    let response: Vec<ExerciseResponse> = exercises.into_iter().map(|e| e.into()).collect();
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

    Ok(Json(exercise.into()))
}

// Create exercise
pub async fn create_exercise(
    Extension(pool): Extension<SqlitePool>,
    Json(req): Json<CreateExerciseRequest>,
) -> Result<Json<ExerciseResponse>, (StatusCode, Json<ErrorResponse>)> {
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
    Path(exercise_id): Path<i64>,
    Json(req): Json<UpdateExerciseRequest>,
) -> Result<Json<ExerciseResponse>, (StatusCode, Json<ErrorResponse>)> {
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

// Delete exercise
pub async fn delete_exercise(
    Extension(pool): Extension<SqlitePool>,
    Path(exercise_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
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
