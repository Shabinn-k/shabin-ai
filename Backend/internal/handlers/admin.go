package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang/internal/database"
	"golang/internal/models"
)

func AdminListUsers(c *gin.Context) {
	rows, err := database.DB.Query(
		`SELECT id,name,email,password_hash,avatar_url,provider,provider_id,role,is_active,created_at,updated_at
		 FROM users ORDER BY created_at DESC LIMIT 200`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	defer rows.Close()
	users := []models.User{}
	for rows.Next() {
		var u models.User
		_ = models.ScanUser(rows, &u)
		users = append(users, u)
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

// PATCH /api/admin/users/:id
func AdminUpdateUser(c *gin.Context) {
	targetID := c.Param("id")
	var req struct {
		IsActive *bool   `json:"is_active"`
		Role     *string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.IsActive != nil {
		_, _ = database.DB.Exec(`UPDATE users SET is_active=$1, updated_at=NOW() WHERE id=$2`, *req.IsActive, targetID)
	}
	if req.Role != nil {
		_, _ = database.DB.Exec(`UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2`, *req.Role, targetID)
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// GET /api/admin/stats
func AdminStats(c *gin.Context) {
	var s struct {
		TotalUsers    int     `json:"total_users"`
		ActiveToday   int     `json:"active_today"`
		TotalConvs    int     `json:"total_conversations"`
		TotalMessages int     `json:"total_messages"`
		TotalCost     float64 `json:"total_cost_usd"`
	}
	_ = database.DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&s.TotalUsers)
	_ = database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE updated_at > NOW() - INTERVAL '24 hours'`).Scan(&s.ActiveToday)
	_ = database.DB.QueryRow(`SELECT COUNT(*) FROM conversations`).Scan(&s.TotalConvs)
	_ = database.DB.QueryRow(`SELECT COUNT(*) FROM messages`).Scan(&s.TotalMessages)
	_ = database.DB.QueryRow(`SELECT COALESCE(SUM(cost_usd),0) FROM api_usage`).Scan(&s.TotalCost)
	c.JSON(http.StatusOK, gin.H{"stats": s})
}