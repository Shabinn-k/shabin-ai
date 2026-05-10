package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang/internal/database"
	"golang/internal/services"
)
 
func GetMe(c *gin.Context) {
	uid := c.GetString("user_id")
	u, err := services.GetUserByID(uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": u})
}


func UpdateMe(c *gin.Context) {
	uid := c.GetString("user_id")
	var req struct {
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := database.DB.Exec(
		`UPDATE users SET name=$1, avatar_url=$2, updated_at=$3 WHERE id=$4`,
		req.Name, req.AvatarURL, time.Now(), uid,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	u, _ := services.GetUserByID(uid)
	c.JSON(http.StatusOK, gin.H{"user": u})
}