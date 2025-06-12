# Player Service Challenge Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant P1 as Player 1 (Challenger)
    participant P2 as Player 2 (Opponent)
    
    C->>P1: POST /challenge<br/>{opponentUrl}
    activate P1
    Note right of P1: Local processing time
    P1->>P1: Add local latency (1001ms)
    
    P1->>P2: GET /ping
    activate P2
    Note right of P2: Opponent processes ping
    P2->>P2: Generate latency (random)
    P2-->>P1: 200 OK PingResponse<br/>{player, status, latencyMs}
    deactivate P2
    
    Note over P1: Determine winner<br/>(based on lowest latency)
    
    alt FORCE_LOSS environment variable is "true"
        P1->>P1: Force loss (opponent wins)
    else Normal comparison
        P1->>P1: Compare local vs remote latency
    end
    
    P1-->>C: 200 OK ChallengeResponse<br/>{winner, loser, durationMs}
    deactivate P1
    
    Note left of C: Response includes:<br/>- Winner name<br/>- Loser name<br/>- Total duration in ms
```

## Challenge Request Format

```json
{
  "opponentUrl": "http://opponent-service/ping"
}
```

## Challenge Response Format

```json
{
  "winner": "winnerPlayerName",
  "loser": "loserPlayerName",
  "durationMs": 2500
}
```

## Implementation Details

The challenge endpoint:
- Accepts a POST request with the opponent's ping URL
- Applies a fixed local latency of 1001ms to the challenger
- Makes a GET request to the opponent's ping endpoint
- Measures the opponent's response time
- Determines the winner based on the player with the lowest latency
- Can be configured to always lose by setting the `FORCE_LOSS` environment variable to "true"
- Returns the winner, loser, and total duration of the challenge

This is used in the tournament to determine which player responds faster.
