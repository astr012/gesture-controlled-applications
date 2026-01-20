# Development Workflow & Guidelines

> **Document**: 07-DEVELOPMENT-WORKFLOW.md  
> **Version**: 2.0.0  
> **Scope**: Development practices, contribution guidelines, testing, and deployment

---

## Overview

This document establishes the development practices, coding standards, and workflow guidelines for contributing to the Gesture Control Platform. Following these guidelines ensures code consistency, maintainability, and quality across the codebase.

---

## Development Environment Setup

### Prerequisites

| Tool    | Version | Purpose                              |
| ------- | ------- | ------------------------------------ |
| Python  | 3.10+   | Backend runtime                      |
| Node.js | 18+     | Frontend build tools                 |
| UV      | Latest  | Python package manager               |
| Bun     | Latest  | JavaScript runtime & package manager |
| Git     | 2.30+   | Version control                      |

### Initial Setup

```powershell
# Clone repository
git clone https://github.com/your-org/gesture-controlled-applications.git
cd gesture-controlled-applications

# Backend setup
cd backend
uv venv
uv pip install -r requirements.txt
uv pip install -r requirements-dev.txt  # Development dependencies

# Frontend setup
cd ../frontend
bun install

# Start development servers
# Terminal 1: Backend
cd backend && uv run python main.py

# Terminal 2: Frontend
cd frontend && bun dev
```

### IDE Configuration

#### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  },
  "python.analysis.typeCheckingMode": "basic",
  "typescript.preferences.importModuleSpecifier": "relative",
  "css.validate": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  }
}
```

#### Recommended Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-python.python",
    "charliermarsh.ruff",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "csstools.postcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## Git Workflow

### Branch Strategy

```
main
├── develop                    # Integration branch
│   ├── feature/finger-count   # Feature branches
│   ├── feature/volume-control
│   ├── fix/websocket-reconnect
│   └── refactor/pipeline-architecture
└── release/v2.0.0            # Release branches
```

### Branch Naming Convention

| Type     | Pattern                       | Example                     |
| -------- | ----------------------------- | --------------------------- |
| Feature  | `feature/<short-description>` | `feature/volume-gesture`    |
| Bug Fix  | `fix/<issue-description>`     | `fix/camera-init-crash`     |
| Refactor | `refactor/<scope>`            | `refactor/pipeline-stages`  |
| Docs     | `docs/<topic>`                | `docs/api-reference`        |
| Chore    | `chore/<task>`                | `chore/update-dependencies` |

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring, no behavior change
- `perf`: Performance improvement
- `test`: Adding or fixing tests
- `chore`: Maintenance tasks

**Examples:**

```bash
# Feature
feat(inference): add volume gesture classifier

# Bug fix
fix(websocket): handle reconnection timeout

# Refactor
refactor(pipeline): split extraction into separate modules

# Documentation
docs(api): add volume control endpoint documentation
```

### Pull Request Process

1. **Create Branch**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Develop & Commit**

   ```bash
   # Make changes
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push & Create PR**

   ```bash
   git push origin feature/my-feature
   # Create PR via GitHub/GitLab UI
   ```

4. **PR Checklist**
   - [ ] Tests pass locally
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] PR description explains changes
   - [ ] Linked to issue (if applicable)

---

## Code Standards

### Python (Backend)

#### Style Guide

Follow [PEP 8](https://peps.python.org/pep-0008/) with these additions:

```python
# Line length: 100 characters
# Use type hints for all public functions

# Good
async def process_gesture(
    extraction: ExtractionResult,
    config: ProcessingConfig
) -> InferenceResult:
    """
    Process extracted landmarks into gesture classification.

    Args:
        extraction: Hand landmarks from extraction pipeline
        config: Processing configuration

    Returns:
        Classified gesture with confidence score

    Raises:
        InferenceError: If classification fails
    """
    ...

# Imports order: stdlib, third-party, local
import asyncio
from typing import Dict, List, Optional

import numpy as np
from fastapi import WebSocket

from core.config import settings
from pipelines.extraction import ExtractionResult
```

#### Docstring Format (Google Style)

```python
def calculate_pinch_distance(
    thumb: Landmark,
    index: Landmark
) -> float:
    """
    Calculate Euclidean distance between thumb and index fingertips.

    This is used for pinch gesture detection in volume control
    and mouse click detection.

    Args:
        thumb: Thumb tip landmark (index 4)
        index: Index fingertip landmark (index 8)

    Returns:
        Distance value normalized to [0, 1] range relative to frame size.
        Values below 0.05 typically indicate a pinch gesture.

    Example:
        >>> thumb = Landmark(x=0.5, y=0.5, z=0)
        >>> index = Landmark(x=0.52, y=0.5, z=0)
        >>> distance = calculate_pinch_distance(thumb, index)
        >>> distance < 0.05  # True = pinch detected
        True
    """
    return np.sqrt(
        (thumb.x - index.x)**2 +
        (thumb.y - index.y)**2 +
        (thumb.z - index.z)**2
    )
```

#### Ruff Configuration

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # Pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # Line too long (handled by formatter)
]

