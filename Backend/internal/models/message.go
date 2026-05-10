package models

import "time"

type Message struct {
	ID             string    `db:"id"              json:"id"`
	ConversationID string    `db:"conversation_id" json:"conversation_id"`
	Role           string    `db:"role"            json:"role"`
	Content        string    `db:"content"         json:"content"`
	TokensUsed     int       `db:"tokens_used"     json:"tokens_used"`
	FileURL        string    `db:"file_url"        json:"file_url,omitempty"`
	CreatedAt      time.Time `db:"created_at"      json:"created_at"`
}