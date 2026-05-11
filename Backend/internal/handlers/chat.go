package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang/internal/config"
	"golang/internal/database"
	"golang/internal/services"
)

// POST /api/chat/stream
func StreamChat(c *gin.Context) {
	uid := c.GetString("user_id")
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	message := c.PostForm("message")
	convID := c.PostForm("conversation_id")
	model := c.DefaultPostForm("model", "gemini-2.5-flash-lite")

	if message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message is required"})
		return
	}

	// ── Optional file upload ─────────────────────────────────────────
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

	// ── Create conversation if new ───────────────────────────────────
	if convID == "" {
		convID = uuid.New().String()
		title := message
		if len([]rune(title)) > 60 {
			title = string([]rune(title)[:60]) + "…"
		}
		if _, err := database.DB.Exec(
			`INSERT INTO conversations (id,user_id,title,model) VALUES ($1,$2,$3,$4)`,
			convID, uid, title, model,
		); err != nil {
			log.Printf("[chat] create conversation error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create conversation"})
			return
		}
	} else {
		// Verify ownership
		var ownerID string
		err := database.DB.QueryRow(
			`SELECT user_id FROM conversations WHERE id=$1`, convID,
		).Scan(&ownerID)
		if err == sql.ErrNoRows || ownerID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "conversation not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
	}

	// ── FIX 3: Load history BEFORE inserting the new user message ────
	// If we inserted first, the new turn would appear in history and be
	// sent to the AI twice (once in history + once as the last message).
	rows, err := database.DB.Query(
		`SELECT role, content FROM messages
		 WHERE conversation_id=$1
		 ORDER BY created_at ASC
		 LIMIT 40`, // 40 turns ≈ reasonable context window
		convID,
	)
	if err != nil {
		log.Printf("[chat] load history error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load history"})
		return
	}

	var history []services.ChatMessage
	for rows.Next() {
		var m services.ChatMessage
		if err := rows.Scan(&m.Role, &m.Content); err != nil {
			log.Printf("[chat] scan history row error: %v", err)
		} else {
			history = append(history, m)
		}
	}
	rows.Close()

	// Append the current user message at the end of history.
	history = append(history, services.ChatMessage{
		Role:    "user",
		Content: message,
	})

	// ── Persist user message ─────────────────────────────────────────
	if _, err := database.DB.Exec(
		`INSERT INTO messages (id,conversation_id,role,content,file_url)
		 VALUES ($1,$2,'user',$3,$4)`,
		uuid.New().String(), convID, message, fileURL,
	); err != nil {
		log.Printf("[chat] persist user message error: %v", err)
		// Non-fatal — continue even if persistence fails
	}

	// ── FIX 1 & 4: Set ALL SSE headers BEFORE writing any bytes ──────
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")       // required when behind Nginx
	c.Header("X-Conversation-ID", convID)      // let frontend know the new ID
	c.Header("Transfer-Encoding", "chunked")
	c.Status(http.StatusOK)

	// ── FIX 5: Verify flusher before starting stream ─────────────────
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		log.Printf("[chat] ResponseWriter does not implement http.Flusher")
		// We already wrote 200 headers, send error over SSE
		fmt.Fprintf(c.Writer, "data: ⚠️ Streaming not supported by this server.\n\ndata: [DONE]\n\n")
		return
	}

	// ── Call AI service (Gemini or DeepSeek) ─────────────────────────
	full, aiErr := services.StreamAI(history, model, c.Writer, func() {
		flusher.Flush()
	})

	// ── FIX 2: Surface the real AI error in logs AND in the SSE stream
	if aiErr != nil {
		log.Printf("[chat] StreamAI error conv=%s: %v", convID, aiErr)
		// Only send error token if nothing was streamed yet
		if full == "" {
			errMsg := fmt.Sprintf("⚠️ AI error: %v", aiErr)
			fmt.Fprintf(c.Writer, "data: %s\n\ndata: [DONE]\n\n", errMsg)
			flusher.Flush()
		}
		return
	}

	// ── Persist assistant reply ───────────────────────────────────────
	if full != "" {
		if _, err := database.DB.Exec(
			`INSERT INTO messages (id,conversation_id,role,content)
			 VALUES ($1,$2,'assistant',$3)`,
			uuid.New().String(), convID, full,
		); err != nil {
			log.Printf("[chat] persist assistant message error: %v", err)
		}
		if _, err := database.DB.Exec(
			`UPDATE conversations SET updated_at=$1 WHERE id=$2`,
			time.Now(), convID,
		); err != nil {
			log.Printf("[chat] update conversation timestamp error: %v", err)
		}

		// Record usage (rough token estimate)
		promptTokens := estimateTokens(message)
		responseTokens := estimateTokens(full)
		costUSD := estimateCost(model, promptTokens, responseTokens)
		if _, err := database.DB.Exec(
			`INSERT INTO api_usage
			 (id,user_id,conversation_id,model,prompt_tokens,response_tokens,cost_usd)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			uuid.New().String(), uid, convID, model,
			promptTokens, responseTokens, costUSD,
		); err != nil {
			log.Printf("[chat] record usage error: %v", err)
		}
	}
}

// estimateTokens is a rough chars/4 approximation.
func estimateTokens(text string) int {
	return len([]rune(text)) / 4
}

// estimateCost uses published per-million-token pricing (as of mid-2025).
func estimateCost(model string, prompt, response int) float64 {
	var inputCPM, outputCPM float64 // cost per million tokens
	switch model {
	case "gemini-1.5-pro":
		inputCPM, outputCPM = 3.50, 10.50
	case "gemini-1.5-flash":
		inputCPM, outputCPM = 0.075, 0.30
	case "deepseek-chat":
		inputCPM, outputCPM = 0.14, 0.28
	default:
		inputCPM, outputCPM = 0.075, 0.30
	}
	return (float64(prompt)*inputCPM + float64(response)*outputCPM) / 1_000_000
}