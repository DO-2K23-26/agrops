FROM golang:1.22-alpine AS builder

WORKDIR /app

# Set GOTOOLCHAIN to ensure toolchain support
ENV GOTOOLCHAIN=auto

# Copie des fichiers go.mod et go.sum
COPY go.mod go.sum ./

# Téléchargement des dépendances
RUN go mod download

# Copie du code source
COPY . .

# Construction de l'application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o player-service .

# Image légère pour le déploiement
FROM alpine:3.16

WORKDIR /app

# Installation des certificats CA pour les requêtes HTTPS
RUN apk --no-cache add ca-certificates

# Copie du binaire depuis l'étape de construction
COPY --from=builder /app/player-service .
COPY --from=builder /app/docs /app/docs

# Variables d'environnement
ENV GIN_MODE=release
ENV PORT=8080

# Port exposé
EXPOSE 8080

# Exécution de l'application
CMD ["./player-service"]
