/**
 * Tests for the enhanced WebSocket Manager
 */

import { WebSocketManager } from '../WebSocketManager';
import { GestureData, ProjectType } from '../../types';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Mock send functionality
    console.log('Mock WebSocket send:', data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = new WebSocketManager({
      url: 'ws://localhost:8000/test',
      maxReconnectAttempts: 3,
      baseReconnectDelay: 100,
      maxReconnectDelay: 1000,
      pingInterval: 1000,
      connectionTimeout: 5000,
      messageQueueSize: 10,
    });
  });

  afterEach(() => {
    wsManager.destroy();
  });

  test('should initialize with correct default state', () => {
    const status = wsManager.getConnectionStatus();
    expect(status.connected).toBe(false);
    expect(status.reconnecting).toBe(false);
    expect(status.quality.status).toBe('unknown');
  });

  test('should connect successfully', async () => {
    const connectionPromise = wsManager.connect();
    
    // Wait for connection
    await connectionPromise;
    
    const status = wsManager.getConnectionStatus();
    expect(status.connected).toBe(true);
    expect(status.reconnecting).toBe(false);
  });

  test('should handle project selection', async () => {
    await wsManager.connect();
    
    const project: ProjectType = 'finger_count';
    wsManager.selectProject(project);
    
    expect(wsManager.getCurrentProject()).toBe(project);
  });

  test('should manage subscriptions correctly', async () => {
    await wsManager.connect();
    
    const mockCallback = jest.fn();
    const subscriptionId = wsManager.subscribe(mockCallback);
    
    expect(subscriptionId).toBeDefined();
    expect(typeof subscriptionId).toBe('string');
    
    // Test unsubscribe
    wsManager.unsubscribe(subscriptionId);
  });

  test('should queue messages when disconnected', () => {
    const message = {
      type: 'project_select' as const,
      payload: { project: 'finger_count' },
      timestamp: Date.now(),
      id: 'test_message',
    };
    
    // Send message while disconnected
    wsManager.send(message);
    
    // Message should be queued (we can't directly test the private queue,
    // but we can verify no errors are thrown)
    expect(() => wsManager.send(message)).not.toThrow();
  });

  test('should calculate connection quality correctly', () => {
    const quality = wsManager.getConnectionQuality();
    
    expect(quality).toHaveProperty('status');
    expect(quality).toHaveProperty('score');
    expect(quality).toHaveProperty('factors');
    expect(quality.factors).toHaveProperty('latency');
    expect(quality.factors).toHaveProperty('stability');
    expect(quality.factors).toHaveProperty('throughput');
  });

  test('should handle disconnect properly', async () => {
    await wsManager.connect();
    expect(wsManager.getConnectionStatus().connected).toBe(true);
    
    wsManager.disconnect();
    expect(wsManager.getConnectionStatus().connected).toBe(false);
  });

  test('should support event listeners', async () => {
    const connectionChangeCallback = jest.fn();
    const messageCallback = jest.fn();
    const errorCallback = jest.fn();
    
    wsManager.on('onConnectionChange', connectionChangeCallback);
    wsManager.on('onMessage', messageCallback);
    wsManager.on('onError', errorCallback);
    
    await wsManager.connect();
    
    // Connection change should have been called
    expect(connectionChangeCallback).toHaveBeenCalled();
  });
});