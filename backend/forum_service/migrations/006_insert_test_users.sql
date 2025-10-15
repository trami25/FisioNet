-- Insert test users (admin, physiotherapist, patient)

-- Admin user
INSERT OR IGNORE INTO users (
    id, email, password_hash, first_name, last_name, phone, birth_date, 
    height, weight, job_type, role, profile_image, created_at,
    specializations, certifications, years_of_experience, education, bio
) VALUES (
    'admin-001', 
    'admin@fisionet.rs', 
    '$2b$12$LQv3c1yqBwlXvA2H8v9zKOZnOHgFq5eaQ3pJr9XZJgKVqZjYqVq9G', -- password: admin123
    'Administrator', 
    'FisioNet', 
    '+381601234567', 
    '1985-01-15', 
    180.0, 
    75.0, 
    'administrator', 
    'admin', 
    NULL, 
    '2025-10-14T22:00:00Z',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
);

-- Physiotherapist user
INSERT OR IGNORE INTO users (
    id, email, password_hash, first_name, last_name, phone, birth_date, 
    height, weight, job_type, role, profile_image, created_at,
    specializations, certifications, years_of_experience, education, bio
) VALUES (
    'physio-001', 
    'milan.mitrovic@fisionet.rs', 
    '$2b$12$LQv3c1yqBwlXvA2H8v9zKOZnOHgFq5eaQ3pJr9XZJgKVqZjYqVq9G', -- password: physio123
    'Milan', 
    'Mitrović', 
    '+381645000018', 
    '1985-03-20', 
    185.0, 
    80.0, 
    'fizioterapeut', 
    'physiotherapist', 
    NULL, 
    '2025-10-14T22:00:00Z',
    '[{"name": "Sportska fizioterapija", "description": "Specijalizovan za rad sa sportistima i povrede nastale tokom sportskih aktivnosti"}, {"name": "Neurološka rehabilitacija", "description": "Tretman pacijenata sa neurološkim poremećajima"}]',
    '[{"name": "Sertifikat za sportsku fizioterapiju", "issuer": "Fakultet sporta i fizičkog vaspitanja", "date_obtained": "2015-06-15", "expiry_date": "2025-06-15"}, {"name": "NDT Bobath koncept", "issuer": "IBITA", "date_obtained": "2018-09-10", "expiry_date": null}]',
    8,
    'Fakultet sporta i fizičkog vaspitanja, Univerzitet u Beogradu',
    'Fizioterapeut sa preko 8 godina iskustva u radu sa sportistima i pacijentima sa neurološkim poremećajima. Specijalizovan za primenu NDT Bobath koncepta i moderne tehnike u sportskoj rehabilitaciji.'
);

-- Patient user  
INSERT OR IGNORE INTO users (
    id, email, password_hash, first_name, last_name, phone, birth_date, 
    height, weight, job_type, role, profile_image, created_at,
    specializations, certifications, years_of_experience, education, bio
) VALUES (
    'patient-001', 
    'nikola.mitrovic@gmail.com', 
    '$2b$12$LQv3c1yqBwlXvA2H8v9zKOZnOHgFq5eaQ3pJr9XZJgKVqZjYqVq9G', -- password: patient123
    'Nikola', 
    'Mitrović', 
    '+381645000019', 
    '1995-08-12', 
    175.0, 
    70.0, 
    'softverski inženjer', 
    'patient', 
    NULL, 
    '2025-10-14T22:00:00Z',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
);