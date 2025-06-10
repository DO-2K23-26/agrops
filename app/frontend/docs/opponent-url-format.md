# Opponent URL Format in Istio Mesh

## Changes Made

We've updated the frontend to send opponent URLs in a format that works directly within the Kubernetes Istio mesh environment.

### Before
Previously, the frontend was using a URL format that went through the API gateway:
```javascript
opponentUrl: `${window.location.protocol}//${window.location.host}/api/${opponent}/ping`
```

### After
Now, the frontend uses direct Kubernetes service URLs:
```javascript
opponentUrl: `http://${opponent}:8080/ping`
```

## Benefits

1. **Simpler routing** - Uses direct service-to-service communication within the mesh
2. **Lower latency** - Avoids extra network hops through the gateway
3. **Better visibility** - Creates clearer service-to-service dependencies in Istio's service mesh visualization

## Implementation Details

- Player information is now stored in a central `playerConfigs` structure 
- Each player has three key properties:
  - `name`: The player's identifier
  - `url`: The API URL for the player
  - `challengeUrl`: The direct Kubernetes service URL for challenges
- Challenge URLs use the format `http://${playerName}:8080/ping`
- The frontend is simplified by removing circuit breaker logic
- The MatchModal component displays the challenge URL for better debugging
- The RateLimitDebug component provides a dedicated tab for testing service URLs

## Testing

You can verify this works by:
1. Checking the network tab in your browser during a challenge
2. Looking at the request payload sent to the challenger's `/challenge` endpoint
3. Verifying the `opponentUrl` property contains the direct service URL

## Troubleshooting

If challenges don't work:
1. Ensure the Kubernetes Services have the correct names matching the player names
2. Verify port 8080 is exposed on the player services
3. Check that the Istio mesh allows service-to-service communication

## Testing with curl

You can test the challenge functionality directly using curl:

```bash
# Challenge from doriano to theos
curl -X POST http://localhost:8080/api/doriano/challenge \
  -H "Content-Type: application/json" \
  -d '{"opponentUrl": "http://theos:8080/ping"}'

# Expected response
{
  "winner": "doriano",
  "loser": "theos",
  "durationMs": 245
}
```

## Code Simplification

We've also simplified the frontend code by:

1. **Removing circuit breaker logic** - Simplified error handling by removing the circuit breaker pattern
2. **Centralizing player configuration** - Created a single source of truth for player information
3. **Using a consistent structure** - Each player now has a consistent set of properties:
   - `name`: The player's unique identifier
   - `url`: The API URL for accessing the player
   - `challengeUrl`: The direct Kubernetes service URL for challenges
4. **Improved component structure** - Updated UI components to use the new player configuration

This makes the code more maintainable and easier to understand for future developers.
