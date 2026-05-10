package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang/internal/config"
	"golang/internal/database"
	"golang/internal/models"
	"golang/internal/services"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuth *oauth2.Config

func InitOAuth() {
	googleOAuth = &oauth2.Config{
		ClientID:     config.App.GoogleClientID,
		ClientSecret: config.App.GoogleClientSecret,
		RedirectURL:  config.App.GoogleRedirectURL,
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}
}

func issueTokens(c *gin.Context, u *models.User) {
	access, err := services.GenerateAccessToken(u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}
	refresh, err := services.GenerateRefreshToken(u.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "refresh token failed"})
		return
	}
	_, _ = database.DB.Exec(`UPDATE users SET updated_at=$1 WHERE id=$2`, time.Now(), u.ID)
	c.JSON(http.StatusOK, gin.H{
		"token":         access,
		"refresh_token": refresh,
		"user":          u,
	})
}


func Register(c *gin.Context) {
	var req struct {
		Name     string `json:"name"     binding:"required,min=2,max=100"`
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required,min=8,max=100"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int
	_ = database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE email=$1`, req.Email).Scan(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	hash, err := services.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "password hashing failed"})
		return
	}

	id := uuid.New().String()
	_, err = database.DB.Exec(
		`INSERT INTO users (id,name,email,password_hash,provider,role) VALUES ($1,$2,$3,$4,'email','user')`,
		id, req.Name, req.Email, hash,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create account"})
		return
	}

	u, _ := services.GetUserByID(id)
	issueTokens(c, u)
}

func Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := services.GetUserByEmail(req.Email)
	if err == sql.ErrNoRows || !services.CheckPassword(req.Password, u.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if !u.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "account is suspended"})
		return
	}
	issueTokens(c, u)
}


func RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := services.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	u, err := services.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	issueTokens(c, u)
}


func Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.RefreshToken != "" {
		services.RevokeRefreshToken(req.RefreshToken)
	}
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}


func GoogleLogin(c *gin.Context) {
	if googleOAuth.ClientID == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google OAuth not configured"})
		return
	}
	url := googleOAuth.AuthCodeURL("shabin-state", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}


func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code"})
		return
	}

	token, err := googleOAuth.Exchange(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OAuth exchange failed"})
		return
	}

	client := googleOAuth.Client(c.Request.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user info"})
		return
	}
	defer resp.Body.Close()

	var info struct {
		ID      string `json:"id"`
		Name    string `json:"name"`
		Email   string `json:"email"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse user info"})
		return
	}


	var u models.User
	row := database.DB.QueryRow(
		`SELECT id,name,email,password_hash,avatar_url,provider,provider_id,role,is_active,created_at,updated_at
		 FROM users WHERE email=$1`, info.Email,
	)
	err = models.ScanUser(row, &u)
	if err == sql.ErrNoRows {
		id := uuid.New().String()
		_, _ = database.DB.Exec(
			`INSERT INTO users (id,name,email,avatar_url,provider,provider_id,role)
			 VALUES ($1,$2,$3,$4,'google',$5,'user')`,
			id, info.Name, info.Email, info.Picture, info.ID,
		)
		u.ID = id
		u.Name = info.Name
		u.Email = info.Email
		u.AvatarURL = info.Picture
		u.Provider = "google"
		u.Role = "user"
		u.IsActive = true
	}

	access, _ := services.GenerateAccessToken(&u)
	refresh, _ := services.GenerateRefreshToken(u.ID)
	redirect := fmt.Sprintf("%s/auth/callback?token=%s&refresh=%s",
		config.App.FrontendURL, access, refresh)
	c.Redirect(http.StatusTemporaryRedirect, redirect)
}
