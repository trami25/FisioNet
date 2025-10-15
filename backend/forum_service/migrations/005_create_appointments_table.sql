-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    physiotherapist_id TEXT NOT NULL,
    appointment_date TEXT NOT NULL, -- YYYY-MM-DD format
    start_time TEXT NOT NULL,       -- HH:MM format  
    end_time TEXT NOT NULL,         -- HH:MM format
    duration_minutes INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
    notes TEXT,                     -- Physiotherapist notes
    patient_notes TEXT,             -- Patient notes
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES users (id),
    FOREIGN KEY (physiotherapist_id) REFERENCES users (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_physiotherapist_id ON appointments(physiotherapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, start_time);