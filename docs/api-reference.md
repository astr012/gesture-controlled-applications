# API Reference

## REST Endpoints

### Health Check
```
GET /health
```
Returns the health status of the backend service.

**Response:**
```json
{
  "status": "healthy",
  "service": "gesture-control-backend"
}
```

### Root Information
```
GET /
```
Returns basic API information and available endpoints.

**Response:**
```json
{
  "message": "Gesture Control Platform API",
  "version": "1.0.0",
  "websocket_endpoint": "/ws/gestures"
}
```

## WebSocket API

### Connection
```
WS /ws/gestures
```
Establishes a WebSocket connection for real-time gesture data streaming.

### Message Format

#### Client to Server (Project Selection)
```json
{
  "project": "finger_count" | "volume_control" | "virtual_mouse"
}
```

#### Server to Client (Gesture Data)

**Finger Count Project:**
```json
{
  "project": "finger_count",
  "timestamp": 1641234567.89,
  "hands_detected": 1,
  "fingers": 3,
  "total_fingers": 3,
  "hands": [
    {
      "label": "Right",
      "confidence": 0.95,
      "fingers": 3,
      "finger_states": {
        "thumb": true,
        "index": true,
        "middle": true,
        "ring": false,
        "pinky": false
      }
    }
  ]
}
```

**Volume Control Project:**
```json
{
  "project": "volume_control",
  "timestamp": 1641234567.89,
  "hands_detected": 1,
  "volume_level": 0.65,
  "gesture_distance": 0.12,
  "is_controlling": true
}
```

**Virtual Mouse Project:**
```json
{
  "project": "virtual_mouse",
  "timestamp": 1641234567.89,
  "hands_detected": 1,
  "cursor_x": 640,
  "cursor_y": 360,
  "is_clicking": false,
  "gesture_mode": "move"
}
```

#### Error Messages
```json
{
  "error": "Error description",
  "project": "project_name"
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host address |
| `PORT` | `8000` | Server port |
| `DEBUG` | `true` | Enable debug mode |
| `CAMERA_INDEX` | `0` | Camera device index |
| `CAMERA_WIDTH` | `640` | Camera frame width |
| `CAMERA_HEIGHT` | `480` | Camera frame height |
| `CAMERA_FPS` | `30` | Camera frame rate |
| `MEDIAPIPE_CONFIDENCE` | `0.7` | Hand detection confidence |
| `MEDIAPIPE_TRACKING_CONFIDENCE` | `0.5` | Hand tracking confidence |
| `GESTURE_UPDATE_INTERVAL` | `0.033` | Update interval (seconds) |

### CORS Configuration

The backend allows connections from:
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

## Error Codes

### WebSocket Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `Failed to initialize camera` | Camera not accessible | Check permissions and availability |
| `Failed to read camera frame` | Camera read error | Restart application or check camera |
| `Unknown project type: {type}` | Invalid project selection | Use valid project names |
| `Max reconnection attempts reached` | Connection failed | Check backend status and network |

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `404` | Endpoint not found |
| `500` | Internal server error |

## Rate Limits

- WebSocket messages: ~30 FPS (configurable)
- REST endpoints: No specific limits
- Connection limit: 10 concurrent WebSocket connections

## Security Considerations

- CORS is configured for development origins
- No authentication required for development
- Camera access requires user permission
- WebSocket connections are not encrypted (use WSS in production)