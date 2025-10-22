-- Migration: Add ON DELETE CASCADE to appointments table for user deletion
-- This migration will drop and recreate the appointments table with ON DELETE CASCADE for patient_id and physiotherapist_id foreign keys.

PRAGMA foreign_keys=off;

-- Rename the existing table
ALTER TABLE appointments RENAME TO appointments_old;

-- Recreate the appointments table with ON DELETE CASCADE
CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    physiotherapist_id TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    patient_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (physiotherapist_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Copy data from the old table
INSERT INTO appointments SELECT * FROM appointments_old;

-- Drop the old table
DROP TABLE appointments_old;

PRAGMA foreign_keys=on;
