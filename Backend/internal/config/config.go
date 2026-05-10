package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	JWTSecret           string
	JWTRefreshSecret    string
	JWTExpiryHours      int
	JWTRefreshExpiryDays int
	AnthropicAPIKey     string
	OpenAIAPIKey        string
	GoogleClientID      string
	GoogleClientSecret  string
	GoogleRedirectURL   string
	FrontendURL         string
	UploadDir           string
	MaxUploadMB         int64
}

var App *Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, reading from environment")
	}
	jwtHours, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	jwtDays, _  := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_DAYS", "30"))
	maxMB, _    := strconv.ParseInt(getEnv("MAX_UPLOAD_MB", "10"), 10, 64)

	App = &Config{
		Port:                 getEnv("PORT", "8080"),
		DatabaseURL:          mustGetEnv("DATABASE_URL"),
		JWTSecret:            mustGetEnv("JWT_SECRET"),
		JWTRefreshSecret:     mustGetEnv("JWT_REFRESH_SECRET"),
		JWTExpiryHours:       jwtHours,
		JWTRefreshExpiryDays: jwtDays,
		AnthropicAPIKey:      getEnv("ANTHROPIC_API_KEY", ""),
		OpenAIAPIKey:         getEnv("OPENAI_API_KEY", ""),
		GoogleClientID:       getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:   getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:    getEnv("GOOGLE_REDIRECT_URL", ""),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
		UploadDir:            getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadMB:          maxMB,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" { return v }
	return fallback
}
func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" { log.Fatalf("Required env var %s is not set", key) }
	return v
}