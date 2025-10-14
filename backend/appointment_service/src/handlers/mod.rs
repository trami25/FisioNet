use axum::{
    http::StatusCode,
    Json,
    extract::{Path, Query},
    Extension,
};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use chrono::{NaiveTime, Duration};

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Deserialize)]
pub struct AvailableSlotsQuery {
    pub date: String,
}

#[derive(Serialize)]
pub struct TimeSlot {
    pub time: String,
    pub available: bool,
    pub booked: bool,
}

#[derive(Serialize)]
pub struct AvailableSlotsResponse {
    pub date: String,
    pub slots: Vec<TimeSlot>,
}

#[derive(Deserialize)]
pub struct CreateAppointmentRequest {
    pub patient_id: String,
    pub physiotherapist_id: String,
    pub appointment_date: String,
    pub start_time: String,
}

#[derive(Serialize)]
pub struct AppointmentResponse {
    pub id: String,
    pub patient_id: String,
    pub physiotherapist_id: String,
    pub appointment_date: String,
    pub start_time: String,
    pub end_time: String,
    pub duration_minutes: i32,
    pub status: String,
}

#[derive(Serialize)]
pub struct AppointmentsListResponse {
    pub appointments: Vec<AppointmentResponse>,
}

pub async fn health_check() -> &'static str {
    "Appointment Service is running!"
}

pub async fn get_available_slots(
    Path(physiotherapist_id): Path<String>,
    Query(query): Query<AvailableSlotsQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<AvailableSlotsResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Generiši sve slotove od 8:00 do 16:00 (20-minutni intervali)
    let mut slots = Vec::new();
    let start_hour = 8;
    let end_hour = 16;
    
    for hour in start_hour..end_hour {
        for minute in [0, 20, 40] {
            let time_str = format!("{:02}:{:02}", hour, minute);
            
            // Proveri da li je slot zauzet u bazi
            let count: i64 = sqlx::query_scalar(
                r#"
                SELECT COUNT(*) FROM appointments
                WHERE physiotherapist_id = ?
                AND appointment_date = ?
                AND start_time = ?
                AND status != 'cancelled'
                "#
            )
            .bind(&physiotherapist_id)
            .bind(&query.date)
            .bind(&time_str)
            .fetch_one(&pool)
            .await
            .unwrap_or(0);
            
            let is_booked = count > 0;
            
            slots.push(TimeSlot {
                time: time_str,
                available: !is_booked,
                booked: is_booked,
            });
        }
    }

    Ok(Json(AvailableSlotsResponse {
        date: query.date,
        slots,
    }))
}

pub async fn create_appointment(
    Extension(pool): Extension<SqlitePool>,
    Json(req): Json<CreateAppointmentRequest>,
) -> Result<Json<AppointmentResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Generiši UUID
    let id = uuid::Uuid::new_v4().to_string();
    
    // Izračunaj end_time (start_time + 20 minuta)
    let start_time = NaiveTime::parse_from_str(&req.start_time, "%H:%M")
        .map_err(|_| (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: "Invalid time format".to_string() })
        ))?;
    
    let end_time = start_time + Duration::minutes(20);
    let end_time_str = end_time.format("%H:%M").to_string();
    
    // Proveri da li je slot već zauzet
    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*) FROM appointments
        WHERE physiotherapist_id = ?
        AND appointment_date = ?
        AND start_time = ?
        AND status != 'cancelled'
        "#
    )
    .bind(&req.physiotherapist_id)
    .bind(&req.appointment_date)
    .bind(&req.start_time)
    .fetch_one(&pool)
    .await
    .map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ErrorResponse { error: format!("Database error: {}", e) })
    ))?;
    
    if count > 0 {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse { error: "Time slot already booked".to_string() })
        ));
    }
    
    // Kreiraj appointment
    let now = chrono::Utc::now().to_rfc3339();
    
    sqlx::query(
        r#"
        INSERT INTO appointments (
            id, patient_id, physiotherapist_id, appointment_date,
            start_time, end_time, duration_minutes, status,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&req.patient_id)
    .bind(&req.physiotherapist_id)
    .bind(&req.appointment_date)
    .bind(&req.start_time)
    .bind(&end_time_str)
    .bind(20)
    .bind("scheduled")
    .bind(&now)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ErrorResponse { error: format!("Failed to create appointment: {}", e) })
    ))?;
    
    Ok(Json(AppointmentResponse {
        id,
        patient_id: req.patient_id,
        physiotherapist_id: req.physiotherapist_id,
        appointment_date: req.appointment_date,
        start_time: req.start_time,
        end_time: end_time_str,
        duration_minutes: 20,
        status: "scheduled".to_string(),
    }))
}

pub async fn get_user_appointments(
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<AppointmentsListResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Za sada vraćam sve appointments
    let rows = sqlx::query_as::<_, (String, String, String, String, String, String, i32, String)>(
        r#"
        SELECT id, patient_id, physiotherapist_id, appointment_date,
               start_time, end_time, duration_minutes, status
        FROM appointments
        ORDER BY appointment_date DESC, start_time DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ErrorResponse { error: format!("Database error: {}", e) })
    ))?;
    
    let appointments = rows.into_iter().map(|row| AppointmentResponse {
        id: row.0,
        patient_id: row.1,
        physiotherapist_id: row.2,
        appointment_date: row.3,
        start_time: row.4,
        end_time: row.5,
        duration_minutes: row.6,
        status: row.7,
    }).collect();
    
    Ok(Json(AppointmentsListResponse { appointments }))
}

pub async fn update_appointment_status(
    Path(id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
    Json(status): Json<serde_json::Value>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let status_str = status.get("status")
        .and_then(|s| s.as_str())
        .ok_or((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: "Missing status field".to_string() })
        ))?;
    
    let now = chrono::Utc::now().to_rfc3339();
    
    let result = sqlx::query(
        r#"
        UPDATE appointments
        SET status = ?, updated_at = ?
        WHERE id = ?
        "#
    )
    .bind(status_str)
    .bind(&now)
    .bind(&id)
    .execute(&pool)
    .await
    .map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ErrorResponse { error: format!("Database error: {}", e) })
    ))?;
    
    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "Appointment not found".to_string() })
        ));
    }
    
    Ok(StatusCode::OK)
}
