package database

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
	"golang/internal/config"
)

var DB *sql.DB

func Connect() {
	db, err := sql.Open("postgres", config.App.DatabaseURL)
	if err != nil {
		log.Fatalf("[db] open failed: %v", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatalf("[db] ping failed: %v", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	DB = db
	log.Println("[db] PostgreSQL connected")
	migrate()
}

func migrate() {
	schema := `
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	CREATE TABLE IF NOT EXISTS users (
		id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name          VARCHAR(255) NOT NULL,
		email         VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255),
		avatar_url    TEXT DEFAULT '',
		provider      VARCHAR(50) DEFAULT 'email',
		provider_id   VARCHAR(255) DEFAULT '',
		role          VARCHAR(20) DEFAULT 'user',
		is_active     BOOLEAN DEFAULT TRUE,
		created_at    TIMESTAMPTZ DEFAULT NOW(),
		updated_at    TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS refresh_tokens (
		id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		token_hash VARCHAR(255) UNIQUE NOT NULL,
		expires_at TIMESTAMPTZ NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS conversations (
		id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		title      VARCHAR(500) DEFAULT 'New Chat',
		model      VARCHAR(100) DEFAULT 'claude-sonnet-4-6',
		is_pinned  BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS messages (
		id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
		role            VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
		content         TEXT NOT NULL DEFAULT '',
		tokens_used     INTEGER DEFAULT 0,
		file_url        TEXT DEFAULT '',
		created_at      TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS saved_prompts (
		id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		title      VARCHAR(255) NOT NULL,
		content    TEXT NOT NULL,
		category   VARCHAR(100) DEFAULT '',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS api_usage (
		id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		conversation_id UUID,
		model           VARCHAR(100) DEFAULT '',
		prompt_tokens   INTEGER DEFAULT 0,
		response_tokens INTEGER DEFAULT 0,
		cost_usd        NUMERIC(10,6) DEFAULT 0,
		created_at      TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
	CREATE INDEX IF NOT EXISTS idx_messages_conv      ON messages(conversation_id, created_at ASC);
	CREATE INDEX IF NOT EXISTS idx_refresh_hash       ON refresh_tokens(token_hash);
	CREATE INDEX IF NOT EXISTS idx_usage_user         ON api_usage(user_id, created_at DESC);
	`
	if _, err := DB.Exec(schema); err != nil {
		log.Fatalf("[db] migration failed: %v", err)
	}
	log.Println("[db] migrations applied")
}
