# API Gateway Design

> **Document**: 03-API-GATEWAY-DESIGN.md  
> **Version**: 2.0.0  
> **Scope**: API Gateway layer with WebSocket/REST responsibilities and event schemas

---

## Overview

The API Gateway provides a unified interface between frontend dashboards and backend pipelines. It handles:

- **REST endpoints** for configuration, metadata, and control operations
- **WebSocket channels** for real-time gesture data streaming
- **Event routing** between pipeline stages and frontend subscribers
- **Protocol versioning** for backward compatibility

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND CLIENT                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│   REST Client          │    WebSocket Hub      │    Event Subscriber                    │
│   (fetch/axios)        │    (native WS)        │    (custom handlers)                   │
└────────┬───────────────┴──────────┬────────────┴────────────┬─────────────────────────-─┘
         │                          │                          │
         ▼                          ▼                          │
┌────────────────────────────────────────────────────────────--┼──────────────────────────┐
│                           API GATEWAY LAYER                  │                          │
├──────────────────────────────────────────────────────────────┼──────────────────────────┤
│                                                              ▼                          │
│  ┌─────────────────────┐     ┌─────────────────────┐    ┌─────────────────────┐        │
│  │     REST Router     │     │   WebSocket Hub     │    │   Event Router      │        │
│  ├─────────────────────┤     ├─────────────────────┤    ├─────────────────────┤        │
│  │ /api/v1/health     │     │ /ws/v1/stream       │    │ topic: gestures     │        │
│  │ /api/v1/projects   │     │ /ws/v1/control      │    │ topic: metrics      │        │
│  │ /api/v1/config     │     │ /ws/v1/telemetry    │    │ topic: system       │        │
│  │ /api/v1/telemetry  │     │                     │    │ topic: errors       │        │
│  └──────────┬──────────┘     └──────────┬──────────┘    └──────────┬──────────┘        │
│             │                           │                          │                    │
│             ▼                           ▼                          ▼                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            MESSAGE BROKER / ROUTER                                │  │
│  │  • Message validation  • Rate limiting  • Authentication  • Logging              │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                               │
└─────────────────────────────────────────┼───────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND PIPELINE LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Ingestion  │──│ Preprocess  │──│  Extraction │──│  Inference  │──│   Output    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## REST API Specification

### API Versioning Strategy

All REST endpoints are versioned via URL path prefix:

```
/api/v1/...   # Current stable version
/api/v2/...   # Next version (preview)
```

### Base Configuration

```python
# api/gateway.py

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from api.rest import health, projects, config, telemetry
from api.websocket import hub

def create_api_gateway() -> FastAPI:
    """Create and configure the API Gateway."""
    
    app = FastAPI(
        title="Gesture Control Platform API",
        description="Enterprise-grade gesture recognition API",
        version="2.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )
    
    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Mount API routers
    v1_router = APIRouter(prefix="/api/v1")
    v1_router.include_router(health.router, tags=["Health"])
    v1_router.include_router(projects.router, tags=["Projects"])
    v1_router.include_router(config.router, tags=["Configuration"])
    v1_router.include_router(telemetry.router, tags=["Telemetry"])
    
    app.include_router(v1_router)
    
    # Mount WebSocket hub
    app.include_router(hub.router)
    
    return app
```

### Health Endpoints

```python
# api/rest/health.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/health")


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ComponentHealth(BaseModel):
    status: HealthStatus
    latency_ms: Optional[float] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    status: HealthStatus
    version: str
    timestamp: datetime
    uptime_seconds: float
    components: Dict[str, ComponentHealth]


class ReadinessResponse(BaseModel):
    ready: bool
    checks: Dict[str, bool]


@router.get("", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check including all system components.
    
    Returns:
        HealthResponse: Overall system health with component breakdown
    """
    from services.health import HealthChecker
    
    checker = HealthChecker()
    return await checker.check_all()


@router.get("/live")
async def liveness_probe():
    """
    Kubernetes liveness probe - is the service running?
    
    Returns:
        Simple OK response if service is alive
    """
    return {"status": "alive"}


@router.get("/ready", response_model=ReadinessResponse)
async def readiness_probe():
    """
    Kubernetes readiness probe - is the service ready to accept traffic?
    
    Checks:
        - Camera availability
        - ML model loaded
        - WebSocket hub active
    """
    from services.health import HealthChecker
    
    checker = HealthChecker()
    return await checker.check_readiness()
```

