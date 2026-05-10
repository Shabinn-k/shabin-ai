package database

import (
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"golang/internal/config"
)

var DB *sqlx.DB

func Connect() {
	db, err := sqlx.Connect("postgres", config.App.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	DB = db
	log.Println("✅ PostgreSQL connected")
	runMigrations()
}

func runMigrations() {
	schema := `
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	CREATE TABLE IF NOT EXISTS users (
		id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name          VARCHAR(255) NOT NULL,
		email         VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255),
		avatar_url    VARCHAR(500),
		provider      VARCHAR(50) DEFAULT 'email',  -- 'email' | 'google'
		provider_id   VARCHAR(255),
		role          VARCHAR(20) DEFAULT 'user',    -- 'user' | 'admin'
		is_active     BOOLEAN DEFAULT true,
		created_at    TIMESTAMPTZ DEFAULT NOW(),
		updated_at    TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS conversations (
		id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		title      VARCHAR(500) DEFAULT 'New Chat',
		model      VARCHAR(100) DEFAULT 'claude-sonnet-4-6',
		is_pinned  BOOLEAN DEFAULT false,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS messages (
		id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
		role            VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
		content         TEXT NOT NULL,
		tokens_used     INTEGER DEFAULT 0,
		file_url        VARCHAR(500),
		created_at      TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS refresh_tokens (
		id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		token_hash VARCHAR(255) UNIQUE NOT NULL,
		expires_at TIMESTAMPTZ NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS saved_prompts (
		id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		title      VARCHAR(255) NOT NULL,
		content    TEXT NOT NULL,
		category   VARCHAR(100),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS api_usage (
		id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		model           VARCHAR(100),
		prompt_tokens   INTEGER DEFAULT 0,
		response_tokens INTEGER DEFAULT 0,
		cost_usd        DECIMAL(10,6) DEFAULT 0,
		created_at      TIMESTAMPTZ DEFAULT NOW()
	);

	-- Indexes for performance
	CREATE INDEX IF NOT EXISTS idx_messages_conv    ON messages(conversation_id, created_at);
	CREATE INDEX IF NOT EXISTS idx_convs_user       ON conversations(user_id, updated_at DESC);
	CREATE INDEX IF NOT EXISTS idx_refresh_tokens   ON refresh_tokens(token_hash);
	CREATE INDEX IF NOT EXISTS idx_api_usage_user   ON api_usage(user_id, created_at DESC);
	`
	if _, err := DB.Exec(schema); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("✅ Database migrations applied")
}
