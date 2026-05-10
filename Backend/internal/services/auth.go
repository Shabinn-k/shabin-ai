package services

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang/internal/config"
	"golang/internal/database"
	"golang/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// ── JWT Claims ────────────────────────────────────────────

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// ── Password ──────────────────────────────────────────────

func HashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), 12)
	return string(b), err
}

func CheckPassword(plain, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

// ── Access Token ──────────────────────────────────────────

func GenerateAccessToken(u *models.User) (string, error) {
	exp := time.Now().Add(time.Duration(config.App.JWTExpiryHours) * time.Hour)
	claims := Claims{
		UserID: u.ID,
		Email:  u.Email,
		Role:   u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID,
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString([]byte(config.App.JWTSecret))
}

func ParseAccessToken(raw string) (*Claims, error) {
	t, err := jwt.ParseWithClaims(raw, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.App.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	c, ok := t.Claims.(*Claims)
	if !ok || !t.Valid {
		return nil, errors.New("invalid token")
	}
	return c, nil
}

// ── Refresh Token ─────────────────────────────────────────

func HashToken(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func GenerateRefreshToken(userID string) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	raw := hex.EncodeToString(b)
	h := HashToken(raw)
	exp := time.Now().AddDate(0, 0, config.App.JWTRefreshExpiryDays)
	_, err := database.DB.Exec(
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
		userID, h, exp,
	)
	return raw, err
}

func ValidateRefreshToken(raw string) (string, error) {
	h := HashToken(raw)
	var userID string
	var exp time.Time
	err := database.DB.QueryRow(
		`SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = $1`, h,
	).Scan(&userID, &exp)
	if err == sql.ErrNoRows {
		return "", errors.New("token not found")
	}
	if err != nil {
		return "", err
	}
	if time.Now().After(exp) {
		_, _ = database.DB.Exec(`DELETE FROM refresh_tokens WHERE token_hash = $1`, h)
		return "", errors.New("token expired")
	}
	// Rotate: delete after use
	_, _ = database.DB.Exec(`DELETE FROM refresh_tokens WHERE token_hash = $1`, h)
	return userID, nil
}

func RevokeRefreshToken(raw string) {
	h := HashToken(raw)
	_, _ = database.DB.Exec(`DELETE FROM refresh_tokens WHERE token_hash = $1`, h)
}

// ── User Lookup ───────────────────────────────────────────

func GetUserByID(id string) (*models.User, error) {
	row := database.DB.QueryRow(
		`SELECT id,name,email,password_hash,avatar_url,provider,provider_id,role,is_active,created_at,updated_at
		 FROM users WHERE id = $1`, id,
	)
	var u models.User
	if err := models.ScanUser(row, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func GetUserByEmail(email string) (*models.User, error) {
	row := database.DB.QueryRow(
		`SELECT id,name,email,password_hash,avatar_url,provider,provider_id,role,is_active,created_at,updated_at
		 FROM users WHERE email = $1`, email,
	)
	var u models.User
	if err := models.ScanUser(row, &u); err != nil {
		return nil, err
	}
	return &u, nil
}