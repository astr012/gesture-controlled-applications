# Gesture Control Platform - Backend

Enterprise-grade backend for the Gesture Control Platform with a pipeline-based architecture.

## 🏗️ Architecture

```
backend/
├── core/                    # Core infrastructure
│   ├── config.py            # Pydantic settings
│   ├── types.py             # Shared data types
│   ├── exceptions.py        # Custom exceptions
│   ├── logging_config.py    # Structured logging
│   └── dependencies.py      # Dependency injection
│
├── pipelines/               # Processing pipeline stages
│   ├── ingestion/           # Camera capture
│   ├── preprocessing/       # Frame normalization
│   ├── extraction/          # MediaPipe landmarks
│   ├── inference/           # Gesture classification
│   ├── output/              # Event dispatch
│   └── orchestrator.py      # Pipeline coordinator
│
├── features/                # Self-contained features
│   ├── finger_count/        # Finger counting + poses
│   ├── volume_control/      # Pinch volume control
│   ├── virtual_mouse/       # Air mouse control
│   ├── sign_language/       # ASL recognition (planned)
│   └── presentation/        # Slide control (planned)
│
├── api/                     # REST & WebSocket API
│   ├── gateway.py           # FastAPI app factory
│   ├── rest/                # REST endpoints
│   └── websocket/           # WebSocket hub
│
├── projects/                # Project registry
│   └── registry.py
│
├── .venv/                   # Virtual environment
├── main.py                  # Application entry point
└── requirements.txt         # Dependencies
```

## 🚀 Quick Start

### 1. Setup Environment

```powershell
# Create virtual environment with uv
python -m uv venv .venv

# Install dependencies
python -m uv pip install -r requirements.txt --python .venv\Scripts\python.exe
```

### 2. Run Development Server

```powershell
# Activate venv
.venv\Scripts\activate

# Run server
python main.py
```

The server starts at `http://localhost:8000`

### 3. Verify

- API Docs: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/api/v1/health

## 📋 Features

Each feature is self-contained in its own folder:

| Feature          | Status | Description                      |
| ---------------- | ------ | -------------------------------- |
| `finger_count`   | ✅     | Finger counting + pose detection |
| `volume_control` | ✅     | Pinch-to-control volume          |
| `virtual_mouse`  | ✅     | Air mouse with smoothing         |
| `sign_language`  | 🔜     | ASL alphabet recognition         |
| `presentation`   | 🔜     | Slideshow control                |

### Using a Feature

```python
from features.finger_count import FingerCountFeature

# Get metadata
print(FingerCountFeature.NAME)  # "Smart Finger Counter"

# Get classifier and actions
classifier = FingerCountFeature.get_classifier()
actions = FingerCountFeature.get_actions()

# Process
result = classifier.classify(extraction_result)
await actions.execute(result)
```

## 🔌 API Endpoints

### REST

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/v1/health`              | Health check        |
| GET    | `/api/v1/projects`            | List projects       |
| GET    | `/api/v1/projects/{id}`       | Get project details |
| POST   | `/api/v1/projects/{id}/start` | Start project       |
| POST   | `/api/v1/projects/{id}/stop`  | Stop project        |

### WebSocket

| Endpoint       | Description                   |
| -------------- | ----------------------------- |
| `/ws/gestures` | Real-time gesture data stream |
| `/ws/control`  | Project control commands      |

## ⚙️ Configuration

Configure via `.env` file:

```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true
LOG_LEVEL=INFO

# Camera
CAMERA_INDEX=0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30

# MediaPipe
MEDIAPIPE_MAX_HANDS=2
MEDIAPIPE_MIN_CONFIDENCE=0.7
```

## 🧪 Development

```powershell
# Run tests
pytest tests/ -v

# Type checking
mypy .

# Linting
ruff check .
```

## 📚 Documentation

See `docs/architecture/01-BACKEND-ARCHITECTURE.md` for detailed architecture documentation.
