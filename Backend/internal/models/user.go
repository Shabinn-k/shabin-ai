package models

import "time"

type User struct {
	ID           string    `db:"id"            json:"id"`
	Name         string    `db:"name"          json:"name"`
	Email        string    `db:"email"         json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	AvatarURL    string    `db:"avatar_url"    json:"avatar_url"`
	Provider     string    `db:"provider"      json:"provider"`
	ProviderID   string    `db:"provider_id"   json:"-"`
	Role         string    `db:"role"          json:"role"`
	IsActive     bool      `db:"is_active"     json:"is_active"`
	CreatedAt    time.Time `db:"created_at"    json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"    json:"updated_at"`
}
