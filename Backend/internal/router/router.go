package router

import (
	"github.com/gin-gonic/gin"
	"golang/internal/config"
	"golang/internal/handlers"
	"golang/internal/middleware"
)

func Setup() *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())
	r.Use(middleware.RateLimit())

	r.Static("/uploads", config.App.UploadDir)

	api := r.Group("/api")
	
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.POST("/refresh", handlers.RefreshToken)
		auth.POST("/logout", handlers.Logout)
		auth.GET("/google", handlers.GoogleLogin)
		auth.GET("/google/callback", handlers.GoogleCallback)
	}

	protected := api.Group("/", middleware.AuthRequired())
	{
		protected.GET("/user/me", handlers.GetMe)
		protected.PATCH("/user/me", handlers.UpdateMe)

		protected.POST("/chat/stream", middleware.ChatRateLimit(), handlers.StreamChat)

		protected.GET("/conversations", handlers.ListConversations)
		protected.GET("/conversations/:id/messages", handlers.GetMessages)
		protected.DELETE("/conversations/:id", handlers.DeleteConversation)
		protected.PATCH("/conversations/:id/title", handlers.RenameConversation)

		protected.GET("/prompts", handlers.ListPrompts)
		protected.POST("/prompts", handlers.CreatePrompt)
		protected.DELETE("/prompts/:id", handlers.DeletePrompt)

		protected.GET("/usage", handlers.GetUsage)
	}

	admin := api.Group("/admin", middleware.AuthRequired(), middleware.AdminRequired())
	{
		admin.GET("/users", handlers.AdminListUsers)
		admin.PATCH("/users/:id", handlers.AdminUpdateUser)
		admin.GET("/stats", handlers.AdminStats)
	}

	return r
}