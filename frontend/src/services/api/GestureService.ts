/**
 * GestureService - Service layer for gesture-related API calls
 *
 * Provides a clean abstraction over WebSocket and REST interactions
 * for gesture detection functionality.
 */

import wsHub from '../WebSocketHub';
import type { GestureData } from '@/types/gesture';
import type { ProjectType } from '@/types/project-types';

export interface GestureServiceConfig {
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  latency: number;
  fps: number;
  reconnectAttempts: number;
}

type GestureDataCallback = (data: GestureData) => void;
type ConnectionStatusCallback = (status: ConnectionStatus) => void;

class GestureService {
  private static instance: GestureService | null = null;
  private dataSubscribers: Set<GestureDataCallback> = new Set();
  private statusSubscribers: Set<ConnectionStatusCallback> = new Set();
  private currentProject: ProjectType | null = null;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    connecting: false,
    error: null,
    latency: 0,
    fps: 0,
    reconnectAttempts: 0,
  };

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): GestureService {
    if (!GestureService.instance) {
      GestureService.instance = new GestureService();
    }
    return GestureService.instance;
  }

  private setupEventListeners(): void {
    // Listen for gesture data via WebSocket subscription
    wsHub.subscribe('gesture_data', message => {
      if (message.data) {
        this.notifyDataSubscribers(message.data as unknown as GestureData);
      }
    });

    // Listen for connection events
    wsHub.onConnect(() => {
      this.connectionStatus = {
        ...this.connectionStatus,
        connected: true,
        connecting: false,
        error: null,
      };
      this.notifyStatusSubscribers();
    });

    wsHub.onDisconnect(() => {
      this.connectionStatus = {
        ...this.connectionStatus,
        connected: false,
        connecting: false,
      };
      this.notifyStatusSubscribers();
    });
  }

  private notifyDataSubscribers(data: GestureData): void {
    this.dataSubscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in gesture data subscriber:', error);
      }
    });
  }

  private notifyStatusSubscribers(): void {
    this.statusSubscribers.forEach(callback => {
      try {
        callback(this.connectionStatus);
      } catch (error) {
        console.error('Error in status subscriber:', error);
      }
    });
  }

  // Public API

  /**
   * Connect to the gesture detection service
   */
  connect(): void {
    this.connectionStatus = { ...this.connectionStatus, connecting: true };
    this.notifyStatusSubscribers();
    wsHub.connect();
  }

  /**
   * Disconnect from the gesture detection service
   */
  disconnect(): void {
    wsHub.disconnect();
  }

  /**
   * Select a project for gesture detection
   */
  selectProject(projectId: ProjectType): void {
    this.currentProject = projectId;
    wsHub.selectProject(projectId);
  }

  /**
   * Get the currently selected project
   */
  getCurrentProject(): ProjectType | null {
    return this.currentProject;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Subscribe to gesture data updates
   */
  subscribeToGestureData(callback: GestureDataCallback): () => void {
    this.dataSubscribers.add(callback);
    return () => {
      this.dataSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe to connection status updates
   */
  subscribeToConnectionStatus(callback: ConnectionStatusCallback): () => void {
    this.statusSubscribers.add(callback);
    // Immediately notify with current status
    callback(this.connectionStatus);
    return () => {
      this.statusSubscribers.delete(callback);
    };
  }

  /**
   * Send a command to the gesture service
   */
  sendCommand(command: string, payload?: Record<string, unknown>): void {
    wsHub.send({ type: command, payload });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus.connected;
  }
}

export default GestureService;
