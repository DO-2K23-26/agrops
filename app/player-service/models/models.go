package models

// PingResponse représente la réponse d'un joueur à une requête ping
type PingResponse struct {
	Player    string `json:"player"`
	Status    string `json:"status"`
	LatencyMs int    `json:"latencyMs"`
}

// ChallengeRequest représente une demande de challenge pour un autre joueur
type ChallengeRequest struct {
	OpponentURL string `json:"opponentUrl" binding:"required"`
}

// ChallengeResponse représente le résultat d'un challenge entre deux joueurs
type ChallengeResponse struct {
	Winner     string `json:"winner"`
	Loser      string `json:"loser"`
	DurationMs int    `json:"durationMs"`
}

// MatchLog représente les informations de log pour un match
type MatchLog struct {
	Timestamp  string `json:"timestamp"`
	LocalName  string `json:"localName"`
	RemoteName string `json:"remoteName"`
	Winner     string `json:"winner"`
	LocalTime  int    `json:"localTime"`
	RemoteTime int    `json:"remoteTime"`
	RemoteIP   string `json:"remoteIp"`
	RequestID  string `json:"requestId,omitempty"`
	TraceID    string `json:"traceId,omitempty"`
}
