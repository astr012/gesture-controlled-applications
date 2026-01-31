---
description: Start the development servers for both backend and frontend
---

# Start Development Servers

This workflow starts both the backend (FastAPI) and frontend (Vite) development servers.

## Prerequisites

- Backend virtual environment set up with `uv`
- Frontend dependencies installed with `bun`

## Steps

### Backend (Terminal 1)

// turbo

1. Activate the virtual environment and start the backend:

```shell
cd backend
.venv\Scripts\activate
python main.py
```

The backend will start at `http://localhost:8000`

### Frontend (Terminal 2)

// turbo 2. Start the frontend development server:

```shell
cd frontend
bun run dev
```

The frontend will start at `http://localhost:5173`

## Verification

- Backend API docs: http://localhost:8000/api/docs
- Backend health: http://localhost:8000/api/v1/health
- Frontend: http://localhost:5173

## Environment Variables

Backend `.env` file (optional):

```
HOST=0.0.0.0
PORT=8000
DEBUG=true
LOG_LEVEL=INFO
CAMERA_INDEX=0
```
