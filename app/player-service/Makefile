.PHONY: build run test lint clean docker docker-run docker-compose-up docker-compose-down test-players tournament

# Variables
APP_NAME = player-service
DOCKER_IMAGE = $(APP_NAME):latest
PORT ?= 8080
PLAYER_NAME ?= player-a

# Compilation du service
build:
	go build -o $(APP_NAME) .

# Exécution du service en local
run:
	PLAYER_NAME=$(PLAYER_NAME) PORT=$(PORT) go run main.go

# Tests unitaires
test:
	go test ./... -v

# Lint avec golangci-lint (à installer séparément)
lint:
	golangci-lint run

# Nettoyage des artefacts
clean:
	rm -f $(APP_NAME)
	go clean

# Construction de l'image Docker
docker:
	docker build -t $(DOCKER_IMAGE) .

# Exécution de l'image Docker
docker-run:
	docker run -p $(PORT):8080 \
		-e PLAYER_NAME=$(PLAYER_NAME) \
		-e PORT=8080 \
		$(DOCKER_IMAGE)

# Initialisation du module Go
init:
	go mod init github.com/hugo/player-service
	go mod tidy

# Aide
help:
	@echo "Commandes disponibles:"
	@echo "  make build      - Compile le service"
	@echo "  make run        - Exécute le service localement"
	@echo "  make test       - Exécute les tests unitaires"
	@echo "  make lint       - Exécute le linter"
	@echo "  make clean      - Nettoie les artefacts de build"
	@echo "  make docker     - Construit l'image Docker"
	@echo "  make docker-run - Exécute l'image Docker"
	@echo "  make init       - Initialise le module Go"
	@echo "  make docker-compose-up   - Démarrer les services avec docker-compose"
	@echo "  make docker-compose-down - Arrêter les services docker-compose"
	@echo "  make test-players        - Tester les deux joueurs avec le script"
	@echo "  make tournament          - Lancer un tournoi entre les deux joueurs"
	@echo ""
	@echo "Variables:"
	@echo "  PORT         - Port d'écoute (défaut: 8080)"
	@echo "  PLAYER_NAME  - Nom du joueur (défaut: player-a)"

# Démarrer les services avec docker-compose
docker-compose-up:
	docker compose up -d --build

# Arrêter les services docker-compose
docker-compose-down:
	docker compose down

# Tester les deux joueurs
test-players:
	chmod +x scripts/test-players.sh
	./scripts/test-players.sh

# Lancer un tournoi entre les joueurs
tournament:
	chmod +x scripts/tournament.sh
	./scripts/tournament.sh
