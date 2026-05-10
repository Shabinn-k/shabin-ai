package services

import (
	"context"
	"fmt"
	"golang/internal/config"
	"io"
	"strings"
	"google.golang.org/genai" 
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// StreamAI routes to the configured AI provider and writes SSE tokens to w.
// flush() should call http.Flusher.Flush().
// Returns the full assembled response text.
func StreamAI(messages []ChatMessage, model string, w io.Writer, flush func()) (string, error) {
return streamGemini(messages, model, w, flush)
}

func streamGemini(messages []ChatMessage, model string, w io.Writer, flush func()) (string, error) {
ctx := context.Background()


client, err := genai.NewClient(ctx, &genai.ClientConfig{
	APIKey: config.App.GEMINI_API_KEY,
})
if err != nil {
	return "", err
}

if model == "" {
	model = "gemini-2.0-flash"
}

var prompt strings.Builder

for _, m := range messages {
	prompt.WriteString(m.Role + ": " + m.Content + "\n")
}

stream := client.Models.GenerateContentStream(
	ctx,
	model,
	genai.Text(prompt.String()),
	nil,
)

var full strings.Builder

for chunk, err := range stream {
	if err != nil {
		return "", err
	}

	text := chunk.Text()

	if text == "" {
		continue
	}

	full.WriteString(text)

	fmt.Fprintf(w, "data: %s\n\n", text)
	flush()
}

fmt.Fprintf(w, "data: [DONE]\n\n")
flush()

return full.String(), nil


}
