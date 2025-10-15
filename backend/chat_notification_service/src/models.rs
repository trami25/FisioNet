use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub sender_id: String,
    pub receiver_id: String,
    pub content: String,
    pub timestamp: i64, // Unix timestamp
    pub read: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub participant1_id: String,
    pub participant2_id: String,
    pub last_message: Option<String>,
    pub last_message_time: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub receiver_id: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_type: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Serialize)]
pub struct ConversationsResponse {
    pub conversations: Vec<ConversationWithUser>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ConversationWithUser {
    pub conversation_id: String,
    pub other_user_id: String,
    pub other_user_name: String,
    pub other_user_email: String,
    pub other_user_role: String,
    pub last_message: Option<String>,
    pub last_message_time: Option<i64>,
    pub unread_count: i64,
}

#[derive(Debug, Serialize)]
pub struct MessagesResponse {
    pub messages: Vec<Message>,
}
