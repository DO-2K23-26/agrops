# Player Service

Un microservice HTTP REST en Go qui simule un joueur pour un tournoi dans un environnement Kubernetes avec Istio.

## 📦 Fonctionnalités

- API REST basée sur le framework Gin
- Simulation de latence pour des démonstrations de service mesh
- Documentation OpenAPI (Swagger)
- Optimisé pour le déploiement dans Kubernetes avec Istio
- Logs structurés au format JSON pour intégration avec Grafana/Loki

## 🚀 API

### `GET /ping`

- Simule une latence aléatoire entre 100 et 1000ms
- Retourne les informations du joueur avec la latence simulée

**Exemple de réponse :**
```json
{
  "player": "joueur-a",
  "status": "pong",
  "latencyMs": 123
}
```

### `POST /challenge`

- Défie un autre joueur via son URL
- Mesure les latences des deux joueurs
- Détermine le gagnant (le joueur avec la latence la plus faible)

**Exemple de requête :**
```json
{
  "opponentUrl": "http://joueur-b:8080/ping"
}
```

**Exemple de réponse :**
```json
{
  "winner": "joueur-a",
  "loser": "joueur-b",
  "durationMs": 245
}
```

### `GET /swagger.json`

- Retourne la documentation OpenAPI au format JSON

## ⚙️ Configuration

Le service est configurable via des variables d'environnement :

| Variable     | Description                                         | Obligatoire | Défaut |
|--------------|-----------------------------------------------------|-------------|--------|
| PLAYER_NAME  | Nom du joueur                                       | Oui         | N/A    |
| PORT         | Port d'écoute du serveur                            | Non         | 8080   |
| FORCE_LOSS   | Force le joueur à perdre s'il est défini à "true"   | Non         | false  |
| FAIL_MODE    | Code HTTP à retourner pour simuler des erreurs      | Non         | N/A    |

## 🔧 Installation et Démarrage

### Prérequis

- Go 1.18+ installé
- Docker (pour la conteneurisation)

### Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-repo/player-service.git
cd player-service
```

2. Initialiser le module Go :
```bash
make init
```

3. Compiler le service :
```bash
make build
```

### Exécution

#### En local avec Go :
```bash
export PLAYER_NAME=joueur-a
export PORT=8080
make run
```

#### Avec Docker :
```bash
make docker
make docker-run PLAYER_NAME=joueur-a PORT=8080
```

## 🧪 Tests

Pour exécuter les tests unitaires :
```bash
make test
```

Pour vérifier le code avec le linter :
```bash
make lint
```

## 📝 Exemples d'utilisation

### Ping
```bash
curl http://localhost:8080/ping
```

### Challenge
```bash
curl -X POST http://localhost:8080/challenge \
  -H "Content-Type: application/json" \
  -d '{"opponentUrl": "http://localhost:8081/ping"}'
```

## 🛠️ Utilisation avec Istio

Ce service est conçu pour être utilisé dans un environnement Kubernetes avec Istio comme service mesh. Voici quelques-unes des fonctionnalités qui sont particulièrement utiles avec Istio :

- Propagation des headers pour le traçage distribué (`X-Request-ID`)
- Simulation de latence pour tester les timeouts et les retries
- Logs structurés pour la visualisation dans Kiali/Grafana
- Possibilité de simuler des échecs via `FAIL_MODE`

## 📦 Structure du projet

```
player-service/
├── main.go             # Point d'entrée de l'application
├── routes/
│   └── handlers.go     # Gestionnaires des routes HTTP
├── models/
│   └── models.go       # Modèles de données
├── docs/
│   └── swagger.json    # Documentation OpenAPI
├── Dockerfile          # Configuration Docker
├── Makefile            # Commandes Make
└── README.md           # Documentation
```
