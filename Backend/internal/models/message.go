package models

import "time"

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversation_id"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	TokensUsed     int       `json:"tokens_used"`
	FileURL        string    `json:"file_url,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type SavedPrompt struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Category  string    `json:"category"`
	CreatedAt time.Time `json:"created_at"`
}

type APIUsage struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	ConvID         string    `json:"conversation_id"`
	Model          string    `json:"model"`
	PromptTokens   int       `json:"prompt_tokens"`
	ResponseTokens int       `json:"response_tokens"`
	CostUSD        float64   `json:"cost_usd"`
	CreatedAt      time.Time `json:"created_at"`
}