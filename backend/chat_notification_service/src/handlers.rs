use axum::{
    extract::{ws::{WebSocket, WebSocketUpgrade, Message as WsMessage}, State, Path, Query},
    http::StatusCode,
    response::Response,
    Json,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::mpsc;

use crate::{
    models::*,
    state::AppState,
};

pub async fn health_check() -> &'static str {
    "Chat Service is running!"
}

fn get_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

// WebSocket handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(user_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, user_id, state))
}

async fn handle_socket(socket: WebSocket, user_id: String, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    // Register user connection
    {
        let mut connections = state.ws_connections.lock().await;
        connections.insert(user_id.clone(), tx);
    }
    
    tracing::info!("User {} connected to WebSocket", user_id);

    // Task to send messages from channel to WebSocket
    let user_id_clone = user_id.clone();
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(WsMessage::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages
    while let Some(Ok(msg)) = receiver.next().await {
        if let WsMessage::Text(text) = msg {
            if let Ok(ws_msg) = serde_json::from_str::<WebSocketMessage>(&text) {
                match ws_msg.message_type.as_str() {
                    "ping" => {
                        let pong = serde_json::json!({
                            "message_type": "pong"
                        });
                        
                        let connections = state.ws_connections.lock().await;
                        if let Some(tx) = connections.get(&user_id) {
                            let _ = tx.send(pong.to_string());
                        }
                    }
                    "message" => {
                        if let Ok(send_req) = serde_json::from_value::<SendMessageRequest>(ws_msg.data) {
                            match send_message_internal(&state, &user_id, send_req).await {
                                Ok(message) => {
                                    let response = serde_json::json!({
                                        "message_type": "message_sent",
                                        "data": message
                                    });
                                    
                                    let connections = state.ws_connections.lock().await;
                                    if let Some(tx) = connections.get(&user_id) {
                                        let _ = tx.send(response.to_string());
                                    }
                                }
                                Err(e) => {
                                    tracing::error!("Error sending message: {}", e);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    // Remove user connection when disconnected
    {
        let mut connections = state.ws_connections.lock().await;
        connections.remove(&user_id_clone);
    }
    
    send_task.abort();
    tracing::info!("User {} disconnected from WebSocket", user_id_clone);
}

// REST endpoint: Send message
pub async fn send_message(
    Path(sender_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(req): Json<SendMessageRequest>,
) -> Result<Json<Message>, (StatusCode, Json<ErrorResponse>)> {
    send_message_internal(&state, &sender_id, req)
        .await
        .map(Json)
        .map_err(|e| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))
}

async fn send_message_internal(
    state: &AppState,
    sender_id: &str,
    req: SendMessageRequest,
) -> Result<Message, anyhow::Error> {
    // Create or get conversation
    let conversation_id = get_or_create_conversation(state, sender_id, &req.receiver_id).await?;
    
    // Create message
    let message = Message {
        id: Uuid::new_v4().to_string(),
        conversation_id: conversation_id.clone(),
        sender_id: sender_id.to_string(),
        receiver_id: req.receiver_id.clone(),
        content: req.content,
        timestamp: get_timestamp(),
        read: false,
    };

    // Store message in Redis
    let message_key = format!("message:{}", message.id);
    let message_json = serde_json::to_string(&message)?;
    state.redis.set(&message_key, &message_json).await?;

    // Add to conversation messages list
    let conv_messages_key = format!("conversation:{}:messages", conversation_id);
    state.redis.rpush(&conv_messages_key, &message.id).await?;

    // Update conversation last message
    state.redis.hset(
        &format!("conversation:{}", conversation_id),
        "last_message",
        &message.content,
    ).await?;
    state.redis.hset(
        &format!("conversation:{}", conversation_id),
        "last_message_time",
        &message.timestamp.to_string(),
    ).await?;

    // Increment unread count for receiver
    let unread_key = format!("conversation:{}:unread:{}", conversation_id, req.receiver_id);
    let current_unread: i64 = state.redis.get::<i64>(&unread_key).await.ok().flatten().unwrap_or(0);
    let _ = state.redis.set(&unread_key, &(current_unread + 1).to_string()).await;

    // Send to receiver via WebSocket if online
    {
        let connections = state.ws_connections.lock().await;
        if let Some(tx) = connections.get(&req.receiver_id) {
            let ws_msg = serde_json::json!({
                "message_type": "new_message",
                "data": &message
            });
            let _ = tx.send(ws_msg.to_string());
        }
    }

    Ok(message)
}

async fn get_or_create_conversation(
    state: &AppState,
    user1_id: &str,
    user2_id: &str,
) -> Result<String, anyhow::Error> {
    // Check if conversation exists
    let conv_key1 = format!("user:{}:conversation:{}", user1_id, user2_id);
    let conv_key2 = format!("user:{}:conversation:{}", user2_id, user1_id);

    if let Ok(Some(conv_id)) = state.redis.get::<String>(&conv_key1).await {
        return Ok(conv_id);
    }
    if let Ok(Some(conv_id)) = state.redis.get::<String>(&conv_key2).await {
        return Ok(conv_id);
    }

    // Create new conversation
    let conversation_id = Uuid::new_v4().to_string();
    let conversation = Conversation {
        id: conversation_id.clone(),
        participant1_id: user1_id.to_string(),
        participant2_id: user2_id.to_string(),
        last_message: None,
        last_message_time: None,
        created_at: get_timestamp(),
    };

    // Store conversation
    let conv_data_key = format!("conversation:{}", conversation_id);
    state.redis.hset(&conv_data_key, "id", &conversation.id).await?;
    state.redis.hset(&conv_data_key, "participant1_id", &conversation.participant1_id).await?;
    state.redis.hset(&conv_data_key, "participant2_id", &conversation.participant2_id).await?;
    state.redis.hset(&conv_data_key, "created_at", &conversation.created_at.to_string()).await?;

    // Map users to conversation
    state.redis.set(&conv_key1, &conversation_id).await?;
    state.redis.set(&conv_key2, &conversation_id).await?;

    // Add to user's conversations list
    state.redis.sadd(&format!("user:{}:conversations", user1_id), &conversation_id).await?;
    state.redis.sadd(&format!("user:{}:conversations", user2_id), &conversation_id).await?;

    Ok(conversation_id)
}

// Get user's conversations
pub async fn get_conversations(
    Path(user_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<ConversationsResponse>, (StatusCode, Json<ErrorResponse>)> {
    let conv_ids: Vec<String> = state.redis
        .smembers(&format!("user:{}:conversations", user_id))
        .await
        .map_err(|e| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    let mut conversations = Vec::new();

    for conv_id in conv_ids {
        let conv_key = format!("conversation:{}", conv_id);
        
        let participant1: Option<String> = state.redis.hget(&conv_key, "participant1_id").await.ok().flatten();
        let participant2: Option<String> = state.redis.hget(&conv_key, "participant2_id").await.ok().flatten();
        let last_message: Option<String> = state.redis.hget(&conv_key, "last_message").await.ok().flatten();
        let last_message_time_str: Option<String> = state.redis.hget(&conv_key, "last_message_time").await.ok().flatten();
        let last_message_time = last_message_time_str.and_then(|s| s.parse::<i64>().ok());

        if let (Some(p1), Some(p2)) = (participant1, participant2) {
            let other_user_id = if p1 == user_id { p2 } else { p1 };
            
            // Get user info from auth database
            if let Ok(Some(user_info)) = get_user_info(&state, &other_user_id).await {
                // Count unread messages
                let unread_key = format!("conversation:{}:unread:{}", conv_id, user_id);
                let unread_count: i64 = state.redis
                    .get::<i64>(&unread_key)
                    .await
                    .ok()
                    .flatten()
                    .unwrap_or(0);
                
                conversations.push(ConversationWithUser {
                    conversation_id: conv_id.clone(),
                    other_user_id: other_user_id.clone(),
                    other_user_name: user_info.0,
                    other_user_email: user_info.1,
                    other_user_role: user_info.2,
                    last_message,
                    last_message_time,
                    unread_count: unread_count,
                });
            }
        }
    }

    Ok(Json(ConversationsResponse { conversations }))
}

// Get conversation messages
#[derive(Deserialize)]
pub struct MessagesQuery {
    limit: Option<usize>,
}

pub async fn get_messages(
    Path((_user_id, conversation_id)): Path<(String, String)>,
    Query(query): Query<MessagesQuery>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<MessagesResponse>, (StatusCode, Json<ErrorResponse>)> {
    let conv_messages_key = format!("conversation:{}:messages", conversation_id);
    let limit = query.limit.unwrap_or(50) as isize;
    
    let message_ids: Vec<String> = state.redis
        .lrange(&conv_messages_key, -limit, -1)
        .await
        .map_err(|e| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    let mut messages = Vec::new();
    for msg_id in message_ids {
        let message_key = format!("message:{}", msg_id);
        if let Ok(Some(msg_json)) = state.redis.get::<String>(&message_key).await {
            if let Ok(message) = serde_json::from_str::<Message>(&msg_json) {
                messages.push(message);
            }
        }
    }

    Ok(Json(MessagesResponse { messages }))
}

async fn get_user_info(state: &AppState, user_id: &str) -> Result<Option<(String, String, String)>, anyhow::Error> {
    let row = sqlx::query_as::<_, (String, String, String, String)>(
        "SELECT id, email, first_name || ' ' || last_name as name, role FROM users WHERE id = ?"
    )
    .bind(user_id)
    .fetch_optional(&state.db_pool)
    .await?;

    Ok(row.map(|r| (r.2, r.1, r.3)))
}

// Mark conversation as read
pub async fn mark_conversation_read(
    Path((user_id, conversation_id)): Path<(String, String)>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let unread_key = format!("conversation:{}:unread:{}", conversation_id, user_id);
    
    state.redis.set(&unread_key, "0")
        .await
        .map_err(|e| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    Ok(StatusCode::OK)
}

// Get total unread count for user
pub async fn get_unread_count(
    Path(user_id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    let user_convs_key = format!("user:{}:conversations", user_id);
    let conv_ids: Vec<String> = state.redis
        .smembers(&user_convs_key)
        .await
        .unwrap_or_default();

    let mut total_unread = 0i64;
    for conv_id in conv_ids {
        let unread_key = format!("conversation:{}:unread:{}", conv_id, user_id);
        let unread: i64 = state.redis.get::<i64>(&unread_key).await.ok().flatten().unwrap_or(0);
        total_unread += unread;
    }

    Ok(Json(serde_json::json!({ "unread_count": total_unread })))
}
