/**
 * useGestureService - Hook for gesture detection service
 *
 * Implements the hook-service pattern by wrapping GestureService
 * in a React hook with proper lifecycle management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import GestureService from '@/services/api/GestureService';
import type { ConnectionStatus } from '@/services/api/GestureService';
import type { GestureData } from '@/types/gesture';
import type { ProjectType } from '@/types/project-types';

export interface UseGestureServiceReturn {
  // Data
  gestureData: GestureData | null;
  connectionStatus: ConnectionStatus;

  // Actions
  connect: () => void;
  disconnect: () => void;
  selectProject: (projectId: ProjectType) => void;

  // State
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useGestureService(): UseGestureServiceReturn {
  const serviceRef = useRef<GestureService | null>(null);
  const [gestureData, setGestureData] = useState<GestureData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    connecting: false,
    error: null,
    latency: 0,
    fps: 0,
    reconnectAttempts: 0,
  });

  // Initialize service
  useEffect(() => {
    serviceRef.current = GestureService.getInstance();

    // Subscribe to gesture data
    const unsubscribeData = serviceRef.current.subscribeToGestureData(data => {
      setGestureData(data);
    });

    // Subscribe to connection status
    const unsubscribeStatus = serviceRef.current.subscribeToConnectionStatus(
      status => {
        setConnectionStatus(status);
      }
    );

    // Cleanup
    return () => {
      unsubscribeData();
      unsubscribeStatus();
    };
  }, []);

  const connect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  const selectProject = useCallback((projectId: ProjectType) => {
    serviceRef.current?.selectProject(projectId);
  }, []);

  return {
    gestureData,
    connectionStatus,
    connect,
    disconnect,
    selectProject,
    isConnected: connectionStatus.connected,
    isConnecting: connectionStatus.connecting,
    error: connectionStatus.error,
  };
}

export default useGestureService;