### Projects Endpoints

```python
# api/rest/projects.py

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

router = APIRouter(prefix="/projects")


class ProjectCategory(str, Enum):
    BASIC = "basic"
    ADVANCED = "advanced"
    EXPERIMENTAL = "experimental"


class ProjectStatus(str, Enum):
    AVAILABLE = "available"
    RUNNING = "running"
    DISABLED = "disabled"
    ERROR = "error"


class ProjectMetadata(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: ProjectCategory
    version: str
    status: ProjectStatus
    features: List[str]
    requirements: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "id": "finger_count",
                "name": "Finger Counting",
                "description": "Real-time finger detection and counting",
                "icon": "✋",
                "category": "basic",
                "version": "1.0.0",
                "status": "available",
                "features": ["Multi-hand", "Real-time", "High accuracy"],
                "requirements": ["MediaPipe", "Camera"]
            }
        }


class ProjectSettings(BaseModel):
    display_mode: str = Field(default="detailed")
    show_debug_info: bool = Field(default=False)
    sensitivity: float = Field(default=0.5, ge=0, le=1)
    custom_settings: Dict[str, Any] = Field(default_factory=dict)


class ProjectListResponse(BaseModel):
    projects: List[ProjectMetadata]
    total: int
    enabled_count: int


class ProjectDetailResponse(BaseModel):
    project: ProjectMetadata
    settings: ProjectSettings
    statistics: Dict[str, Any]


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    category: Optional[ProjectCategory] = Query(None, description="Filter by category"),
    enabled_only: bool = Query(True, description="Only show enabled projects")
):
    """
    List all available gesture projects.
    
    Returns:
        ProjectListResponse: List of projects with metadata
    """
    from projects.registry import project_registry
    
    projects = project_registry.get_all()
    
    if category:
        projects = [p for p in projects if p.category == category]
    
    if enabled_only:
        projects = [p for p in projects if p.status != ProjectStatus.DISABLED]
    
    return ProjectListResponse(
        projects=projects,
        total=len(projects),
        enabled_count=len([p for p in projects if p.status == ProjectStatus.AVAILABLE])
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(project_id: str):
    """
    Get detailed information about a specific project.
    
    Args:
        project_id: Unique project identifier
        
    Returns:
        ProjectDetailResponse: Detailed project information
    """
    from projects.registry import project_registry
    
    project = project_registry.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
    
    settings = project_registry.get_settings(project_id)
    statistics = project_registry.get_statistics(project_id)
    
    return ProjectDetailResponse(
        project=project,
        settings=settings,
        statistics=statistics
    )


@router.put("/{project_id}/settings", response_model=ProjectSettings)
async def update_project_settings(project_id: str, settings: ProjectSettings):
    """
    Update settings for a specific project.
    
    Args:
        project_id: Unique project identifier
        settings: New settings to apply
        
    Returns:
        ProjectSettings: Updated settings
    """
    from projects.registry import project_registry
    
    if not project_registry.get(project_id):
        raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")
    
    updated = project_registry.update_settings(project_id, settings)
    return updated


@router.post("/{project_id}/start")
async def start_project(project_id: str):
    """
    Start/activate a gesture project.
    
    This initializes the pipeline and begins processing.
    """
    from services.pipeline_manager import PipelineManager
    
    manager = PipelineManager.get_instance()
    
    try:
        await manager.start_project(project_id)
        return {"status": "started", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/stop")
async def stop_project(project_id: str):
    """
    Stop/deactivate a gesture project.
    
    This halts the pipeline and releases resources.
    """
    from services.pipeline_manager import PipelineManager
    
    manager = PipelineManager.get_instance()
    
    try:
        await manager.stop_project(project_id)
        return {"status": "stopped", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Telemetry Endpoints

```python
# api/rest/telemetry.py

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/telemetry")


