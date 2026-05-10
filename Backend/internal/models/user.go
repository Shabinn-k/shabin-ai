package models

import "time"

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	AvatarURL    string    `json:"avatar_url"`
	Provider     string    `json:"provider"`
	ProviderID   string    `json:"-"`
	Role         string    `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func ScanUser(row interface{ Scan(...interface{}) error }, u *User) error {
	return row.Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash,
		&u.AvatarURL, &u.Provider, &u.ProviderID,
		&u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
}
