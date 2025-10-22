-- Migration 008: Convert author_id columns from INTEGER to TEXT (UUIDs)
-- This migration is safe for SQLite: it creates new tables with the desired schema,
-- copies existing rows (casting integer author_id to text), drops old tables and renames.
-- PREREQ: make a backup of your database file before running migrations if you care about production data.


-- Posts: create new table with TEXT author_id
CREATE TABLE IF NOT EXISTS posts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Copy rows, casting existing author_id to TEXT
INSERT INTO posts_new (id, author_id, title, content, created_at, updated_at)
SELECT id, CAST(author_id AS TEXT), title, content, created_at, updated_at FROM posts;

-- Comments: create new table with TEXT author_id
CREATE TABLE IF NOT EXISTS comments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts_new(id) ON DELETE CASCADE
);

-- Copy comments, casting author_id to TEXT
INSERT INTO comments_new (id, post_id, author_id, content, created_at, updated_at)
SELECT c.id, c.post_id, CAST(c.author_id AS TEXT), c.content, c.created_at, c.updated_at
FROM comments c;

-- Drop old tables and rename new ones
DROP TABLE comments;
DROP TABLE posts;

ALTER TABLE posts_new RENAME TO posts;
ALTER TABLE comments_new RENAME TO comments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- Note: the migration runner wraps each migration in a transaction, so do not use BEGIN/COMMIT here.
