/**
 * Custom hook for WebSocket connection management using the enhanced WebSocketManager
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GestureData,
  ProjectType,
  ConnectionStatus,
  WebSocketMessage,
} from '../types';
import { WebSocketManager } from '../services/WebSocketManager';

export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    quality: {
      status: 'unknown',
      score: 0,
      factors: {
        latency: 0,
        stability: 0,
        throughput: 0,
      },
    },
    latency: 0,
    uptime: 0,
  });
  const [gestureData, setGestureData] = useState<GestureData | null>(null);

  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);

  // Initialize WebSocket manager
  useEffect(() => {
    const wsManager = new WebSocketManager({
      url: 'ws://localhost:8000/ws/gestures',
      maxReconnectAttempts: 10,
      baseReconnectDelay: 1000,
      maxReconnectDelay: 30000,
      pingInterval: 30000,
      connectionTimeout: 10000,
      messageQueueSize: 100,
    });

    wsManagerRef.current = wsManager;

    // Set up event listeners
    wsManager.on('onConnectionChange', (status) => {
      setConnectionStatus(status);
    });

    wsManager.on('onMessage', (data) => {
      setGestureData(data);
    });

    wsManager.on('onError', (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus(prev => ({
        ...prev,
        error: error.message,
      }));
    });

    // Subscribe to all gesture data
    const subscriptionId = wsManager.subscribe((data) => {
      setGestureData(data);
    });
    subscriptionIdRef.current = subscriptionId;

    // Auto-connect
    wsManager.connect().catch((error) => {
      console.error('Failed to connect:', error);
    });

    return () => {
      if (subscriptionIdRef.current) {
        wsManager.unsubscribe(subscriptionIdRef.current);
      }
      wsManager.destroy();
    };
  }, []);

  const connect = useCallback(async () => {
    if (wsManagerRef.current) {
      try {
        await wsManagerRef.current.connect();
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
    }
    setGestureData(null);
  }, []);

  const reconnect = useCallback(async () => {
    if (wsManagerRef.current) {
      try {
        await wsManagerRef.current.reconnect();
      } catch (error) {
        console.error('Failed to reconnect:', error);
      }
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.send(message);
    } else {
      console.warn('WebSocket manager not initialized');
    }
  }, []);

  const selectProject = useCallback((project: ProjectType) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.selectProject(project);
    } else {
      console.warn('WebSocket manager not initialized');
    }
  }, []);

  const subscribeToProject = useCallback((
    callback: (data: GestureData) => void,
    project?: ProjectType
  ): (() => void) => {
    if (!wsManagerRef.current) {
      console.warn('WebSocket manager not initialized');
      return () => { };
    }

    const subscriptionId = wsManagerRef.current.subscribe(callback, project);

    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.unsubscribe(subscriptionId);
      }
    };
  }, []);

  const getConnectionQuality = useCallback(() => {
    return wsManagerRef.current?.getConnectionQuality() || {
      status: 'unknown' as const,
      score: 0,
      factors: {
        latency: 0,
        stability: 0,
        throughput: 0,
      },
    };
  }, []);

  const getLatency = useCallback(() => {
    return wsManagerRef.current?.getLatency() || 0;
  }, []);

  const getCurrentProject = useCallback(() => {
    return wsManagerRef.current?.getCurrentProject() || null;
  }, []);

  return {
    connectionStatus,
    gestureData,
    connect,
    disconnect,
    reconnect,
    selectProject,
    sendMessage,
    subscribeToProject,
    getConnectionQuality,
    getLatency,
    getCurrentProject,
  };
};
