CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    physiotherapist_id TEXT NOT NULL,
    appointment_date TEXT NOT NULL, -- YYYY-MM-DD format
    start_time TEXT NOT NULL,       -- HH:MM format
    end_time TEXT NOT NULL,         -- HH:MM format
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    patient_notes TEXT,
    physiotherapist_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Index for efficient queries
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_physiotherapist ON appointments(physiotherapist_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, start_time);