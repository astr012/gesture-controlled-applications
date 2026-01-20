/**
 * WebSocket Hub Service
 * 
 * Centralized WebSocket management for real-time gesture data streaming.
 * Handles connection lifecycle, message routing, and reconnection.
 */

import { useAppStore } from '../state/stores/appStore';
import { useProjectStore } from '../state/stores/projectStore';

// ============================================================================
// TYPES
// ============================================================================

export interface WebSocketMessage {
  id?: string;
  type: string;
  timestamp?: number;
  version?: string;
  project?: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}

export interface WebSocketConfig {
  url: string;
  reconnect: boolean;
  reconnectDelay: number;
  maxReconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

type MessageHandler = (message: WebSocketMessage) => void;
type EventHandler = () => void;

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: WebSocketConfig = {
  url: `ws://${window.location.hostname}:8000/ws/gestures`,
  reconnect: true,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
};

// ============================================================================
// WEBSOCKET HUB
// ============================================================================

class WebSocketHub {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  
  // Message handlers by type
  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private globalHandlers = new Set<MessageHandler>();
  
  // Event handlers
  private connectHandlers = new Set<EventHandler>();
  private disconnectHandlers = new Set<EventHandler>();
  
  // Pending messages (queued while disconnected)
  private pendingMessages: WebSocketMessage[] = [];
  
  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ===========================================================================
  // CONNECTION
  // ===========================================================================
  
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection in progress');
      return;
    }
    
    useAppStore.getState().setConnectionStatus('connecting');
    
    try {
      this.ws = new WebSocket(this.config.url);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      useAppStore.getState().setConnectionStatus('error', String(error));
      this.scheduleReconnect();
    }
  }
  
  disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    
    useAppStore.getState().setConnectionStatus('disconnected');
    this.disconnectHandlers.forEach((handler) => handler());
  }
  
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      useAppStore.getState().setConnectionStatus('connected');
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Flush pending messages
      this.flushPendingMessages();
      
      // Notify handlers
      this.connectHandlers.forEach((handler) => handler());
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      
      this.clearTimers();
      this.disconnectHandlers.forEach((handler) => handler());
      
      if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        useAppStore.getState().setConnectionStatus('reconnecting');
        this.scheduleReconnect();
      } else {
        useAppStore.getState().setConnectionStatus('disconnected');
      }
    };
    
    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      useAppStore.getState().setConnectionStatus('error', 'Connection error');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }
  
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    
    // Exponential backoff
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const start = Date.now();
        
        this.send({
          type: 'ping',
          timestamp: start,
        });
      }
    }, this.config.heartbeatInterval);
  }
  
  // ===========================================================================
  // MESSAGING
  // ===========================================================================
  
  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    
    // Queue message for later
    this.pendingMessages.push(message);
    return false;
  }
  
  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.send(message);
      }
    }
  }
  
  private handleMessage(message: WebSocketMessage): void {
    // Handle system messages
    if (message.type === 'pong') {
      if (message.timestamp) {
        const latency = Date.now() - message.timestamp;
        useAppStore.getState().updateLatency(latency);
      }
      return;
    }
    
    if (message.type === 'connected') {
      console.log('Connection confirmed:', message);
      return;
    }
    
    // Handle gesture data
    if (message.type === 'gesture_data' && message.data) {
      const projectStore = useProjectStore.getState();
      
      projectStore.updateGestureData({
        gestureType: message.data.gesture_type as any || 'none',
        confidence: (message.data.confidence as number) || 0,
        timestamp: message.timestamp || Date.now(),
        handsDetected: (message.data.hands_detected as number) || 0,
        fingerCount: message.data.finger_count as number,
        fingerStates: message.data.finger_states as any,
        landmarks: message.data.hands as any,
      });
      
      // Update metrics if included
      if (message.data.inference_latency_ms) {
        projectStore.updateMetrics({
          inferenceLatencyMs: message.data.inference_latency_ms as number,
        });
      }
    }
    
    // Handle metrics updates
    if (message.type === 'metrics' && message.data) {
      useProjectStore.getState().updateMetrics(message.data as any);
    }
    
    // Handle status changes
    if (message.type === 'status_change' && message.payload) {
      const status = message.payload.status as string;
      if (status) {
        useProjectStore.getState().setProjectStatus(status as any);
      }
    }
    
    // Handle errors
    if (message.type === 'error' && message.error) {
      useProjectStore.getState().setError(message.error.message);
      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Error',
        message: message.error.message,
      });
    }
    
    // Call type-specific handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
    
    // Call global handlers
    this.globalHandlers.forEach((handler) => handler(message));
  }
  
  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================
  
  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
    
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }
  
  subscribeAll(handler: MessageHandler): () => void {
    this.globalHandlers.add(handler);
    
    return () => {
      this.globalHandlers.delete(handler);
    };
  }
  
  onConnect(handler: EventHandler): () => void {
    this.connectHandlers.add(handler);
    
    return () => {
      this.connectHandlers.delete(handler);
    };
  }
  
  onDisconnect(handler: EventHandler): () => void {
    this.disconnectHandlers.add(handler);
    
    return () => {
      this.disconnectHandlers.delete(handler);
    };
  }
  
  // ===========================================================================
  // PROJECT CONTROL
  // ===========================================================================
  
  subscribeToProject(projectId: string): void {
    this.send({
      type: 'subscribe',
      project: projectId,
    });
  }
  
  unsubscribeFromProject(projectId: string): void {
    this.send({
      type: 'unsubscribe',
      project: projectId,
    });
  }
  
  selectProject(projectId: string): void {
    this.send({
      type: 'project_select',
      payload: { project: projectId },
    });
  }
  
  startProject(projectId: string): void {
    this.send({
      type: 'project_start',
      payload: { project: projectId },
    });
  }
  
  stopProject(projectId: string): void {
    this.send({
      type: 'project_stop',
      payload: { project: projectId },
    });
  }
  
  // ===========================================================================
  // STATUS
  // ===========================================================================
  
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const wsHub = new WebSocketHub();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';

export function useWebSocketHub() {
  const isInitialized = useRef(false);
  
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      wsHub.connect();
    }
    
    return () => {
      // Don't disconnect on unmount - let the hub persist
    };
  }, []);
  
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    return wsHub.subscribe(type, handler);
  }, []);
  
  const send = useCallback((message: WebSocketMessage) => {
    return wsHub.send(message);
  }, []);
  
  const selectProject = useCallback((projectId: string) => {
    wsHub.selectProject(projectId);
    wsHub.subscribeToProject(projectId);
  }, []);
  
  const startProject = useCallback((projectId: string) => {
    wsHub.startProject(projectId);
  }, []);
  
  const stopProject = useCallback((projectId: string) => {
    wsHub.stopProject(projectId);
  }, []);
  
  return {
    subscribe,
    send,
    selectProject,
    startProject,
    stopProject,
    isConnected: wsHub.isConnected,
  };
}

export default wsHub;
