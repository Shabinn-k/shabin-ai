package services

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"golang/internal/config"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// StreamAI routes to the configured AI provider and writes SSE tokens to w.
// flush() should call http.Flusher.Flush().
// Returns the full assembled response text.
func StreamAI(messages []ChatMessage, model string, w io.Writer, flush func()) (string, error) {
	switch config.App.AIProvider {
	case "openai":
		return streamOpenAI(messages, model, w, flush)
	default:
		return streamClaude(messages, model, w, flush)
	}
}

// ── Anthropic (Claude) ────────────────────────────────────

func streamClaude(messages []ChatMessage, model string, w io.Writer, flush func()) (string, error) {
	if model == "" {
		model = "claude-sonnet-4-6"
	}

	type msg struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	type payload struct {
		Model     string `json:"model"`
		MaxTokens int    `json:"max_tokens"`
		Stream    bool   `json:"stream"`
		Messages  []msg  `json:"messages"`
	}

	msgs := make([]msg, len(messages))
	for i, m := range messages {
		msgs[i] = msg{Role: m.Role, Content: m.Content}
	}

	body, _ := json.Marshal(payload{
		Model:     model,
		MaxTokens: 4096,
		Stream:    true,
		Messages:  msgs,
	})

	req, err := http.NewRequest(http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("x-api-key", config.App.AnthropicAPIKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("anthropic request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("anthropic error %d: %s", resp.StatusCode, string(b))
	}

	var full strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}
		var event struct {
			Type  string `json:"type"`
			Delta struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"delta"`
		}
		if err := json.Unmarshal([]byte(data), &event); err != nil {
			continue
		}
		if event.Type == "content_block_delta" && event.Delta.Type == "text_delta" {
			token := event.Delta.Text
			full.WriteString(token)
			fmt.Fprintf(w, "data: %s\n\n", token)
			flush()
		}
	}
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flush()
	return full.String(), scanner.Err()
}

// ── OpenAI ────────────────────────────────────────────────

func streamOpenAI(messages []ChatMessage, model string, w io.Writer, flush func()) (string, error) {
	if model == "" {
		model = "gpt-4o"
	}

	type msg struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	type payload struct {
		Model    string `json:"model"`
		Stream   bool   `json:"stream"`
		Messages []msg  `json:"messages"`
	}

	msgs := make([]msg, len(messages))
	for i, m := range messages {
		msgs[i] = msg{Role: m.Role, Content: m.Content}
	}

	body, _ := json.Marshal(payload{Model: model, Stream: true, Messages: msgs})
	req, err := http.NewRequest(http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+config.App.OpenAIAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("openai error %d: %s", resp.StatusCode, string(b))
	}

	var full strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}
		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &chunk); err != nil || len(chunk.Choices) == 0 {
			continue
		}
		token := chunk.Choices[0].Delta.Content
		if token == "" {
			continue
		}
		full.WriteString(token)
		fmt.Fprintf(w, "data: %s\n\n", token)
		flush()
	}
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flush()
	return full.String(), scanner.Err()
}
