// Enhanced connection status
export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  quality: ConnectionQuality;
  latency: number;
  uptime: number;
}

// Connection quality metrics
export interface ConnectionQuality {
  status: 'excellent' | 'good' | 'poor' | 'unknown';
  score: number; // 0-100
  factors: {
    latency: number;
    stability: number;
    throughput: number;
  };
}

// Message types with enhanced metadata
export interface WebSocketMessage {
  type: 'project_select' | 'settings_update' | 'ping' | 'pong' | 'error';
  payload: unknown;
  timestamp: number;
  id: string;
}

// WebSocket event types
export type WebSocketEventType =
  | 'open'
  | 'close'
  | 'error'
  | 'message'
  | 'reconnect'
  | 'reconnect_failed';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data?: unknown;
  error?: Error;
  timestamp: number;
}
