package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"golang/internal/database"
	"golang/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /api/conversations
func ListConversations(c *gin.Context) {
	uid := c.GetString("user_id")
	rows, err := database.DB.Query(
		`SELECT id,user_id,title,model,is_pinned,created_at,updated_at
		 FROM conversations WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 50`, uid,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	defer rows.Close()

	convs := []models.Conversation{}
	for rows.Next() {
		var cv models.Conversation
		_ = rows.Scan(&cv.ID, &cv.UserID, &cv.Title, &cv.Model, &cv.IsPinned, &cv.CreatedAt, &cv.UpdatedAt)
		convs = append(convs, cv)
	}
	c.JSON(http.StatusOK, gin.H{"conversations": convs})
}

// GET /api/conversations/:id/messages
func GetMessages(c *gin.Context) {
	uid := c.GetString("user_id")
	convID := c.Param("id")

	var ownerID string
	err := database.DB.QueryRow(`SELECT user_id FROM conversations WHERE id=$1`, convID).Scan(&ownerID)
	if err == sql.ErrNoRows || ownerID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "not found"})
		return
	}

	rows, err := database.DB.Query(
		`SELECT id,conversation_id,role,content,tokens_used,file_url,created_at
		 FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC`, convID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	defer rows.Close()

	msgs := []models.Message{}
	for rows.Next() {
		var m models.Message
		_ = rows.Scan(&m.ID, &m.ConversationID, &m.Role, &m.Content, &m.TokensUsed, &m.FileURL, &m.CreatedAt)
		msgs = append(msgs, m)
	}
	c.JSON(http.StatusOK, gin.H{"messages": msgs})
}

// DELETE /api/conversations/:id
func DeleteConversation(c *gin.Context) {
	uid := c.GetString("user_id")
	convID := c.Param("id")
	res, err := database.DB.Exec(`DELETE FROM conversations WHERE id=$1 AND user_id=$2`, convID, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// PATCH /api/conversations/:id/title
func RenameConversation(c *gin.Context) {
	uid := c.GetString("user_id")
	convID := c.Param("id")
	var req struct {
		Title string `json:"title" binding:"required,max=500"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, _ = database.DB.Exec(
		`UPDATE conversations SET title=$1, updated_at=$2 WHERE id=$3 AND user_id=$4`,
		req.Title, time.Now(), convID, uid,
	)
	c.JSON(http.StatusOK, gin.H{"message": "renamed"})
}

// GET /api/prompts
func ListPrompts(c *gin.Context) {
	uid := c.GetString("user_id")
	rows, err := database.DB.Query(
		`SELECT id,user_id,title,content,category,created_at FROM saved_prompts WHERE user_id=$1 ORDER BY created_at DESC`, uid,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	defer rows.Close()
	prompts := []models.SavedPrompt{}
	for rows.Next() {
		var p models.SavedPrompt
		_ = rows.Scan(&p.ID, &p.UserID, &p.Title, &p.Content, &p.Category, &p.CreatedAt)
		prompts = append(prompts, p)
	}
	c.JSON(http.StatusOK, gin.H{"prompts": prompts})
}

// POST /api/prompts
func CreatePrompt(c *gin.Context) {
	uid := c.GetString("user_id")
	var req struct {
		Title    string `json:"title"    binding:"required,max=255"`
		Content  string `json:"content"  binding:"required"`
		Category string `json:"category"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := uuid.New().String()
	_, _ = database.DB.Exec(
		`INSERT INTO saved_prompts (id,user_id,title,content,category) VALUES ($1,$2,$3,$4,$5)`,
		id, uid, req.Title, req.Content, req.Category,
	)
	c.JSON(http.StatusCreated, gin.H{"prompt": models.SavedPrompt{
		ID: id, UserID: uid, Title: req.Title, Content: req.Content, Category: req.Category,
	}})
}

// DELETE /api/prompts/:id
func DeletePrompt(c *gin.Context) {
	uid := c.GetString("user_id")
	res, _ := database.DB.Exec(`DELETE FROM saved_prompts WHERE id=$1 AND user_id=$2`, c.Param("id"), uid)
	n, _ := res.RowsAffected()
	if n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GET /api/usage
func GetUsage(c *gin.Context) {
	uid := c.GetString("user_id")
	var total struct {
		TotalMessages int     `json:"total_messages"`
		PromptTokens  int     `json:"total_prompt_tokens"`
		ResponseTokens int    `json:"total_response_tokens"`
		CostUSD        float64 `json:"total_cost_usd"`
	}
	_ = database.DB.QueryRow(`
		SELECT COUNT(*),
		       COALESCE(SUM(prompt_tokens),0),
		       COALESCE(SUM(response_tokens),0),
		       COALESCE(SUM(cost_usd),0)
		FROM api_usage WHERE user_id=$1`, uid,
	).Scan(&total.TotalMessages, &total.PromptTokens, &total.ResponseTokens, &total.CostUSD)

	rows, _ := database.DB.Query(
		`SELECT id,user_id,COALESCE(conversation_id,''),model,prompt_tokens,response_tokens,cost_usd,created_at
		 FROM api_usage WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`, uid,
	)
	defer rows.Close()
	recent := []models.APIUsage{}
	for rows.Next() {
		var u models.APIUsage
		_ = rows.Scan(&u.ID, &u.UserID, &u.ConvID, &u.Model, &u.PromptTokens, &u.ResponseTokens, &u.CostUSD, &u.CreatedAt)
		recent = append(recent, u)
	}
	c.JSON(http.StatusOK, gin.H{
		"total_messages":        total.TotalMessages,
		"total_prompt_tokens":   total.PromptTokens,
		"total_response_tokens": total.ResponseTokens,
		"total_cost_usd":        total.CostUSD,
		"recent":                recent,
	})
}