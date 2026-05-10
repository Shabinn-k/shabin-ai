package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type bucket struct {
	timestamps []time.Time
	mu         sync.Mutex
}

type rateLimiter struct {
	buckets sync.Map
	limit   int
	window  time.Duration
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{limit: limit, window: window}
}

func (r *rateLimiter) allow(key string) bool {
	now := time.Now()
	v, _ := r.buckets.LoadOrStore(key, &bucket{})
	b := v.(*bucket)
	b.mu.Lock()
	defer b.mu.Unlock()

	var recent []time.Time
	for _, t := range b.timestamps {
		if now.Sub(t) < r.window {
			recent = append(recent, t)
		}
	}
	if len(recent) >= r.limit {
		b.timestamps = recent
		return false
	}
	b.timestamps = append(recent, now)
	return true
}

var apiLimiter = newRateLimiter(100, time.Minute)
var chatLimiter = newRateLimiter(30, time.Minute)

func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()
		if !apiLimiter.allow(key) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, slow down",
			})
			return
		}
		c.Next()
	}
}

func ChatRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetString("user_id")
		if key == "" {
			key = c.ClientIP()
		}
		if !chatLimiter.allow(key) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "chat rate limit exceeded, wait a moment",
			})
			return
		}
		c.Next()
	}
}