class PipelineMetrics(BaseModel):
    total_latency_ms: float
    ingestion_latency_ms: float
    preprocessing_latency_ms: float
    extraction_latency_ms: float
    inference_latency_ms: float
    output_latency_ms: float
    frames_processed: int
    frames_dropped: int
    error_count: int


class SystemMetrics(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_mb: float
    gpu_percent: Optional[float] = None
    gpu_memory_mb: Optional[float] = None


class ConnectionMetrics(BaseModel):
    active_connections: int
    total_messages_sent: int
    total_bytes_sent: int
    average_latency_ms: float


class TelemetrySnapshot(BaseModel):
    timestamp: datetime
    pipeline: PipelineMetrics
    system: SystemMetrics
    connections: ConnectionMetrics


class TelemetryHistoryResponse(BaseModel):
    snapshots: List[TelemetrySnapshot]
    aggregation_interval_seconds: int
    period_start: datetime
    period_end: datetime


@router.get("/current", response_model=TelemetrySnapshot)
async def get_current_telemetry():
    """
    Get current real-time telemetry data.
    
    Returns:
        TelemetrySnapshot: Current system metrics
    """
    from services.telemetry import TelemetryCollector
    
    collector = TelemetryCollector.get_instance()
    return collector.get_current()


@router.get("/history", response_model=TelemetryHistoryResponse)
async def get_telemetry_history(
    period_minutes: int = Query(60, ge=1, le=1440, description="History period in minutes"),
    aggregation_seconds: int = Query(60, ge=1, le=3600, description="Aggregation interval")
):
    """
    Get historical telemetry data.
    
    Args:
        period_minutes: How far back to look
        aggregation_seconds: Aggregation interval
        
    Returns:
        TelemetryHistoryResponse: Historical metrics
    """
    from services.telemetry import TelemetryCollector
    
    collector = TelemetryCollector.get_instance()
    return collector.get_history(
        period=timedelta(minutes=period_minutes),
        aggregation=timedelta(seconds=aggregation_seconds)
    )


@router.get("/performance/summary")
async def get_performance_summary():
    """
    Get performance summary with recommendations.
    """
    from services.telemetry import TelemetryCollector
    
    collector = TelemetryCollector.get_instance()
    current = collector.get_current()
    
    # Calculate performance score
    latency_score = _calculate_latency_score(current.pipeline.total_latency_ms)
    stability_score = _calculate_stability_score(current.pipeline.frames_dropped, current.pipeline.frames_processed)
    resource_score = _calculate_resource_score(current.system.cpu_percent, current.system.memory_percent)
    
    overall_score = (latency_score + stability_score + resource_score) / 3
    
    recommendations = []
    
    if latency_score < 70:
        recommendations.append({
            "type": "performance",
            "severity": "warning",
            "message": "High latency detected. Consider reducing camera resolution."
        })
    
    if current.system.memory_percent > 80:
        recommendations.append({
            "type": "resource",
            "severity": "warning", 
            "message": "High memory usage. Consider closing other applications."
        })
    
    return {
        "overall_score": overall_score,
        "scores": {
            "latency": latency_score,
            "stability": stability_score,
            "resources": resource_score
        },
        "recommendations": recommendations,
        "timestamp": current.timestamp
    }


def _calculate_latency_score(latency_ms: float) -> float:
    if latency_ms < 20: return 100
    if latency_ms < 33: return 90
    if latency_ms < 50: return 75
    if latency_ms < 100: return 50
    return 25


def _calculate_stability_score(dropped: int, processed: int) -> float:
    if processed == 0: return 100
    drop_rate = dropped / processed
    return max(0, 100 - (drop_rate * 500))


def _calculate_resource_score(cpu: float, memory: float) -> float:
    cpu_score = max(0, 100 - cpu)
    memory_score = max(0, 100 - memory)
    return (cpu_score + memory_score) / 2
```

---

## WebSocket API Specification

### WebSocket Channels

| Channel | Path | Purpose | Direction |
|---------|------|---------|-----------|
| **Stream** | `/ws/v1/stream` | Gesture data streaming | Server → Client |
| **Control** | `/ws/v1/control` | Project control commands | Bidirectional |
| **Telemetry** | `/ws/v1/telemetry` | System metrics | Server → Client |

### Message Schema

All WebSocket messages follow this envelope:

```typescript
interface WebSocketMessage {
  // Message metadata
  id: string;           // Unique message ID (UUID)
  type: MessageType;    // Message type enum
  timestamp: number;    // Unix timestamp (ms)
  version: string;      // Schema version
  
  // Optional routing
  channel?: string;     // Target channel
  project?: string;     // Target project
  
  // Payload
  payload: object;      // Type-specific payload
  
  // Optional error
  error?: {
    code: string;
    message: string;
    details?: object;
  };
}

type MessageType =
  // Client → Server
  | 'subscribe'
  | 'unsubscribe'
  | 'project_select'
  | 'project_start'
  | 'project_stop'
  | 'settings_update'
  | 'ping'
  
  // Server → Client
  | 'gesture_data'
  | 'metrics_update'
  | 'status_change'
  | 'error'
  | 'pong';
```

### WebSocket Hub Implementation

```python
# api/websocket/hub.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import json
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class ConnectionState(Enum):
    CONNECTING = "connecting"
    ACTIVE = "active"
    IDLE = "idle"
    CLOSING = "closing"


@dataclass
class ClientConnection:
    """Represents a single WebSocket client connection."""
    id: str
    websocket: WebSocket
    state: ConnectionState = ConnectionState.CONNECTING
    subscribed_channels: Set[str] = field(default_factory=set)
    subscribed_projects: Set[str] = field(default_factory=set)
    created_at: float = field(default_factory=lambda: __import__('time').time())
    last_activity: float = field(default_factory=lambda: __import__('time').time())


class WebSocketHub:
    """
    Central hub for managing WebSocket connections and message routing.
    
    Features:
    - Connection lifecycle management
    - Channel-based pub/sub
    - Project-specific routing
    - Automatic cleanup
    """
    
    _instance: Optional['WebSocketHub'] = None
    
    def __init__(self):
        self._connections: Dict[str, ClientConnection] = {}
        self._channel_subscribers: Dict[str, Set[str]] = {}
        self._project_subscribers: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()
    
    @classmethod
    def get_instance(cls) -> 'WebSocketHub':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def connect(self, websocket: WebSocket) -> ClientConnection:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        connection = ClientConnection(
            id=str(uuid.uuid4()),
            websocket=websocket,
            state=ConnectionState.ACTIVE
        )
        
        async with self._lock:
            self._connections[connection.id] = connection
        
        logger.info(f"Client connected: {connection.id}")
        
        # Send welcome message
        await self.send_to_client(connection.id, {
            "type": "connected",
            "payload": {
                "connection_id": connection.id,
                "timestamp": connection.created_at
            }
        })
        
        return connection
    
    async def disconnect(self, connection_id: str):
        """Disconnect a client and cleanup subscriptions."""
        async with self._lock:
            connection = self._connections.pop(connection_id, None)
            
            if connection:
                connection.state = ConnectionState.CLOSING
                
                # Remove from all subscriptions
                for channel in connection.subscribed_channels:
                    if channel in self._channel_subscribers:
                        self._channel_subscribers[channel].discard(connection_id)
                
                for project in connection.subscribed_projects:
                    if project in self._project_subscribers:
                        self._project_subscribers[project].discard(connection_id)
                
                logger.info(f"Client disconnected: {connection_id}")
    
    async def subscribe_channel(self, connection_id: str, channel: str):
        """Subscribe a client to a channel."""
        async with self._lock:
            if channel not in self._channel_subscribers:
                self._channel_subscribers[channel] = set()
            
            self._channel_subscribers[channel].add(connection_id)
            
            connection = self._connections.get(connection_id)
            if connection:
                connection.subscribed_channels.add(channel)
    
    async def subscribe_project(self, connection_id: str, project_id: str):
        """Subscribe a client to a project's updates."""
        async with self._lock:
            if project_id not in self._project_subscribers:
                self._project_subscribers[project_id] = set()
            
            self._project_subscribers[project_id].add(connection_id)
            
            connection = self._connections.get(connection_id)
            if connection:
                connection.subscribed_projects.add(project_id)
    
    async def unsubscribe_project(self, connection_id: str, project_id: str):
        """Unsubscribe a client from a project."""
        async with self._lock:
            if project_id in self._project_subscribers:
                self._project_subscribers[project_id].discard(connection_id)
            
            connection = self._connections.get(connection_id)
            if connection:
                connection.subscribed_projects.discard(project_id)
    
    async def send_to_client(self, connection_id: str, message: dict):
        """Send a message to a specific client."""
        connection = self._connections.get(connection_id)
        if not connection or connection.state != ConnectionState.ACTIVE:
            return
        
        try:
            # Add envelope metadata
            envelope = {
                "id": str(uuid.uuid4()),
                "timestamp": __import__('time').time() * 1000,
                "version": "2.0",
                **message
            }
            
            await connection.websocket.send_json(envelope)
            connection.last_activity = __import__('time').time()
        except Exception as e:
            logger.error(f"Failed to send to client {connection_id}: {e}")
    
    async def broadcast_channel(self, channel: str, message: dict):
        """Broadcast a message to all subscribers of a channel."""
        subscribers = self._channel_subscribers.get(channel, set())
        
        tasks = [
            self.send_to_client(conn_id, message)
            for conn_id in subscribers
        ]
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_project(self, project_id: str, message: dict):
        """Broadcast a message to all subscribers of a project."""
        subscribers = self._project_subscribers.get(project_id, set())
        
        # Add project context
        message["project"] = project_id
        
        tasks = [
            self.send_to_client(conn_id, message)
            for conn_id in subscribers
        ]
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_all(self, message: dict):
        """Broadcast a message to all connected clients."""
        tasks = [
            self.send_to_client(conn_id, message)
            for conn_id in self._connections.keys()
        ]
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def get_connection_count(self) -> int:
        """Get the number of active connections."""
        return len(self._connections)
    
    def get_stats(self) -> dict:
        """Get hub statistics."""
        return {
            "active_connections": len(self._connections),
            "channels": {
                channel: len(subs) 
                for channel, subs in self._channel_subscribers.items()
            },
            "projects": {
                project: len(subs)
                for project, subs in self._project_subscribers.items()
            }
        }


# WebSocket endpoints

@router.websocket("/ws/v1/stream")
async def stream_endpoint(websocket: WebSocket):
    """
    Main gesture data streaming endpoint.
    
    Message flow:
    1. Client connects
    2. Client subscribes to project(s)
    3. Server streams gesture data
    4. Client can change subscription at any time
    """
    hub = WebSocketHub.get_instance()
    connection = await hub.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            msg_type = data.get("type")
            
            if msg_type == "subscribe":
                project_id = data.get("project")
                if project_id:
                    await hub.subscribe_project(connection.id, project_id)
                    await hub.send_to_client(connection.id, {
                        "type": "subscribed",
                        "payload": {"project": project_id}
                    })
            
            elif msg_type == "unsubscribe":
                project_id = data.get("project")
                if project_id:
                    await hub.unsubscribe_project(connection.id, project_id)
                    await hub.send_to_client(connection.id, {
                        "type": "unsubscribed",
                        "payload": {"project": project_id}
                    })
            
            elif msg_type == "project_select":
                project_id = data.get("payload", {}).get("project")
                if project_id:
                    # Unsubscribe from all, subscribe to new
                    for old_project in list(connection.subscribed_projects):
                        await hub.unsubscribe_project(connection.id, old_project)
                    await hub.subscribe_project(connection.id, project_id)
                    
                    # Notify pipeline to send data for this project
                    from services.pipeline_manager import PipelineManager
                    manager = PipelineManager.get_instance()
                    await manager.activate_for_client(connection.id, project_id)
            
            elif msg_type == "ping":
                await hub.send_to_client(connection.id, {
                    "type": "pong",
                    "payload": {"timestamp": data.get("timestamp")}
                })
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await hub.disconnect(connection.id)


@router.websocket("/ws/v1/control")
async def control_endpoint(websocket: WebSocket):
    """
    Project control endpoint for start/stop/configure operations.
    """
    hub = WebSocketHub.get_instance()
    connection = await hub.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            msg_type = data.get("type")
            
            if msg_type == "project_start":
                project_id = data.get("payload", {}).get("project")
                from services.pipeline_manager import PipelineManager
                manager = PipelineManager.get_instance()
                
                try:
                    await manager.start_project(project_id)
                    await hub.send_to_client(connection.id, {
                        "type": "status_change",
                        "payload": {"project": project_id, "status": "running"}
                    })
                except Exception as e:
                    await hub.send_to_client(connection.id, {
                        "type": "error",
                        "error": {"code": "PROJECT_START_FAILED", "message": str(e)}
                    })
            
            elif msg_type == "project_stop":
                project_id = data.get("payload", {}).get("project")
                from services.pipeline_manager import PipelineManager
                manager = PipelineManager.get_instance()
                
                try:
                    await manager.stop_project(project_id)
                    await hub.send_to_client(connection.id, {
                        "type": "status_change",
                        "payload": {"project": project_id, "status": "stopped"}
                    })
                except Exception as e:
                    await hub.send_to_client(connection.id, {
                        "type": "error",
                        "error": {"code": "PROJECT_STOP_FAILED", "message": str(e)}
                    })
            
            elif msg_type == "settings_update":
                project_id = data.get("payload", {}).get("project")
                settings = data.get("payload", {}).get("settings")
                
                from projects.registry import project_registry
                project_registry.update_settings(project_id, settings)
                
                await hub.send_to_client(connection.id, {
                    "type": "settings_updated",
                    "payload": {"project": project_id, "settings": settings}
                })
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Control WebSocket error: {e}")
    finally:
        await hub.disconnect(connection.id)


@router.websocket("/ws/v1/telemetry")
async def telemetry_endpoint(websocket: WebSocket):
    """
    System telemetry streaming endpoint.
    """
    hub = WebSocketHub.get_instance()
    connection = await hub.connect(websocket)
    
    # Subscribe to telemetry channel
    await hub.subscribe_channel(connection.id, "telemetry")
    
    try:
        while True:
            # Keep connection alive and handle any client messages
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                await hub.send_to_client(connection.id, {
                    "type": "pong",
                    "payload": {"timestamp": data.get("timestamp")}
                })
    
    except WebSocketDisconnect:
        pass
    finally:
        await hub.disconnect(connection.id)
```

---

## Event Schemas

### Gesture Data Event

```typescript
interface GestureDataEvent {
  type: 'gesture_data';
  project: ProjectType;
  timestamp: number;
  payload: {
    hands_detected: number;
    hands: HandData[];
    
    // Project-specific data
    gesture_result: GestureResult;
    
    // Metrics
    processing_latency_ms: number;
  };
}

interface HandData {
  label: 'Left' | 'Right';
  confidence: number;
  landmarks: Landmark[];
  finger_states?: FingerStates;
}

interface Landmark {
  x: number;       // Normalized [0, 1]
  y: number;       // Normalized [0, 1]
  z: number;       // Depth estimate
  pixel_x: number;
  pixel_y: number;
}

interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

interface GestureResult {
  gesture_type: string;
  confidence: number;
  
  // Finger count specific
  finger_count?: number;
  total_fingers?: number;
  
  // Volume control specific
  volume_level?: number;
  is_controlling?: boolean;
  
  // Virtual mouse specific
  cursor_x?: number;
  cursor_y?: number;
  is_clicking?: boolean;
}
```

### Status Change Event

```typescript
interface StatusChangeEvent {
  type: 'status_change';
  project?: string;
  timestamp: number;
  payload: {
    status: 'running' | 'stopped' | 'paused' | 'error';
    message?: string;
    details?: object;
  };
}
```

### Metrics Update Event

```typescript
interface MetricsUpdateEvent {
  type: 'metrics_update';
  timestamp: number;
  payload: {
    fps: number;
    latency_ms: number;
    cpu_percent: number;
    memory_mb: number;
    frame_count: number;
    error_count: number;
  };
}
```

### Error Event

```typescript
interface ErrorEvent {
  type: 'error';
  timestamp: number;
  error: {
    code: ErrorCode;
    message: string;
    details?: object;
    recoverable: boolean;
  };
}

type ErrorCode =
  | 'CAMERA_UNAVAILABLE'
  | 'CAMERA_READ_FAILED'
  | 'MODEL_LOAD_FAILED'
  | 'INFERENCE_FAILED'
  | 'PROJECT_NOT_FOUND'
  | 'CONNECTION_TIMEOUT'
  | 'INTERNAL_ERROR';
```

---

## Rate Limiting & Backpressure

### Rate Limiting Configuration

```python
# api/middleware/rate_limiter.py

from fastapi import Request, HTTPException
from typing import Dict, Tuple
import time
import asyncio


class RateLimiter:
    """Token bucket rate limiter."""
    
    def __init__(
        self,
        requests_per_second: float = 100,
        burst_size: int = 200
    ):
        self.rate = requests_per_second
        self.burst_size = burst_size
        self._buckets: Dict[str, Tuple[float, float]] = {}  # client_id -> (tokens, last_update)
        self._lock = asyncio.Lock()
    
    async def acquire(self, client_id: str) -> bool:
        """Try to acquire a token. Returns True if allowed."""
        async with self._lock:
            now = time.time()
            
            if client_id not in self._buckets:
                self._buckets[client_id] = (self.burst_size - 1, now)
                return True
            
            tokens, last_update = self._buckets[client_id]
            
            # Refill tokens
            elapsed = now - last_update
            tokens = min(self.burst_size, tokens + elapsed * self.rate)
            
            if tokens >= 1:
                self._buckets[client_id] = (tokens - 1, now)
                return True
            
            return False
    
    async def cleanup(self):
        """Remove stale entries."""
        async with self._lock:
            now = time.time()
            stale_threshold = 300  # 5 minutes
            
            stale_keys = [
                k for k, (_, last_update) in self._buckets.items()
                if now - last_update > stale_threshold
            ]
            
            for key in stale_keys:
                del self._buckets[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """Middleware to apply rate limiting."""
    client_id = request.client.host if request.client else "unknown"
    
    if not await rate_limiter.acquire(client_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please slow down."
        )
    
    return await call_next(request)
```

### WebSocket Backpressure

```python
# api/websocket/backpressure.py

import asyncio
from dataclasses import dataclass
from typing import Optional


@dataclass
class BackpressureConfig:
    max_queue_size: int = 100
    drop_strategy: str = "oldest"  # "oldest" | "newest" | "random"
    warning_threshold: float = 0.8


class BackpressureController:
    """Controls message flow to prevent overwhelming clients."""
    
    def __init__(self, config: BackpressureConfig = None):
        self.config = config or BackpressureConfig()
        self._queues: dict[str, asyncio.Queue] = {}
    
    def get_queue(self, connection_id: str) -> asyncio.Queue:
        """Get or create a queue for a connection."""
        if connection_id not in self._queues:
            self._queues[connection_id] = asyncio.Queue(
                maxsize=self.config.max_queue_size
            )
        return self._queues[connection_id]
    
    async def enqueue(self, connection_id: str, message: dict) -> bool:
        """
        Enqueue a message for sending.
        Returns False if message was dropped due to backpressure.
        """
        queue = self.get_queue(connection_id)
        
        # Check if queue is full
        if queue.full():
            if self.config.drop_strategy == "oldest":
                # Remove oldest message
                try:
                    queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            elif self.config.drop_strategy == "newest":
                # Drop this message
                return False
        
        try:
            queue.put_nowait(message)
            return True
        except asyncio.QueueFull:
            return False
    
    async def dequeue(self, connection_id: str) -> Optional[dict]:
        """Dequeue the next message to send."""
        queue = self.get_queue(connection_id)
        try:
            return await asyncio.wait_for(queue.get(), timeout=1.0)
        except asyncio.TimeoutError:
            return None
    
    def remove_connection(self, connection_id: str):
        """Remove a connection's queue."""
        self._queues.pop(connection_id, None)
    
    def get_queue_stats(self, connection_id: str) -> dict:
        """Get queue statistics for a connection."""
        queue = self._queues.get(connection_id)
        if not queue:
            return {"exists": False}
        
        return {
            "exists": True,
            "size": queue.qsize(),
            "max_size": self.config.max_queue_size,
            "fill_ratio": queue.qsize() / self.config.max_queue_size,
            "is_warning": queue.qsize() / self.config.max_queue_size > self.config.warning_threshold
        }
```

---

## Versioning Strategy

### API Version Matrix

| Version | Status | Support Until | Changes |
|---------|--------|---------------|---------|
| v1 | Stable | 2027-01-01 | Current production version |
| v2 | Preview | - | Enhanced event schemas, new endpoints |

### Version Negotiation

```python
# api/middleware/versioning.py

from fastapi import Request, HTTPException


SUPPORTED_VERSIONS = ["1", "2"]
DEFAULT_VERSION = "1"


async def version_middleware(request: Request, call_next):
    """Extract and validate API version from path."""
    
    path = request.url.path
    
    # Extract version from path like /api/v1/...
    if path.startswith("/api/v"):
        parts = path.split("/")
        if len(parts) >= 3:
            version = parts[2].replace("v", "")
            
            if version not in SUPPORTED_VERSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported API version: v{version}. Supported: {SUPPORTED_VERSIONS}"
                )
            
            # Add version to request state for handlers
            request.state.api_version = version
    
    return await call_next(request)


def get_api_version(request: Request) -> str:
    """Get the API version for the current request."""
    return getattr(request.state, 'api_version', DEFAULT_VERSION)
```

### WebSocket Version Handshake

```typescript
// Client-side version negotiation

interface HandshakeMessage {
  type: 'handshake';
  payload: {
    clientVersion: string;
    supportedVersions: string[];
    capabilities: string[];
  };
}

interface HandshakeResponse {
  type: 'handshake_response';
  payload: {
    serverVersion: string;
    negotiatedVersion: string;
    capabilities: string[];
  };
}
```

---

## Summary

This API Gateway design provides:

1. **Clear separation** between REST (control) and WebSocket (streaming) channels
2. **Typed schemas** for all messages with version support
3. **Pub/sub routing** for efficient message delivery
4. **Rate limiting** and backpressure handling
5. **Comprehensive telemetry** endpoints
6. **Forward-compatible versioning** strategy

The design supports both simple single-client scenarios and enterprise multi-client deployments with proper resource management.
