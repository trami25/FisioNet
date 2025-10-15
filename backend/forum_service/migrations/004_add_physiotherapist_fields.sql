-- Add specializations and certifications for physiotherapists
ALTER TABLE users ADD COLUMN specializations TEXT; -- JSON array of specializations
ALTER TABLE users ADD COLUMN certifications TEXT; -- JSON array of certifications
ALTER TABLE users ADD COLUMN years_of_experience INTEGER;
ALTER TABLE users ADD COLUMN education TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;