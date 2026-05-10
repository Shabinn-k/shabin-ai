package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang/internal/config"
	"golang/internal/database"
	"golang/internal/services"
)


func StreamChat(c *gin.Context) {
	uid := c.GetString("user_id")

	message := c.PostForm("message")
	convID := c.PostForm("conversation_id")
	model := c.DefaultPostForm("model", "claude-sonnet-4-6")

	if message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message is required"})
		return
	}

	
	var fileURL string
	if file, err := c.FormFile("file"); err == nil {
		if file.Size > config.App.MaxUploadMB*1024*1024 {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large"})
			return
		}
		url, err := services.SaveUploadedFile(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		fileURL = url
	}

	
	if convID == "" {
		convID = uuid.New().String()
		title := message
		if len(title) > 60 {
			title = title[:60] + "…"
		}
		_, err := database.DB.Exec(
			`INSERT INTO conversations (id,user_id,title,model) VALUES ($1,$2,$3,$4)`,
			convID, uid, title, model,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create conversation"})
			return
		}
	} else {
		
		var ownerID string
		err := database.DB.QueryRow(`SELECT user_id FROM conversations WHERE id=$1`, convID).Scan(&ownerID)
		if err == sql.ErrNoRows || ownerID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "conversation not found"})
			return
		}
	}

	
	msgID := uuid.New().String()
	_, _ = database.DB.Exec(
		`INSERT INTO messages (id,conversation_id,role,content,file_url) VALUES ($1,$2,'user',$3,$4)`,
		msgID, convID, message, fileURL,
	)

	
	rows, err := database.DB.Query(
		`SELECT role, content FROM messages WHERE conversation_id=$1
		 ORDER BY created_at ASC LIMIT 20`, convID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load history"})
		return
	}
	defer rows.Close()

	var history []services.ChatMessage
	for rows.Next() {
		var m services.ChatMessage
		_ = rows.Scan(&m.Role, &m.Content)
		history = append(history, m)
	}

	
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("X-Accel-Buffering", "no")
	c.Header("X-Conversation-ID", convID)
	c.Status(http.StatusOK)

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming not supported"})
		return
	}

	full, aiErr := services.StreamAI(history, model, c.Writer, func() {
		flusher.Flush()
	})

	if aiErr != nil {
		
		_, _ = c.Writer.WriteString("data: ⚠️ AI service error. Please try again.\n\ndata: [DONE]\n\n")
		flusher.Flush()
	}
 
	if full != "" {
		aiMsgID := uuid.New().String()
		_, _ = database.DB.Exec(
			`INSERT INTO messages (id,conversation_id,role,content) VALUES ($1,$2,'assistant',$3)`,
			aiMsgID, convID, full,
		)
		_, _ = database.DB.Exec(
			`UPDATE conversations SET updated_at=$1 WHERE id=$2`, time.Now(), convID,
		)

		promptTokens := estimateTokens(message)
		responseTokens := estimateTokens(full)
		costUSD := estimateCost(model, promptTokens, responseTokens)
		_, _ = database.DB.Exec(
			`INSERT INTO api_usage (id,user_id,conversation_id,model,prompt_tokens,response_tokens,cost_usd)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			uuid.New().String(), uid, convID, model, promptTokens, responseTokens, costUSD,
		)
	}
}

func estimateTokens(text string) int {
	return len(text) / 4
}

func estimateCost(model string, prompt, response int) float64 {
	
	var inputCost, outputCost float64
	switch model {
	case "claude-opus-4-6":
		inputCost, outputCost = 15.0, 75.0
	case "gpt-4o":
		inputCost, outputCost = 5.0, 15.0
	default: 
		inputCost, outputCost = 3.0, 15.0
	}
	return (float64(prompt)*inputCost + float64(response)*outputCost) / 1_000_000
}
