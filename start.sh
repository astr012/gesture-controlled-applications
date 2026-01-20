#!/bin/bash

echo "Starting Gesture Control Platform..."
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists uv; then
    echo "❌ UV not found. Please install UV first."
    echo "Visit: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

if ! command_exists bun; then
    echo "❌ Bun not found. Please install Bun first."
    echo "Visit: https://bun.sh/docs/installation"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo

# Start backend
echo "[1/3] Starting Backend Server..."
cd backend
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
fi

echo "Starting backend in background..."
uv run python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Start frontend
echo "[2/3] Starting Frontend Development Server..."
cd frontend
echo "Starting frontend in background..."
bun dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "Waiting for frontend to initialize..."
sleep 5

echo "[3/3] Opening Application..."
if command_exists xdg-open; then
    xdg-open http://localhost:5173
elif command_exists open; then
    open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo
echo "✅ Gesture Control Platform is running!"
echo
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop all services..."

# Wait for interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait