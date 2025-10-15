use axum::{
    extract::{Path, Extension, Json, Query},
    http::StatusCode,
    response::IntoResponse,
};
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use crate::models::*;

#[derive(Debug, Deserialize)]
pub struct AuthHeader {
    pub user_id: i64,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_page() -> i64 { 1 }
fn default_limit() -> i64 { 20 }

pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

// Get all posts with pagination
pub async fn get_posts(
    Extension(pool): Extension<SqlitePool>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<Vec<PostWithAuthor>>, (StatusCode, Json<ErrorResponse>)> {
    let offset = (params.page - 1) * params.limit;
    
    let posts = sqlx::query_as::<_, PostWithAuthor>(
        r#"
        SELECT 
            p.id, p.author_id, p.title, p.content, p.created_at, p.updated_at,
            COALESCE(u.first_name || ' ' || u.last_name, 'Unknown User') as author_name,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
        "#
    )
    .bind(params.limit)
    .bind(offset)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    Ok(Json(posts))
}

// Get single post
pub async fn get_post(
    Extension(pool): Extension<SqlitePool>,
    Path(post_id): Path<i64>,
) -> Result<Json<PostWithAuthor>, (StatusCode, Json<ErrorResponse>)> {
    let post = sqlx::query_as::<_, PostWithAuthor>(
        r#"
        SELECT 
            p.id, p.author_id, p.title, p.content, p.created_at, p.updated_at,
            COALESCE(u.first_name || ' ' || u.last_name, 'Unknown User') as author_name,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
        "#
    )
    .bind(post_id)
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
            Json(ErrorResponse { error: "Post not found".to_string() }),
        )
    })?;

    Ok(Json(post))
}

// Create post
pub async fn create_post(
    Extension(pool): Extension<SqlitePool>,
    Json(req): Json<CreatePostRequest>,
) -> Result<Json<Post>, (StatusCode, Json<ErrorResponse>)> {
    // For now, using a hardcoded user_id. In production, extract from JWT token
    let user_id = 1;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let result = sqlx::query(
        r#"
        INSERT INTO posts (author_id, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        "#
    )
    .bind(user_id)
    .bind(&req.title)
    .bind(&req.content)
    .bind(now)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    let post = Post {
        id: result.last_insert_rowid(),
        author_id: user_id,
        title: req.title,
        content: req.content,
        created_at: now,
        updated_at: now,
    };

    Ok(Json(post))
}

// Update post
pub async fn update_post(
    Extension(pool): Extension<SqlitePool>,
    Path(post_id): Path<i64>,
    Json(req): Json<UpdatePostRequest>,
) -> Result<Json<Post>, (StatusCode, Json<ErrorResponse>)> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // Get existing post
    let existing_post = sqlx::query_as::<_, Post>(
        "SELECT * FROM posts WHERE id = ?"
    )
    .bind(post_id)
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
            Json(ErrorResponse { error: "Post not found".to_string() }),
        )
    })?;

    let title = req.title.unwrap_or(existing_post.title);
    let content = req.content.unwrap_or(existing_post.content);

    sqlx::query(
        r#"
        UPDATE posts 
        SET title = ?, content = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&title)
    .bind(&content)
    .bind(now)
    .bind(post_id)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    let post = Post {
        id: post_id,
        author_id: existing_post.author_id,
        title,
        content,
        created_at: existing_post.created_at,
        updated_at: now,
    };

    Ok(Json(post))
}

// Delete post
pub async fn delete_post(
    Extension(pool): Extension<SqlitePool>,
    Path(post_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Delete comments first (foreign key constraint)
    sqlx::query("DELETE FROM comments WHERE post_id = ?")
        .bind(post_id)
        .execute(&pool)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse { error: format!("Database error: {}", e) }),
            )
        })?;

    let result = sqlx::query("DELETE FROM posts WHERE id = ?")
        .bind(post_id)
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
            Json(ErrorResponse { error: "Post not found".to_string() }),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

// Get comments for a post
pub async fn get_post_comments(
    Extension(pool): Extension<SqlitePool>,
    Path(post_id): Path<i64>,
) -> Result<Json<Vec<CommentWithAuthor>>, (StatusCode, Json<ErrorResponse>)> {
    let comments = sqlx::query_as::<_, CommentWithAuthor>(
        r#"
        SELECT 
            c.id, c.post_id, c.author_id, c.content, c.created_at, c.updated_at,
            COALESCE(u.first_name || ' ' || u.last_name, 'Unknown User') as author_name
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
        "#
    )
    .bind(post_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    Ok(Json(comments))
}

// Create comment
pub async fn create_comment(
    Extension(pool): Extension<SqlitePool>,
    Path(post_id): Path<i64>,
    Json(req): Json<CreateCommentRequest>,
) -> Result<Json<Comment>, (StatusCode, Json<ErrorResponse>)> {
    // For now, using a hardcoded user_id. In production, extract from JWT token
    let user_id = 1;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let result = sqlx::query(
        r#"
        INSERT INTO comments (post_id, author_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        "#
    )
    .bind(post_id)
    .bind(user_id)
    .bind(&req.content)
    .bind(now)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    let comment = Comment {
        id: result.last_insert_rowid(),
        post_id,
        author_id: user_id,
        content: req.content,
        created_at: now,
        updated_at: now,
    };

    Ok(Json(comment))
}

// Update comment
pub async fn update_comment(
    Extension(pool): Extension<SqlitePool>,
    Path((post_id, comment_id)): Path<(i64, i64)>,
    Json(req): Json<UpdateCommentRequest>,
) -> Result<Json<Comment>, (StatusCode, Json<ErrorResponse>)> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // Get existing comment
    let existing_comment = sqlx::query_as::<_, Comment>(
        "SELECT * FROM comments WHERE id = ? AND post_id = ?"
    )
    .bind(comment_id)
    .bind(post_id)
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
            Json(ErrorResponse { error: "Comment not found".to_string() }),
        )
    })?;

    sqlx::query(
        r#"
        UPDATE comments 
        SET content = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(&req.content)
    .bind(now)
    .bind(comment_id)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: format!("Database error: {}", e) }),
        )
    })?;

    let comment = Comment {
        id: comment_id,
        post_id,
        author_id: existing_comment.author_id,
        content: req.content,
        created_at: existing_comment.created_at,
        updated_at: now,
    };

    Ok(Json(comment))
}

// Delete comment
pub async fn delete_comment(
    Extension(pool): Extension<SqlitePool>,
    Path((post_id, comment_id)): Path<(i64, i64)>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let result = sqlx::query("DELETE FROM comments WHERE id = ? AND post_id = ?")
        .bind(comment_id)
        .bind(post_id)
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
            Json(ErrorResponse { error: "Comment not found".to_string() }),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}
