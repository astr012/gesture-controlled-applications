/**
 * Enhanced WebSocket Manager with connection quality monitoring,
 * automatic reconnection, message queuing, and project-specific routing
 */

import type {
  WebSocketMessage,
  ConnectionStatus,
  ConnectionQuality,
  GestureData,
  ProjectType
} from '../types';
import PerformanceMonitor from './PerformanceMonitor';

export interface WebSocketManagerConfig {
  url: string;
  maxReconnectAttempts: number;
  baseReconnectDelay: number;
  maxReconnectDelay: number;
  pingInterval: number;
  connectionTimeout: number;
  messageQueueSize: number;
}

export interface WebSocketSubscription {
  id: string;
  callback: (data: GestureData) => void;
  project?: ProjectType;
}

export interface WebSocketManagerEvents {
  onConnectionChange: (status: ConnectionStatus) => void;
  onMessage: (data: GestureData) => void;
  onError: (error: Error) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketManagerConfig;
  private subscriptions = new Map<string, WebSocketSubscription>();
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setTimeout> | null = null;
  private connectionStartTime = 0;
  private lastPingTime = 0;
  private currentLatency = 0;
  private connectionQuality: ConnectionQuality = {
    status: 'unknown',
    score: 0,
    factors: {
      latency: 0,
      stability: 0,
      throughput: 0,
    },
  };
  private currentProject: ProjectType | null = null;
  private events: Partial<WebSocketManagerEvents> = {};
  private performanceMonitor: PerformanceMonitor;

  constructor(config: Partial<WebSocketManagerConfig> = {}) {
    this.config = {
      url: 'ws://localhost:8000/ws/gestures',
      maxReconnectAttempts: 10,
      baseReconnectDelay: 1000,
      maxReconnectDelay: 30000,
      pingInterval: 30000,
      connectionTimeout: 10000,
      messageQueueSize: 100,
      ...config,
    };

    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  // Event management
  on<K extends keyof WebSocketManagerEvents>(
    event: K,
    callback: WebSocketManagerEvents[K]
  ): void {
    this.events[event] = callback;
  }

  off<K extends keyof WebSocketManagerEvents>(event: K): void {
    delete this.events[event];
  }

  // Connection lifecycle
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        this.connectionStartTime = Date.now();

        const connectionTimeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error('Connection timeout'));
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.startPingInterval();
          this.flushMessageQueue();
          this.updateConnectionStatus();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.handleClose(event);
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.handleError(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearReconnectTimeout();
    this.clearPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.updateConnectionStatus();
  }

  async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.reconnectAttempts = 0;
    return this.connect();
  }

  // Message handling
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message:', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send queued message:', error);
          this.messageQueue.unshift(message); // Put it back at the front
          break;
        }
      }
    }
  }

  // Project management
  selectProject(project: ProjectType): void {
    this.currentProject = project;
    this.send({
      type: 'project_select',
      payload: { project },
      timestamp: Date.now(),
      id: `project_select_${Date.now()}`,
    });
  }

  getCurrentProject(): ProjectType | null {
    return this.currentProject;
  }

  // Subscription management
  subscribe(callback: (data: GestureData) => void, project?: ProjectType): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.subscriptions.set(id, { id, callback, project });
    return id;
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
  }

  // Connection monitoring
  getConnectionStatus(): ConnectionStatus {
    const connected = this.ws?.readyState === WebSocket.OPEN;
    const reconnecting = this.reconnectTimeout !== null;
    const uptime = connected ? Date.now() - this.connectionStartTime : 0;

    return {
      connected,
      reconnecting,
      quality: this.connectionQuality,
      latency: this.currentLatency,
      uptime,
    };
  }

  getConnectionQuality(): ConnectionQuality {
    return { ...this.connectionQuality };
  }

  getLatency(): number {
    return this.currentLatency;
  }

  // Private methods
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Handle pong messages for latency calculation
      if (data.type === 'pong') {
        this.currentLatency = Date.now() - this.lastPingTime;
        this.updateConnectionQuality();

        // Record latency in performance monitor
        this.performanceMonitor.recordWebSocketLatency(this.currentLatency);
        return;
      }

      // Handle error messages
      if (data.error) {
        const error = new Error(data.error);
        this.events.onError?.(error);
        return;
      }

      // Route message to appropriate subscribers
      this.routeMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.events.onError?.(new Error('Failed to parse message'));
    }
  }

  private routeMessage(data: GestureData): void {
    // Notify all subscribers
    this.subscriptions.forEach((subscription) => {
      // If subscription has project filter, only send matching messages
      if (!subscription.project || subscription.project === data.project) {
        try {
          subscription.callback(data);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });

    // Notify global message handler
    this.events.onMessage?.(data);
  }

  private handleClose(event: CloseEvent): void {
    this.clearPingInterval();
    this.ws = null;

    // Don't reconnect if it was a manual close
    if (event.code === 1000) {
      this.updateConnectionStatus();
      return;
    }

    // Attempt automatic reconnection
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.events.onError?.(new Error('Max reconnection attempts reached'));
    }

    this.updateConnectionStatus();
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.events.onError?.(new Error('WebSocket connection error'));
    this.updateConnectionStatus();
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimeout();

    // Exponential backoff with jitter
    const delay = Math.min(
      this.config.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );
    const jitter = delay * 0.1 * Math.random();
    const finalDelay = delay + jitter;

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleClose(new CloseEvent('close', { code: 1006 }));
      }
    }, finalDelay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private startPingInterval(): void {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.send({
          type: 'ping',
          payload: {},
          timestamp: this.lastPingTime,
          id: `ping_${this.lastPingTime}`,
        });
      }
    }, this.config.pingInterval);
  }

  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private updateConnectionQuality(): void {
    const latencyScore = this.calculateLatencyScore(this.currentLatency);
    const stabilityScore = this.calculateStabilityScore();
    const throughputScore = 100; // Simplified for now

    this.connectionQuality = {
      status: this.getQualityStatus(latencyScore, stabilityScore),
      score: Math.round((latencyScore + stabilityScore + throughputScore) / 3),
      factors: {
        latency: this.currentLatency,
        stability: stabilityScore,
        throughput: throughputScore,
      },
    };
  }

  private calculateLatencyScore(latency: number): number {
    if (latency === 0) return 100;
    if (latency < 50) return 100;
    if (latency < 100) return 90;
    if (latency < 200) return 75;
    if (latency < 500) return 50;
    return 25;
  }

  private calculateStabilityScore(): number {
    // Simplified stability calculation based on reconnection attempts
    const maxAttempts = this.config.maxReconnectAttempts;
    const stability = Math.max(0, 100 - (this.reconnectAttempts / maxAttempts) * 100);
    return Math.round(stability);
  }

  private getQualityStatus(latencyScore: number, stabilityScore: number): ConnectionQuality['status'] {
    const averageScore = (latencyScore + stabilityScore) / 2;
    if (averageScore >= 90) return 'excellent';
    if (averageScore >= 70) return 'good';
    if (averageScore >= 40) return 'poor';
    return 'unknown';
  }

  private updateConnectionStatus(): void {
    const status = this.getConnectionStatus();
    this.events.onConnectionChange?.(status);
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.subscriptions.clear();
    this.messageQueue.length = 0;
    this.events = {};
  }
}