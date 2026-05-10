package models

import "time"

type Conversation struct {
	ID        string    `db:"id"         json:"id"`
	UserID    string    `db:"user_id"    json:"user_id"`
	Title     string    `db:"title"      json:"title"`
	Model     string    `db:"model"      json:"model"`
	IsPinned  bool      `db:"is_pinned"  json:"is_pinned"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}