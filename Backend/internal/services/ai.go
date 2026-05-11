package services

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"golang/internal/config"
)

// ChatMessage is the internal representation passed from the handler.
// Role is always "user" or "assistant" (we translate to Gemini's "model").
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// StreamAI routes to the configured provider and writes SSE tokens to w.
// flush() must call http.Flusher.Flush(). Returns the full response text.
func StreamAI(
	messages []ChatMessage,
	model string,
	w io.Writer,
	flush func(),
) (string, error) {
	return streamGemini(messages, model, w, flush)
}

// ═══════════════════════════════════════════════════════════════════════
// GEMINI — REST generateContent with server-sent events
// Docs: https://ai.google.dev/api/generate-content#streaming
// ═══════════════════════════════════════════════════════════════════════

// geminiPart is a single content part.
type geminiPart struct {
	Text string `json:"text"`
}

// geminiContent is one turn in the conversation.
type geminiContent struct {
	// Gemini roles: "user" | "model"  (NOT "assistant")
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

// geminiRequest is the full POST body for generateContent.
type geminiRequest struct {
	Contents         []geminiContent  `json:"contents"`
	GenerationConfig geminiGenConfig  `json:"generationConfig"`
}

type geminiGenConfig struct {
	MaxOutputTokens int     `json:"maxOutputTokens"`
	Temperature     float64 `json:"temperature"`
}

// geminiStreamChunk is one SSE data payload from Gemini.
type geminiStreamChunk struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
			Role string `json:"role"`
		} `json:"content"`
		FinishReason string `json:"finishReason"`
	} `json:"candidates"`
	// UsageMetadata is present on the final chunk.
	UsageMetadata *struct {
		PromptTokenCount     int `json:"promptTokenCount"`
		CandidatesTokenCount int `json:"candidatesTokenCount"`
	} `json:"usageMetadata,omitempty"`
}

func streamGemini(
	messages []ChatMessage,
	model string,
	w io.Writer,
	flush func(),
) (string, error) {
	// Use free tier model with high quota
	if model == "" || model == "gemini-1.5-flash" || model == "gemini-pro" {
		model = "gemini-2.5-flash-lite"  // 1,000 requests/day free
	}
	// ... rest of your code stays the same
	apiKey := config.App.GEMINI_API_KEY
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not set in environment")
	}

	// ── 1. Build Gemini "contents" array ────────────────────────────
	// Rules:
	//  • Roles must alternate user / model.
	//  • First role must be "user".
	//  • "assistant" → "model" translation required.
	//  • System messages: prepend as a "user" turn + fake "model" ack.
	var contents []geminiContent
	for _, m := range messages {
		role := m.Role
		if role == "assistant" {
			role = "model"
		}
		if role == "system" {
			// Gemini has no system role; inject as user/model pair.
			contents = append(contents,
				geminiContent{
					Role:  "user",
					Parts: []geminiPart{{Text: m.Content}},
				},
				geminiContent{
					Role:  "model",
					Parts: []geminiPart{{Text: "Understood."}},
				},
			)
			continue
		}
		contents = append(contents, geminiContent{
			Role:  role,
			Parts: []geminiPart{{Text: m.Content}},
		})
	}

	// Gemini requires the last message to be from "user".
	if len(contents) == 0 {
		return "", fmt.Errorf("no messages provided")
	}
	if contents[len(contents)-1].Role != "user" {
		return "", fmt.Errorf("last message must be from user")
	}

	// ── 2. Build request body ────────────────────────────────────────
	reqBody := geminiRequest{
		Contents: contents,
		GenerationConfig: geminiGenConfig{
			MaxOutputTokens: 4096,
			Temperature:     0.7,
		},
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	// ── 3. Build URL — API key goes in query param, NOT Bearer header ─
	// streamGenerateContent with alt=sse gives us Server-Sent Events.
	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s",
		model, apiKey,
	)

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// ── 4. Execute request ───────────────────────────────────────────
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	// ── 5. Non-200 → read body and surface the real error ───────────
	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		log.Printf("[gemini] ERROR status=%d body=%s", resp.StatusCode, string(errBody))
		return "", fmt.Errorf("gemini API error (HTTP %d): %s", resp.StatusCode, string(errBody))
	}

	// ── 6. Stream SSE tokens → forward to client ────────────────────
	var full strings.Builder
	scanner := bufio.NewScanner(resp.Body)

	for scanner.Scan() {
		line := scanner.Text()

		// SSE lines look like:  "data: {...json...}"
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")

		// Gemini sends "[DONE]" on some SDKs — handle both forms.
		if data == "[DONE]" {
			break
		}

		var chunk geminiStreamChunk
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			log.Printf("[gemini] unmarshal chunk error: %v | raw: %s", err, data)
			continue
		}

		if len(chunk.Candidates) == 0 {
			continue
		}

		for _, part := range chunk.Candidates[0].Content.Parts {
			if part.Text == "" {
				continue
			}
			full.WriteString(part.Text)
			// Forward token to the HTTP client as SSE.
			fmt.Fprintf(w, "data: %s\n\n", part.Text)
			flush()
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("[gemini] scanner error: %v", err)
		return full.String(), fmt.Errorf("reading gemini stream: %w", err)
	}

	// Signal end of stream to frontend.
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flush()

	return full.String(), nil
}
