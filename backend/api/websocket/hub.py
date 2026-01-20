"""
WebSocket Hub
Manages WebSocket connections and real-time gesture data streaming.
"""

import asyncio
import time
import uuid
from typing import Dict, Set, Optional, List, Any
from dataclasses import dataclass, field
from enum import Enum

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.types import OutputEvent
from core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()


class ConnectionState(str, Enum):
    """WebSocket connection states."""
    CONNECTING = "connecting"
    ACTIVE = "active"
    IDLE = "idle"
    CLOSING = "closing"
    CLOSED = "closed"


@dataclass
class ClientConnection:
    """Represents a WebSocket client connection."""
    id: str
    websocket: WebSocket
    state: ConnectionState = ConnectionState.CONNECTING
    subscribed_projects: Set[str] = field(default_factory=set)
    created_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)
    messages_sent: int = 0
    messages_received: int = 0


class WebSocketHub:
    """
    Central hub for managing WebSocket connections.
    
    Features:
    - Connection lifecycle management
    - Project-based pub/sub
    - Automatic cleanup of stale connections
    - Heartbeat monitoring
    """
    
    def __init__(self):
        self._connections: Dict[str, ClientConnection] = {}
        self._project_subscribers: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()
        self._cleanup_task: Optional[asyncio.Task] = None
        
        # Register as output listener
        self._register_output_listener()
    
    def _register_output_listener(self):
        """Register as listener for pipeline output events."""
        try:
            from core.dependencies import get_output_pipeline
            output = get_output_pipeline()
            output.dispatcher.add_async_global_listener(self._on_gesture_event)
        except Exception as e:
            logger.warning(f"Could not register output listener: {e}")
    
    async def _on_gesture_event(self, event: OutputEvent):
        """Handle gesture events from the pipeline."""
        await self.broadcast_project(event.project, {
            "type": "gesture_data",
            "project": event.project,
            "timestamp": event.timestamp,
            "data": event.data
        })
    
    @property
    def connection_count(self) -> int:
        """Get number of active connections."""
        return len(self._connections)
    
    async def connect(self, websocket: WebSocket) -> ClientConnection:
        """
        Accept a new WebSocket connection.
        
        Args:
            websocket: WebSocket instance
            
        Returns:
            ClientConnection object
        """
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
            "connection_id": connection.id,
            "timestamp": time.time(),
            "message": "Welcome to Gesture Control Platform"
        })
        
        return connection
    
    async def disconnect(self, connection_id: str):
        """
        Disconnect a client and cleanup.
        
        Args:
            connection_id: Connection ID to disconnect
        """
        async with self._lock:
            connection = self._connections.pop(connection_id, None)
            
            if connection:
                connection.state = ConnectionState.CLOSED
                
                # Remove from all project subscriptions
                for project in list(connection.subscribed_projects):
                    if project in self._project_subscribers:
                        self._project_subscribers[project].discard(connection_id)
                
                logger.info(
                    f"Client disconnected: {connection_id}, "
                    f"sent: {connection.messages_sent}, received: {connection.messages_received}"
                )
    
    async def subscribe_project(self, connection_id: str, project: str):
        """
        Subscribe a connection to a project's events.
        
        Args:
            connection_id: Connection ID
            project: Project ID to subscribe to
        """
        async with self._lock:
            if project not in self._project_subscribers:
                self._project_subscribers[project] = set()
            
            self._project_subscribers[project].add(connection_id)
            
            connection = self._connections.get(connection_id)
            if connection:
                connection.subscribed_projects.add(project)
        
        logger.debug(f"Connection {connection_id} subscribed to {project}")
    
    async def unsubscribe_project(self, connection_id: str, project: str):
        """
        Unsubscribe a connection from a project.
        
        Args:
            connection_id: Connection ID
            project: Project ID to unsubscribe from
        """
        async with self._lock:
            if project in self._project_subscribers:
                self._project_subscribers[project].discard(connection_id)
            
            connection = self._connections.get(connection_id)
            if connection:
                connection.subscribed_projects.discard(project)
    
    async def send_to_client(self, connection_id: str, message: dict) -> bool:
        """
        Send a message to a specific client.
        
        Args:
            connection_id: Target connection ID
            message: Message dict to send
            
        Returns:
            True if sent successfully
        """
        connection = self._connections.get(connection_id)
        if not connection or connection.state != ConnectionState.ACTIVE:
            return False
        
        try:
            # Add message envelope
            envelope = {
                "id": str(uuid.uuid4()),
                "timestamp": time.time() * 1000,
                "version": "2.0",
                **message
            }
            
            await connection.websocket.send_json(envelope)
            connection.messages_sent += 1
            connection.last_activity = time.time()
            return True
            
        except Exception as e:
            logger.error(f"Failed to send to {connection_id}: {e}")
            return False
    
    async def broadcast_project(self, project: str, message: dict):
        """
        Broadcast a message to all subscribers of a project.
        
        Args:
            project: Project ID
            message: Message to broadcast
        """
        subscribers = self._project_subscribers.get(project, set())
        
        if not subscribers:
            return
        
        tasks = [
            self.send_to_client(conn_id, message)
            for conn_id in subscribers
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def broadcast_all(self, message: dict):
        """
        Broadcast a message to all connected clients.
        
        Args:
            message: Message to broadcast
        """
        tasks = [
            self.send_to_client(conn_id, message)
            for conn_id in self._connections.keys()
        ]
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def handle_message(
        self,
        connection_id: str,
        data: dict
    ) -> Optional[dict]:
        """
        Handle an incoming message from a client.
        
        Args:
            connection_id: Source connection ID
            data: Message data
            
        Returns:
            Response message if any
        """
        connection = self._connections.get(connection_id)
        if connection:
            connection.messages_received += 1
            connection.last_activity = time.time()
        
        msg_type = data.get("type")
        
        if msg_type == "ping":
            return {
                "type": "pong",
                "timestamp": data.get("timestamp"),
                "server_time": time.time() * 1000
            }
        
        elif msg_type == "subscribe":
            project = data.get("project")
            if project:
                await self.subscribe_project(connection_id, project)
                return {
                    "type": "subscribed",
                    "project": project
                }
        
        elif msg_type == "unsubscribe":
            project = data.get("project")
            if project:
                await self.unsubscribe_project(connection_id, project)
                return {
                    "type": "unsubscribed",
                    "project": project
                }
        
        elif msg_type == "project_select":
            project = data.get("payload", {}).get("project")
            if project:
                # Unsubscribe from all, subscribe to new
                if connection:
                    for old_project in list(connection.subscribed_projects):
                        await self.unsubscribe_project(connection_id, old_project)
                await self.subscribe_project(connection_id, project)
                
                return {
                    "type": "project_selected",
                    "project": project
                }
        
        elif msg_type == "project_start":
            project = data.get("payload", {}).get("project")
            if project:
                try:
                    from core.dependencies import get_pipeline_orchestrator
                    orchestrator = get_pipeline_orchestrator()
                    await orchestrator.start(project)
                    
                    return {
                        "type": "status_change",
                        "payload": {"project": project, "status": "running"}
                    }
                except Exception as e:
                    return {
                        "type": "error",
                        "error": {
                            "code": "PROJECT_START_FAILED",
                            "message": str(e)
                        }
                    }
        
        elif msg_type == "project_stop":
            project = data.get("payload", {}).get("project")
            if project:
                try:
                    from core.dependencies import get_pipeline_orchestrator
                    orchestrator = get_pipeline_orchestrator()
                    await orchestrator.stop()
                    
                    return {
                        "type": "status_change",
                        "payload": {"project": project, "status": "stopped"}
                    }
                except Exception as e:
                    return {
                        "type": "error",
                        "error": {
                            "code": "PROJECT_STOP_FAILED",
                            "message": str(e)
                        }
                    }
        
        return None
    
    def get_stats(self) -> dict:
        """Get hub statistics."""
        return {
            "active_connections": len(self._connections),
            "connections": [
                {
                    "id": conn.id,
                    "state": conn.state.value,
                    "subscriptions": list(conn.subscribed_projects),
                    "messages_sent": conn.messages_sent,
                    "messages_received": conn.messages_received,
                    "idle_seconds": time.time() - conn.last_activity
                }
                for conn in self._connections.values()
            ],
            "projects": {
                project: len(subs)
                for project, subs in self._project_subscribers.items()
            }
        }
    
    async def shutdown(self):
        """Shutdown the hub and close all connections."""
        logger.info("Shutting down WebSocket hub")
        
        # Notify all clients
        await self.broadcast_all({
            "type": "server_shutdown",
            "message": "Server is shutting down"
        })
        
        # Close all connections
        for connection in list(self._connections.values()):
            try:
                await connection.websocket.close()
            except:
                pass
        
        self._connections.clear()
        self._project_subscribers.clear()


# Global hub instance
_hub: Optional[WebSocketHub] = None


def get_hub() -> WebSocketHub:
    """Get the global WebSocket hub instance."""
    global _hub
    if _hub is None:
        _hub = WebSocketHub()
    return _hub


# WebSocket Routes

@router.websocket("/ws/gestures")
async def gestures_websocket(websocket: WebSocket):
    """
    Main WebSocket endpoint for gesture data streaming.
    
    Protocol:
    1. Client connects
    2. Client sends {"type": "subscribe", "project": "finger_count"}
    3. Server streams gesture data to subscribed clients
    4. Client can change subscription at any time
    """
    hub = get_hub()
    connection = await hub.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            response = await hub.handle_message(connection.id, data)
            
            if response:
                await hub.send_to_client(connection.id, response)
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await hub.disconnect(connection.id)


@router.websocket("/ws/control")
async def control_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for project control commands.
    """
    hub = get_hub()
    connection = await hub.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            response = await hub.handle_message(connection.id, data)
            
            if response:
                await hub.send_to_client(connection.id, response)
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Control WebSocket error: {e}")
    finally:
        await hub.disconnect(connection.id)
