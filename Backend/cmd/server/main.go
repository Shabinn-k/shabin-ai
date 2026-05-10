package server

import (
	"fmt"
	"log"
	"os"

	"golang/internal/config"
	"golang/internal/database"
	"golang/internal/handlers"
	"golang/internal/router"
)

func main() {
	config.Load()
	database.Connect()
	handlers.InitOAuth()

	if err := os.MkdirAll(config.App.UploadDir, 0755); err != nil {
		log.Fatalf("cannot create upload dir: %v", err)
	}

	r := router.Setup()
	addr := fmt.Sprintf(":%s", config.App.Port)
	log.Printf(" Shabin AI backend running on %s", addr)
	log.Fatal(r.Run(addr))
}