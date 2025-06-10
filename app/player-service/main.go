package main

import (
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/hugo/player-service/routes"
)

func main() {
	// Initialisation du générateur de nombres aléatoires
	rand.Seed(time.Now().UnixNano())

	// Configuration du logger
	routes.InitLogger()

	// Configuration du router Gin
	router := gin.New()
	router.Use(gin.Recovery())

	// Middleware CORS pour permettre toutes les origines
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3002", "http://localhost:3001", "https://github.com", "*"},
		AllowMethods:     []string{"PUT", "PATCH", "POST", "GET", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "x-request-id", "Content-Type", "content-type"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	// Middleware pour logger les requêtes
	router.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		// Traitement de la requête
		c.Next()

		// Après traitement
		latency := time.Since(start)
		status := c.Writer.Status()

		fmt.Printf("[GIN] %d | %s | %s\n",
			status,
			latency.String(),
			path,
		)
	})

	// Configuration des routes
	routes.SetupRoutes(router)

	// Récupération du port depuis la variable d'environnement
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Démarrage du serveur
	router.Run(":" + port)
}
