package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"github.com/hugo/player-service/models"
)

var log = logrus.New()
var playerName string
var httpClient = &http.Client{
	Timeout: 5 * time.Second,
}

// InitLogger initialise le logger au format JSON
func InitLogger() {
	log.SetFormatter(&logrus.JSONFormatter{})
	log.SetOutput(os.Stdout)
	log.SetLevel(logrus.InfoLevel)
}

// SetupRoutes configure les routes de l'API
func SetupRoutes(router *gin.Engine) {
	// Récupération du nom du joueur depuis la variable d'environnement
	playerName = os.Getenv("PLAYER_NAME")
	if playerName == "" {
		log.Fatal("PLAYER_NAME environment variable is required")
	}

	// Configuration des routes
	router.GET("/ping", PingHandler)
	router.POST("/challenge", ChallengeHandler)
	router.GET("/swagger.json", SwaggerHandler)


	// Handle health check for Kubernetes
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"player": playerName,
		})
	})
}

// PingHandler gère les requêtes GET /ping
func PingHandler(c *gin.Context) {
	// Increment ping counter

	// Simulation d'une latence aléatoire entre 100 et 1000ms
	latency := rand.Intn(901) + 100
	time.Sleep(time.Duration(latency) * time.Millisecond)

	// Record ping latency

	// Logging des headers pertinents
	requestID := c.GetHeader("X-Request-ID")
	meshTrace := c.GetHeader("X-Mesh-Trace")

	// Logs structurés
	logFields := logrus.Fields{
		"endpoint":   "/ping",
		"latency_ms": latency,
	}

	if requestID != "" {
		logFields["x_request_id"] = requestID
	}
	if meshTrace != "" {
		logFields["x_mesh_trace"] = meshTrace
	}

	// Ajout de tous les headers commençant par X- pour le debugging
	for k, v := range c.Request.Header {
		if len(k) > 2 && k[:2] == "X-" {
			logFields[fmt.Sprintf("header_%s", k)] = v
		}
	}

	log.WithFields(logFields).Info("Ping request received")

	// Vérification du mode d'échec (pour les tests de résilience)
	failMode := os.Getenv("FAIL_MODE")
	if failMode != "" {
		statusCode, err := fmt.Sscanf(failMode, "%d", new(int))
		if err == nil && statusCode > 0 {
			// Record error
			c.Status(statusCode)
			return
		}
	}

	// Préparation de la réponse
	response := models.PingResponse{
		Player:    playerName,
		Status:    "pong",
		LatencyMs: latency,
	}

	c.JSON(http.StatusOK, response)
}

// ChallengeHandler gère les requêtes POST /challenge
func ChallengeHandler(c *gin.Context) {
	// Increment challenge counter

	// Récupération de la requête
	var request models.ChallengeRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		log.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Invalid challenge request")

		// Record error

		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Logging des informations de la requête
	requestID := c.GetHeader("X-Request-ID")
	logFields := logrus.Fields{
		"endpoint":     "/challenge",
		"opponent_url": request.OpponentURL,
	}

	if requestID != "" {
		logFields["x_request_id"] = requestID
	}

	log.WithFields(logFields).Info("Challenge request received")

	// Simulation de la latence locale (notre joueur)
	localLatency := rand.Intn(901) + 100
	time.Sleep(time.Duration(localLatency) * time.Millisecond)

	// Préparation de la requête pour l'adversaire
	req, err := http.NewRequest("GET", request.OpponentURL, nil)
	if err != nil {
		log.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Failed to create request for opponent")

		// Record error

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to challenge opponent"})
		return
	}

	// Propagation des en-têtes pour le traçage
	if requestID != "" {
		req.Header.Set("X-Request-ID", requestID)
	}

	// Mesure du temps de la requête adverse
	opponentStartTime := time.Now()
	resp, err := httpClient.Do(req)
	if err != nil {
		log.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Failed to get response from opponent")

		// Record error

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reach opponent"})
		return
	}
	defer resp.Body.Close()

	// Calcul de la latence adverse
	remoteLatency := time.Since(opponentStartTime).Milliseconds()

	// Lecture de la réponse de l'adversaire
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithFields(logrus.Fields{
			"error": err.Error(),
		}).Error("Failed to read opponent response")

		// Record error

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read opponent response"})
		return
	}

	// Décodage de la réponse de l'adversaire
	var opponentResponse models.PingResponse
	if err := json.Unmarshal(body, &opponentResponse); err != nil {
		log.WithFields(logrus.Fields{
			"error": err.Error(),
			"body":  string(body),
		}).Error("Failed to decode opponent response")

		// Record error

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode opponent response"})
		return
	}

	// Vérification si FORCE_LOSS est activé
	forceLoss := os.Getenv("FORCE_LOSS")

	// Détermination du gagnant
	var winner, loser string
	if forceLoss == "true" {
		winner = opponentResponse.Player
		loser = playerName
	} else {
		// Le joueur avec la latence la plus faible gagne
		if localLatency < int(remoteLatency) {
			winner = playerName
			loser = opponentResponse.Player
		} else {
			winner = opponentResponse.Player
			loser = playerName
		}
	}


	// Log structuré du match
	matchLog := models.MatchLog{
		Timestamp:  time.Now().Format(time.RFC3339),
		LocalName:  playerName,
		RemoteName: opponentResponse.Player,
		Winner:     winner,
		LocalTime:  localLatency,
		RemoteTime: int(remoteLatency),
		RemoteIP:   c.ClientIP(),
		RequestID:  requestID,
	}

	matchLogJSON, _ := json.Marshal(matchLog)
	log.WithFields(logrus.Fields{
		"match": string(matchLogJSON),
	}).Info("Match completed")

	// Calculate total duration
	totalDuration := int(localLatency + int(remoteLatency))

	// Record challenge duration

	// Préparation de la réponse
	response := models.ChallengeResponse{
		Winner:     winner,
		Loser:      loser,
		DurationMs: totalDuration,
	}

	c.JSON(http.StatusOK, response)
}

// SwaggerHandler retourne le fichier swagger.json
func SwaggerHandler(c *gin.Context) {
	c.File("./docs/swagger.json")
}
