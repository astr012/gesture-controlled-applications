# Gesture Control Platform (GCP)

A modular, extensible Single Page Application that demonstrates multiple gesture-based machine learning projects with real-time computer vision capabilities.

## 🎯 Overview

Professional gesture control application built with Python FastAPI backend and React TypeScript frontend. This portfolio-ready project showcases real-time computer vision, machine learning, and modern web development practices.

## ✨ Features

- **Real-time Hand Tracking**: MediaPipe-powered gesture detection
- **Modular Projects**: Finger counting, volume control, virtual mouse
- **WebSocket Communication**: Low-latency streaming (<100ms)
- **Professional Architecture**: Separation of concerns, type safety
- **Modern Tech Stack**: FastAPI, React 19, TypeScript, UV, Bun

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ with UV package manager
- Node.js 18+ with Bun package manager  
- Webcam/camera access

### Windows
```bash
start.bat
```

### macOS/Linux
```bash
chmod +x start.sh && ./start.sh
```

### Manual Setup
```bash
# Backend
cd backend && uv venv && uv pip install -r requirements.txt && uv run python main.py

# Frontend (new terminal)
cd frontend && bun install && bun dev
```

**Access**: Frontend at http://localhost:5173, Backend at http://localhost:8000

## 🏗️ Architecture

```
gesture-control-platform/
├── backend/           # Python FastAPI + MediaPipe
├── frontend/          # React SPA + TypeScript
├── docs/             # Documentation
└── .kiro/            # Development guidelines
```

- **Backend**: FastAPI with MediaPipe for gesture detection
- **Frontend**: React SPA with real-time WebSocket communication
- **Package Managers**: UV (Python), Bun (JavaScript)

## 🎮 Usage

1. Start the application using quick start commands
2. Allow camera access when prompted
3. Select "Finger Counting" project
4. Show your hand to camera and count fingers
5. Monitor connection status in header

## 🔧 Development

### Current Status (Phase 1 - Complete)
- ✅ Backend camera + MediaPipe integration
- ✅ WebSocket streaming infrastructure  
- ✅ React SPA with TypeScript
- ✅ Basic finger counting project

### Next Steps (Phase 2)
- Volume control with gesture distance
- Virtual mouse cursor control
- Cross-platform compatibility testing

## 📚 Tech Stack

**Backend**: FastAPI, MediaPipe, OpenCV, WebSockets, UV
**Frontend**: React 19, TypeScript, Vite, CSS Modules, Bun
**Development**: Professional standards, modular architecture, comprehensive docs

## 📖 Documentation

- `PROJECT_SUMMARY.md` - Complete project overview
- `docs/setup-guide.md` - Detailed setup instructions  
- `docs/api-reference.md` - API documentation
- `.kiro/steering/` - Development guidelines

## 🎯 Learning Outcomes

Demonstrates mastery of computer vision, ML integration, real-time systems, modern web development, and professional software practices.

---

**Ready for development!** The foundation is complete and structured for easy extension with new gesture projects.