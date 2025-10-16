use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Exercise {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub difficulty_level: String,
    pub duration_minutes: Option<i64>,
    pub equipment_needed: String, // JSON array as string
    pub instructions: String,     // JSON array as string
    pub image_url: Option<String>,
    pub video_url: Option<String>,
    pub youtube_url: Option<String>,
    pub target_muscles: String,   // JSON array as string
    pub created_at: i64,
    pub is_specialized: i64,      // 0 or 1 (SQLite boolean)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateExerciseRequest {
    pub title: String,
    pub description: String,
    pub category: String,
    pub difficulty_level: String,
    pub duration_minutes: Option<i64>,
    pub equipment_needed: Vec<String>,
    pub instructions: Vec<String>,
    pub image_url: Option<String>,
    pub video_url: Option<String>,
    pub youtube_url: Option<String>,
    pub target_muscles: Vec<String>,
    pub is_specialized: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateExerciseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub difficulty_level: Option<String>,
    pub duration_minutes: Option<i64>,
    pub equipment_needed: Option<Vec<String>>,
    pub instructions: Option<Vec<String>>,
    pub image_url: Option<String>,
    pub video_url: Option<String>,
    pub youtube_url: Option<String>,
    pub target_muscles: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseResponse {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub difficulty_level: String,
    pub duration_minutes: Option<i64>,
    pub equipment_needed: Vec<String>,
    pub instructions: Vec<String>,
    pub image_url: Option<String>,
    pub images: Option<Vec<String>>,
    pub video_url: Option<String>,
    pub youtube_url: Option<String>,
    pub target_muscles: Vec<String>,
    pub created_at: i64,
    pub is_specialized: bool,
}

impl From<Exercise> for ExerciseResponse {
    fn from(exercise: Exercise) -> Self {
        ExerciseResponse {
            id: exercise.id,
            title: exercise.title,
            description: exercise.description,
            category: exercise.category,
            difficulty_level: exercise.difficulty_level,
            duration_minutes: exercise.duration_minutes,
            equipment_needed: serde_json::from_str(&exercise.equipment_needed).unwrap_or_default(),
            instructions: serde_json::from_str(&exercise.instructions).unwrap_or_default(),
            image_url: exercise.image_url,
            images: None,
            video_url: exercise.video_url,
            youtube_url: exercise.youtube_url,
            target_muscles: serde_json::from_str(&exercise.target_muscles).unwrap_or_default(),
            created_at: exercise.created_at,
            is_specialized: exercise.is_specialized != 0,
        }
    }
}
