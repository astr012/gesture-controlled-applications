# Gesture Control Platform - Frontend

React TypeScript SPA for real-time gesture visualization and control.

## Setup

### Prerequisites
- Bun package manager
- Node.js 18+

### Installation
```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Features

- Real-time gesture visualization
- WebSocket connection to Python backend
- Modular project switching (finger counting, volume control, virtual mouse)
- Responsive design with CSS Modules
- TypeScript for type safety

## Architecture

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── GestureDisplay/  # Gesture visualization
│   │   ├── ProjectSelector/ # Project switching
│   │   └── ConnectionStatus/ # WebSocket status
│   ├── hooks/              # Custom React hooks
│   │   ├── useWebSocket.ts # WebSocket management
│   │   └── useGesture.ts   # Gesture data handling
│   ├── types/              # TypeScript type definitions
│   │   └── gesture.ts      # Gesture data types
│   ├── utils/              # Utility functions
│   │   └── websocket.ts    # WebSocket utilities
│   └── styles/             # Global styles and CSS modules
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## Development

- Hot reload enabled via Vite
- ESLint + Prettier for code formatting
- TypeScript strict mode enabled
- CSS Modules for component styling

## WebSocket API

Connects to backend at `ws://localhost:8000/ws/gestures`

### Message Format
```typescript
// Outgoing (to backend)
{
  project: "finger_count" | "volume_control" | "virtual_mouse"
}

// Incoming (from backend)
{
  project: string;
  timestamp: number;
  hands_detected: number;
  // Project-specific data...
}
```