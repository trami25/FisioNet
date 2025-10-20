use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id: i64,
    pub author_id: String,
    pub title: String,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePostRequest {
    pub title: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePostRequest {
    pub title: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Comment {
    pub id: i64,
    pub post_id: i64,
    pub author_id: String,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCommentRequest {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PostWithAuthor {
    pub id: i64,
    pub author_id: String,
    pub author_name: String,
    pub author_profile_image: Option<String>,
    pub title: String,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub comments_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CommentWithAuthor {
    pub id: i64,
    pub post_id: i64,
    pub author_id: String,
    pub author_name: String,
    pub author_profile_image: Option<String>,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
}
