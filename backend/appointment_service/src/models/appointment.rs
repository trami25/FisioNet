use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate, NaiveTime};
use anyhow::Result;

// Appointment status
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum AppointmentStatus {
    Scheduled,
    Confirmed,
    Cancelled,
    Completed,
    NoShow,
}

impl std::str::FromStr for AppointmentStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "scheduled" => Ok(AppointmentStatus::Scheduled),
            "confirmed" => Ok(AppointmentStatus::Confirmed),
            "cancelled" => Ok(AppointmentStatus::Cancelled),
            "completed" => Ok(AppointmentStatus::Completed),
            "no_show" => Ok(AppointmentStatus::NoShow),
            _ => Err(format!("Invalid appointment status: {}", s)),
        }
    }
}

impl ToString for AppointmentStatus {
    fn to_string(&self) -> String {
        match self {
            AppointmentStatus::Scheduled => "scheduled".to_string(),
            AppointmentStatus::Confirmed => "confirmed".to_string(),
            AppointmentStatus::Cancelled => "cancelled".to_string(),
            AppointmentStatus::Completed => "completed".to_string(),
            AppointmentStatus::NoShow => "no_show".to_string(),
        }
    }
}

// Appointment model
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Appointment {
    pub id: String,
    pub patient_id: String,
    pub physiotherapist_id: String,
    pub appointment_date: NaiveDate,
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub duration_minutes: i32,
    pub status: AppointmentStatus,
    pub notes: Option<String>,
    pub patient_notes: Option<String>,
    pub physiotherapist_notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Request DTOs
#[derive(Debug, Deserialize)]
pub struct CreateAppointmentRequest {
    pub physiotherapist_id: String,
    pub appointment_date: String, // YYYY-MM-DD
    pub start_time: String,       // HH:MM
    pub duration_minutes: i32,    // Should be 20, 40, or 60 (1-3 consecutive slots)
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAppointmentRequest {
    pub status: Option<AppointmentStatus>,
    pub notes: Option<String>,
    pub patient_notes: Option<String>,
    pub physiotherapist_notes: Option<String>,
}

// Response DTOs
#[derive(Debug, Serialize)]
pub struct AppointmentResponse {
    pub id: String,
    pub patient_id: String,
    pub physiotherapist_id: String,
    pub appointment_date: String,
    pub start_time: String,
    pub end_time: String,
    pub duration_minutes: i32,
    pub status: String,
    pub notes: Option<String>,
    pub patient_notes: Option<String>,
    pub physiotherapist_notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Time slot for scheduling
#[derive(Debug, Serialize, Clone)]
pub struct TimeSlot {
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub is_available: bool,
}

// Available slots response
#[derive(Debug, Serialize)]
pub struct AvailableSlotsResponse {
    pub date: String,
    pub physiotherapist_id: String,
    pub slots: Vec<TimeSlot>,
}

impl Appointment {
    // Create new appointment
    pub async fn create(pool: &SqlitePool, patient_id: &str, request: CreateAppointmentRequest) -> Result<Self> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        
        // Parse date and time
        let appointment_date = NaiveDate::parse_from_str(&request.appointment_date, "%Y-%m-%d")?;
        let start_time = NaiveTime::parse_from_str(&request.start_time, "%H:%M")?;
        let end_time = start_time + chrono::Duration::minutes(request.duration_minutes as i64);

        // Validate duration (must be 20, 40, or 60 minutes)
        if ![20, 40, 60].contains(&request.duration_minutes) {
            return Err(anyhow::anyhow!("Duration must be 20, 40, or 60 minutes"));
        }

        // Check for conflicts and business rules
        Self::validate_appointment_rules(pool, patient_id, &request.physiotherapist_id, 
                                       appointment_date, start_time, request.duration_minutes).await?;

        let appointment = Self {
            id: id.clone(),
            patient_id: patient_id.to_string(),
            physiotherapist_id: request.physiotherapist_id,
            appointment_date,
            start_time,
            end_time,
            duration_minutes: request.duration_minutes,
            status: AppointmentStatus::Scheduled,
            notes: request.notes,
            patient_notes: None,
            physiotherapist_notes: None,
            created_at: now,
            updated_at: now,
        };

        sqlx::query!(
            r#"
            INSERT INTO appointments (
                id, patient_id, physiotherapist_id, appointment_date, 
                start_time, end_time, duration_minutes, status, notes, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            appointment.id,
            appointment.patient_id,
            appointment.physiotherapist_id,
            appointment.appointment_date.format("%Y-%m-%d").to_string(),
            appointment.start_time.format("%H:%M").to_string(),
            appointment.end_time.format("%H:%M").to_string(),
            appointment.duration_minutes,
            appointment.status.to_string(),
            appointment.notes,
            appointment.created_at.to_rfc3339(),
            appointment.updated_at.to_rfc3339()
        )
        .execute(pool)
        .await?;

        Ok(appointment)
    }

    // Validate appointment business rules
    async fn validate_appointment_rules(
        pool: &SqlitePool,
        patient_id: &str,
        physiotherapist_id: &str,
        appointment_date: NaiveDate,
        start_time: NaiveTime,
        duration_minutes: i32,
    ) -> Result<()> {
        let end_time = start_time + chrono::Duration::minutes(duration_minutes as i64);

        // Check if physiotherapist is available
        let conflicts = sqlx::query!(
            r#"
            SELECT COUNT(*) as count FROM appointments 
            WHERE physiotherapist_id = ? 
            AND appointment_date = ? 
            AND status NOT IN ('cancelled')
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
            "#,
            physiotherapist_id,
            appointment_date.format("%Y-%m-%d").to_string(),
            start_time.format("%H:%M").to_string(),
            start_time.format("%H:%M").to_string(),
            end_time.format("%H:%M").to_string(),
            end_time.format("%H:%M").to_string(),
            start_time.format("%H:%M").to_string(),
            end_time.format("%H:%M").to_string()
        )
        .fetch_one(pool)
        .await?;

        if conflicts.count > 0 {
            return Err(anyhow::anyhow!("Physiotherapist is not available at this time"));
        }

        // Check patient's existing appointments for the day
        let patient_appointments = sqlx::query!(
            r#"
            SELECT start_time, end_time, duration_minutes FROM appointments 
            WHERE patient_id = ? 
            AND appointment_date = ? 
            AND status NOT IN ('cancelled')
            ORDER BY start_time
            "#,
            patient_id,
            appointment_date.format("%Y-%m-%d").to_string()
        )
        .fetch_all(pool)
        .await?;

        // Rule: Maximum 3 consecutive slots (60 minutes) per day
        let total_duration: i32 = patient_appointments.iter()
            .map(|a| a.duration_minutes)
            .sum();
        
        if total_duration + duration_minutes > 60 {
            return Err(anyhow::anyhow!("Maximum 3 consecutive slots (60 minutes) allowed per day"));
        }

        // Rule: Patient cannot book non-adjacent slots on the same day
        if !patient_appointments.is_empty() {
            let new_start = start_time;
            let new_end = end_time;
            
            let mut is_adjacent = false;
            for existing in &patient_appointments {
                let existing_start = NaiveTime::parse_from_str(&existing.start_time, "%H:%M")?;
                let existing_end = NaiveTime::parse_from_str(&existing.end_time, "%H:%M")?;
                
                // Check if new appointment is adjacent to existing one
                if new_end == existing_start || new_start == existing_end {
                    is_adjacent = true;
                    break;
                }
            }
            
            if !is_adjacent {
                return Err(anyhow::anyhow!("Patient can only book adjacent time slots on the same day"));
            }
        }

        Ok(())
    }

    // Find appointment by ID
    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Self>> {
        let row = sqlx::query!(
            "SELECT * FROM appointments WHERE id = ?",
            id
        )
        .fetch_optional(pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(Self::from_row(&row)?))
        } else {
            Ok(None)
        }
    }

    // Find appointments by patient ID
    pub async fn find_by_patient(pool: &SqlitePool, patient_id: &str) -> Result<Vec<Self>> {
        let rows = sqlx::query!(
            "SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC, start_time ASC",
            patient_id
        )
        .fetch_all(pool)
        .await?;

        let mut appointments = Vec::new();
        for row in rows {
            appointments.push(Self::from_row(&row)?);
        }
        Ok(appointments)
    }

    // Find appointments by physiotherapist ID
    pub async fn find_by_physiotherapist(pool: &SqlitePool, physiotherapist_id: &str) -> Result<Vec<Self>> {
        let rows = sqlx::query!(
            "SELECT * FROM appointments WHERE physiotherapist_id = ? ORDER BY appointment_date DESC, start_time ASC",
            physiotherapist_id
        )
        .fetch_all(pool)
        .await?;

        let mut appointments = Vec::new();
        for row in rows {
            appointments.push(Self::from_row(&row)?);
        }
        Ok(appointments)
    }

    // Update appointment
    pub async fn update(pool: &SqlitePool, id: &str, request: UpdateAppointmentRequest) -> Result<Option<Self>> {
        let mut appointment = match Self::find_by_id(pool, id).await? {
            Some(app) => app,
            None => return Ok(None),
        };

        // Update fields if provided
        if let Some(status) = request.status {
            appointment.status = status;
        }
        if let Some(notes) = request.notes {
            appointment.notes = Some(notes);
        }
        if let Some(patient_notes) = request.patient_notes {
            appointment.patient_notes = Some(patient_notes);
        }
        if let Some(physiotherapist_notes) = request.physiotherapist_notes {
            appointment.physiotherapist_notes = Some(physiotherapist_notes);
        }

        appointment.updated_at = Utc::now();

        sqlx::query!(
            r#"
            UPDATE appointments SET 
                status = ?, notes = ?, patient_notes = ?, 
                physiotherapist_notes = ?, updated_at = ?
            WHERE id = ?
            "#,
            appointment.status.to_string(),
            appointment.notes,
            appointment.patient_notes,
            appointment.physiotherapist_notes,
            appointment.updated_at.to_rfc3339(),
            id
        )
        .execute(pool)
        .await?;

        Ok(Some(appointment))
    }

    // Get available time slots for a physiotherapist on a specific date
    pub async fn get_available_slots(
        pool: &SqlitePool,
        physiotherapist_id: &str,
        date: NaiveDate,
    ) -> Result<Vec<TimeSlot>> {
        // Working hours: 8:00 to 18:00 (10 hours)
        // 20-minute slots: 30 slots total
        let start_hour = 8;
        let end_hour = 18;
        let slot_duration = 20;

        let mut slots = Vec::new();

        // Generate all possible 20-minute slots
        for hour in start_hour..end_hour {
            for minute in [0, 20, 40] {
                let start_time = NaiveTime::from_hms_opt(hour as u32, minute, 0).unwrap();
                let end_time = start_time + chrono::Duration::minutes(slot_duration);
                
                // Don't add slots that go past working hours
                if end_time > NaiveTime::from_hms_opt(end_hour as u32, 0, 0).unwrap() {
                    break;
                }

                slots.push(TimeSlot {
                    start_time,
                    end_time,
                    is_available: true,
                });
            }
        }

        // Check existing appointments and mark slots as unavailable
        let existing_appointments = sqlx::query!(
            r#"
            SELECT start_time, end_time FROM appointments 
            WHERE physiotherapist_id = ? 
            AND appointment_date = ? 
            AND status NOT IN ('cancelled')
            "#,
            physiotherapist_id,
            date.format("%Y-%m-%d").to_string()
        )
        .fetch_all(pool)
        .await?;

        for appointment in existing_appointments {
            let app_start = NaiveTime::parse_from_str(&appointment.start_time, "%H:%M")?;
            let app_end = NaiveTime::parse_from_str(&appointment.end_time, "%H:%M")?;

            // Mark overlapping slots as unavailable
            for slot in &mut slots {
                if (slot.start_time >= app_start && slot.start_time < app_end) ||
                   (slot.end_time > app_start && slot.end_time <= app_end) ||
                   (slot.start_time <= app_start && slot.end_time >= app_end) {
                    slot.is_available = false;
                }
            }
        }

        Ok(slots)
    }

    // Convert from database row
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self> {
        let appointment_date = NaiveDate::parse_from_str(&row.get::<String, _>("appointment_date"), "%Y-%m-%d")?;
        let start_time = NaiveTime::parse_from_str(&row.get::<String, _>("start_time"), "%H:%M")?;
        let end_time = NaiveTime::parse_from_str(&row.get::<String, _>("end_time"), "%H:%M")?;
        let status: AppointmentStatus = row.get::<String, _>("status").parse()
            .map_err(|e| anyhow::anyhow!("Failed to parse appointment status: {}", e))?;
        let created_at = DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?.with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?.with_timezone(&Utc);

        Ok(Self {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            physiotherapist_id: row.get("physiotherapist_id"),
            appointment_date,
            start_time,
            end_time,
            duration_minutes: row.get("duration_minutes"),
            status,
            notes: row.get("notes"),
            patient_notes: row.get("patient_notes"),
            physiotherapist_notes: row.get("physiotherapist_notes"),
            created_at,
            updated_at,
        })
    }

    // Convert to response DTO
    pub fn to_response(&self) -> AppointmentResponse {
        AppointmentResponse {
            id: self.id.clone(),
            patient_id: self.patient_id.clone(),
            physiotherapist_id: self.physiotherapist_id.clone(),
            appointment_date: self.appointment_date.format("%Y-%m-%d").to_string(),
            start_time: self.start_time.format("%H:%M").to_string(),
            end_time: self.end_time.format("%H:%M").to_string(),
            duration_minutes: self.duration_minutes,
            status: self.status.to_string(),
            notes: self.notes.clone(),
            patient_notes: self.patient_notes.clone(),
            physiotherapist_notes: self.physiotherapist_notes.clone(),
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        }
    }
}

// Error response
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}