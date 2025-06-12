# Player Service Ping Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant P as Player Service
    
    C->>P: GET /ping
    Note right of P: Simulates random latency<br/>(100-1000ms)
    P->>P: Generate latency (random)
    Note over P: Checks for fail mode
    P-->>C: 200 OK with PingResponse<br/>{player, status, latencyMs}
    Note left of C: Response includes:<br/>- Player name<br/>- Status ("pong")<br/>- Latency in ms
```

## Ping Response Format

```json
{
  "player": "playerName",
  "status": "pong",
  "latencyMs": 123
}
```

## Implementation Details

The ping endpoint:
- Simulates a random latency between 100-1000ms
- Can be configured to return error codes for testing using the `FAIL_MODE` environment variable
- Returns the player name, status, and latency information
- Used by the challenge endpoint to test responsiveness of other players
