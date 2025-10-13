use axum::{
    routing::{get, post, put, delete},
    http::StatusCode,
    Json, Router, extract::Path,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;

#[derive(Serialize, Deserialize, Clone)]
struct Exercise {
    id: String,
    title: String,
    description: String,
    category: String,
    difficulty_level: String,
    duration_minutes: Option<i32>,
    equipment_needed: Vec<String>,
    instructions: Vec<String>,
    image_url: Option<String>,
    video_url: Option<String>,
    youtube_url: Option<String>,
    target_muscles: Vec<String>,
    created_at: String,
}

#[derive(Deserialize)]
struct CreateExerciseRequest {
    title: String,
    description: String,
    category: String,
    difficulty_level: String,
    duration_minutes: Option<i32>,
    equipment_needed: Vec<String>,
    instructions: Vec<String>,
    image_url: Option<String>,
    video_url: Option<String>,
    youtube_url: Option<String>,
    target_muscles: Vec<String>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/", get(root))
        .route("/exercises", get(get_exercises))
        .route("/exercises", post(create_exercise))
        .route("/exercises/:id", get(get_exercise))
        .route("/exercises/:id", put(update_exercise))
        .route("/exercises/:id", delete(delete_exercise))
        .route("/exercises/search", get(search_exercises))
        .route("/exercises/categories", get(get_categories))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3002));
    println!("Exercise service listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn root() -> &'static str {
    "Exercise Service - FisioNet"
}

async fn get_exercises() -> Result<Json<Vec<Exercise>>, StatusCode> {
    // TODO: Implement database query
    let dummy_exercises = vec![
        Exercise {
            id: "1".to_string(),
            title: "Push-ups".to_string(),
            description: "Basic upper body exercise".to_string(),
            category: "Strength".to_string(),
            difficulty_level: "Beginner".to_string(),
            duration_minutes: Some(10),
            equipment_needed: vec![],
            instructions: vec!["Place hands on ground".to_string(), "Lower body".to_string(), "Push up".to_string()],
            image_url: None,
            video_url: None,
            youtube_url: Some("https://youtube.com/watch?v=example".to_string()),
            target_muscles: vec!["Chest".to_string(), "Arms".to_string()],
            created_at: "2024-01-01T00:00:00Z".to_string(),
        }
    ];
    Ok(Json(dummy_exercises))
}

async fn create_exercise(Json(payload): Json<CreateExerciseRequest>) -> Result<Json<Exercise>, StatusCode> {
    // TODO: Implement database insert
    let exercise = Exercise {
        id: uuid::Uuid::new_v4().to_string(),
        title: payload.title,
        description: payload.description,
        category: payload.category,
        difficulty_level: payload.difficulty_level,
        duration_minutes: payload.duration_minutes,
        equipment_needed: payload.equipment_needed,
        instructions: payload.instructions,
        image_url: payload.image_url,
        video_url: payload.video_url,
        youtube_url: payload.youtube_url,
        target_muscles: payload.target_muscles,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    Ok(Json(exercise))
}

async fn get_exercise(Path(id): Path<String>) -> Result<Json<Exercise>, StatusCode> {
    // TODO: Implement database query by ID
    Err(StatusCode::NOT_FOUND)
}

async fn update_exercise(Path(id): Path<String>, Json(payload): Json<CreateExerciseRequest>) -> Result<Json<Exercise>, StatusCode> {
    // TODO: Implement database update
    Err(StatusCode::NOT_FOUND)
}

async fn delete_exercise(Path(id): Path<String>) -> Result<StatusCode, StatusCode> {
    // TODO: Implement database delete
    Err(StatusCode::NOT_FOUND)
}

async fn search_exercises() -> Result<Json<Vec<Exercise>>, StatusCode> {
    // TODO: Implement search functionality
    Ok(Json(vec![]))
}

async fn get_categories() -> Result<Json<Vec<String>>, StatusCode> {
    let categories = vec![
        "Strength".to_string(),
        "Flexibility".to_string(),
        "Balance".to_string(),
        "Cardio".to_string(),
        "Rehabilitation".to_string(),
    ];
    Ok(Json(categories))
}
