-- Initial appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    physiotherapist_id TEXT NOT NULL,
    appointment_date DATETIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    patient_notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_physiotherapist ON appointments(physiotherapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);