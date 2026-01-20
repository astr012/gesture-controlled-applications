# Gesture Control Platform - Setup Guide

Complete setup instructions for the Gesture Control Platform development environment.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **Python**: 3.10 or higher
- **Node.js**: 18 or higher
- **Camera**: Webcam or built-in camera

### Required Tools
- **UV**: Python package manager and virtual environment tool
- **Bun**: Fast JavaScript package manager
- **Git**: Version control

## Installation Steps

### 1. Install UV (Python Package Manager)

**Windows (PowerShell):**
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Install Bun (JavaScript Package Manager)

**Windows (PowerShell):**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

### 3. Clone and Setup Project

```bash
git clone <repository-url>
cd gesture-control-platform
```

### 4. Backend Setup

```bash
cd backend

# Create virtual environment
uv venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
```

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
uv run python main.py
```
Backend will be available at: http://localhost:8000

### Start Frontend (Terminal 2)
```bash
cd frontend
bun dev
```
Frontend will be available at: http://localhost:5173

## Verification

1. **Backend Health Check**: Visit http://localhost:8000/health
2. **Frontend Access**: Visit http://localhost:5173
3. **Camera Permission**: Allow camera access when prompted
4. **WebSocket Connection**: Check connection status in the UI

## Troubleshooting

### Common Issues

**Camera not detected:**
- Ensure camera permissions are granted
- Check if another application is using the camera
- Verify camera index in backend/.env file

**WebSocket connection failed:**
- Ensure backend is running on port 8000
- Check firewall settings
- Verify CORS configuration in backend

**Python dependencies fail:**
- Ensure Python 3.10+ is installed
- Try: `uv pip install --upgrade pip`
- Check system-specific requirements (e.g., Visual Studio Build Tools on Windows)

**Frontend build errors:**
- Clear node_modules: `rm -rf node_modules && bun install`
- Check Node.js version: `node --version`
- Ensure Bun is properly installed

### Performance Optimization

**For better performance:**
- Close unnecessary applications
- Ensure good lighting for camera
- Use a dedicated GPU if available
- Adjust camera resolution in backend config

## Development Workflow

1. **Backend Development**: Use `uv run uvicorn main:app --reload` for auto-reload
2. **Frontend Development**: Vite provides hot module replacement
3. **Testing**: Run gesture detection with different hand positions
4. **Debugging**: Check browser console and backend logs

## Next Steps

- Explore the finger counting project
- Try volume control gestures
- Experiment with virtual mouse control
- Review code structure for customization

For detailed API documentation, see `docs/api-reference.md`