[tool.ruff.lint.isort]
known-first-party = ["core", "pipelines", "projects", "api", "services"]
```

### TypeScript (Frontend)

#### Style Guide

```typescript
// Use explicit types (avoid `any`)
// Use functional components with TypeScript

// Good - Explicit interface
interface GestureCanvasProps {
  gestureData: GestureData | null;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

// Good - Functional component with props destructuring
const GestureCanvas: React.FC<GestureCanvasProps> = ({
  gestureData,
  isRunning,
  onStart,
  onStop,
}) => {
  // Component implementation
};

// Named exports for components
export { GestureCanvas };

// Default export for pages
export default DashboardPage;
```

#### ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // TypeScript
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],

      // React
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
    },
  },
];
```

### CSS (Styling)

#### CSS Module Naming

```css
/* Component-specific styles: ComponentName.module.css */

/* BEM-inspired naming within modules */
.container {
}
.header {
}
.header--compact {
} /* Modifier */
.headerTitle {
} /* Camel case for compound names */

/* Use design tokens, never hardcode */
.container {
  /* ✅ Good */
  padding: var(--spacing-md);
  background: var(--color-card-background);
  border-radius: var(--radius-lg);

  /* ❌ Bad */
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
}
```

---

## Testing Strategy

### Backend Testing

#### Unit Tests

```python
# tests/unit/pipelines/inference/test_finger_count.py

import pytest
from pipelines.inference.classifiers.finger_count import FingerCountClassifier
from pipelines.extraction.hand_tracker import ExtractionResult, HandLandmarks, Landmark


class TestFingerCountClassifier:
    """Unit tests for finger counting classifier."""

    @pytest.fixture
    def classifier(self) -> FingerCountClassifier:
        return FingerCountClassifier()

    @pytest.fixture
    def mock_hand_open(self) -> HandLandmarks:
        """Create hand with all fingers extended."""
        landmarks = create_open_hand_landmarks()
        return HandLandmarks(
            hand_label="Right",
            landmarks=landmarks,
            confidence=0.95
        )

    def test_count_five_fingers_open_hand(
        self,
        classifier: FingerCountClassifier,
        mock_hand_open: HandLandmarks
    ):
        """Test counting when all fingers are extended."""
        extraction = ExtractionResult(
            hands=[mock_hand_open],
            extraction_latency_ms=10,
            model_confidence=0.95,
            frame_timestamp=0
        )

        result = classifier.classify(extraction)

        assert result.finger_count == 5
        assert result.confidence > 0.9
        assert result.raw_output["hands"][0]["finger_states"]["index"] is True

    def test_handles_empty_extraction(self, classifier: FingerCountClassifier):
        """Test graceful handling of no detected hands."""
        extraction = ExtractionResult(
            hands=[],
            extraction_latency_ms=5,
            model_confidence=0.95,
            frame_timestamp=0
        )

        result = classifier.classify(extraction)

        assert result.finger_count == 0
        assert result.raw_output["hands"] == []
```

#### Integration Tests

```python
# tests/integration/test_pipeline_flow.py

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

@pytest.mark.asyncio
class TestPipelineIntegration:
    """Integration tests for complete pipeline flow."""

    async def test_full_pipeline_processes_frame(self):
        """Test that a frame flows through all pipeline stages."""
        from pipelines.orchestrator import PipelineOrchestrator
        from tests.fixtures import create_mock_frame

        # Setup
        orchestrator = create_test_orchestrator()
        mock_frame = create_mock_frame()

        # Execute
        events = []
        orchestrator.output.dispatcher.add_listener(
            "gesture_detected",
            lambda e: events.append(e)
        )

        await orchestrator.process_single_frame(mock_frame)

        # Verify
        assert len(events) == 1
        assert events[0].project == "finger_count"
        assert "fingers" in events[0].data
```

#### Running Tests

```bash
# Run all tests
cd backend
pytest

# Run with coverage
pytest --cov=pipelines --cov=projects --cov-report=html

# Run specific test file
pytest tests/unit/pipelines/inference/test_finger_count.py

# Run tests matching pattern
pytest -k "finger"

# Run with verbose output
pytest -v
```

### Frontend Testing

#### Component Tests

```typescript
// src/__tests__/components/VolumeBar.test.tsx

import { render, screen } from '@testing-library/react';
import VolumeBar from '@/features/volume-control/components/VolumeBar';

describe('VolumeBar', () => {
  it('displays volume percentage correctly', () => {
    render(
      <VolumeBar
        volume={0.72}
        isMuted={false}
        isActive={false}
      />
    );

    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('shows muted state correctly', () => {
    render(
      <VolumeBar
        volume={0.72}
        isMuted={true}
        isActive={false}
      />
    );

    expect(screen.getByText('Muted')).toBeInTheDocument();
  });

  it('shows active indicator when controlling', () => {
    render(
      <VolumeBar
        volume={0.72}
        isMuted={false}
        isActive={true}
      />
    );

    expect(screen.getByText('Controlling')).toBeInTheDocument();
  });
});
```

#### Integration Tests

```typescript
// src/__tests__/integration/GestureFlow.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { createMockWebSocket } from '../mocks/websocket';
import App from '@/App';

describe('Gesture Flow Integration', () => {
  let mockWs: ReturnType<typeof createMockWebSocket>;

  beforeEach(() => {
    mockWs = createMockWebSocket();
  });

  afterEach(() => {
    mockWs.close();
  });

  it('updates display when gesture data is received', async () => {
    render(<App />);

    // Navigate to finger count project
    // ... navigation logic

    // Simulate receiving gesture data
    mockWs.emit('message', JSON.stringify({
      type: 'gesture_data',
      project: 'finger_count',
      payload: {
        finger_count: 5,
        hands_detected: 1,
      },
    }));

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});
```

#### Running Tests

```bash
# Run all tests
cd frontend
bun test

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch

# Run specific test file
bun test src/__tests__/components/VolumeBar.test.tsx
```

### Test Coverage Requirements

| Area              | Minimum Coverage |
| ----------------- | ---------------- |
| Pipeline Stages   | 80%              |
| Classifiers       | 90%              |
| API Endpoints     | 75%              |
| React Components  | 70%              |
| Utility Functions | 85%              |

---

## Debugging Guidelines

### Backend Debugging

#### Logging Configuration

```python
# core/logging.py

import logging
import sys
from typing import Optional

def configure_logging(
    level: str = "INFO",
    format_style: str = "structured"
) -> None:
    """Configure application logging."""

    if format_style == "structured":
        log_format = (
            "%(asctime)s | %(levelname)-8s | "
            "%(name)s:%(funcName)s:%(lineno)d | %(message)s"
        )
    else:
        log_format = "%(levelname)s: %(message)s"

    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ]
    )

    # Reduce noise from third-party libraries
    logging.getLogger("mediapipe").setLevel(logging.WARNING)
    logging.getLogger("cv2").setLevel(logging.WARNING)
```

#### Debug Endpoints

```python
# api/rest/debug.py (only enabled in development)

from fastapi import APIRouter, Depends
from core.config import settings

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/pipeline/metrics")
async def get_pipeline_metrics():
    """Get current pipeline performance metrics."""
    from pipelines.orchestrator import PipelineOrchestrator

    orch = PipelineOrchestrator.get_instance()
    return orch.get_metrics()


@router.get("/websocket/connections")
async def get_websocket_connections():
    """List active WebSocket connections."""
    from api.websocket.hub import WebSocketHub

    hub = WebSocketHub.get_instance()
    return hub.get_stats()


@router.post("/test/gesture")
async def send_test_gesture(gesture_type: str = "finger_count"):
    """Send a test gesture event (for debugging)."""
    from api.websocket.hub import WebSocketHub

    hub = WebSocketHub.get_instance()
    await hub.broadcast_all({
        "type": "gesture_data",
        "project": gesture_type,
        "payload": {
            "test": True,
            "fingers": 5,
        },
    })
    return {"status": "sent"}
```

### Frontend Debugging

#### Debug Panel Component

```tsx
// components/debug/DebugPanel.tsx

import React from "react";
import { useAppStore } from "@/state/stores/appStore";
import { useProjectStore } from "@/state/stores/projectStore";

const DebugPanel: React.FC = () => {
  const appState = useAppStore();
  const projectState = useProjectStore();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className={styles.panel}>
      <h4>Debug Info</h4>

      <section>
        <h5>Connection</h5>
        <pre>{JSON.stringify(appState.connection, null, 2)}</pre>
      </section>

      <section>
        <h5>Project State</h5>
        <pre>
          {JSON.stringify(
            {
              active: projectState.activeProject,
              running: projectState.isRunning,
              fps: projectState.fps,
              latency: projectState.processingLatency,
            },
            null,
            2,
          )}
        </pre>
      </section>

      <section>
        <h5>Last Gesture</h5>
        <pre>{JSON.stringify(projectState.currentGesture, null, 2)}</pre>
      </section>
    </div>
  );
};

export default DebugPanel;
```

---

## Performance Optimization

### Backend Optimization Checklist

- [ ] **Profiling**: Use cProfile or py-spy to identify bottlenecks
- [ ] **Async Operations**: Ensure all I/O is non-blocking
- [ ] **Memory**: Pre-allocate buffers, avoid repeated allocations
- [ ] **Frame Rate**: Maintain target FPS without frame drops
- [ ] **Model Loading**: Load ML models once at startup

```python
# Profiling example
import cProfile
import pstats

def profile_pipeline():
    """Profile a pipeline run."""
    profiler = cProfile.Profile()
    profiler.enable()

    # Run pipeline code
    run_pipeline_iteration()

    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # Top 20 functions
```

### Frontend Optimization Checklist

- [ ] **Bundle Size**: Keep under 300KB gzipped
- [ ] **Code Splitting**: Lazy load project modules
- [ ] **Memoization**: Use React.memo for expensive components
- [ ] **Re-renders**: Minimize with proper state structure
- [ ] **Animations**: Use CSS transforms, avoid layout triggers

```typescript
// Memoization example
const ExpensiveVisualization = React.memo<VisualizationProps>(
  ({ landmarks, dimensions }) => {
    // Expensive canvas rendering
    return <canvas ref={canvasRef} />;
  },
  (prevProps, nextProps) => {
    // Custom comparison for landmarks array
    return (
      prevProps.landmarks === nextProps.landmarks &&
      prevProps.dimensions.width === nextProps.dimensions.width
    );
  }
);
```

---

## Documentation Standards

### Code Documentation

Every module should include:

1. **Module docstring** explaining purpose
2. **Public function docstrings** (Google style)
3. **Type hints** for all public APIs
4. **Examples** for complex functions

### Markdown Documentation

````markdown
# Document Title

> **Status**: Draft | Review | Approved
> **Last Updated**: YYYY-MM-DD
> **Author**: Name

## Overview

Brief description of what this document covers.

## Section

Content organized with clear hierarchy.

### Subsection

More detailed content.

## Examples

```code
Practical examples with comments
```
````

## Related Documents

- [Other Document](./other-document.md)

````

---

## Deployment Guidelines

### Development

```bash
# Backend with auto-reload
cd backend
uv run python main.py  # Uses DEBUG=True from .env

# Frontend with HMR
cd frontend
bun dev
````

### Production Build

```bash
# Backend
cd backend
# Ensure DEBUG=False in .env
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend
cd frontend
bun run build
# Serve dist/ folder with static file server
```

### Pre-deployment Checklist

- [ ] All tests pass
- [ ] No console.log/print statements
- [ ] DEBUG=False in production
- [ ] CORS origins configured correctly
- [ ] Error tracking configured
- [ ] Performance metrics validated

---

## Getting Help

### Resources

- **Architecture Docs**: `/docs/architecture/`
- **API Reference**: `/docs/api-reference.md`
- **Issue Tracker**: GitHub Issues
- **Team Chat**: #gesture-control-platform

### Escalation Path

1. Check documentation
2. Search existing issues
3. Ask in team chat
4. Create detailed issue
5. Request review from maintainers

---

This workflow guide ensures consistent, high-quality contributions to the Gesture Control Platform. Following these practices enables efficient collaboration and maintains the codebase's professional standards.
