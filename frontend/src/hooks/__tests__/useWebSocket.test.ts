/**
 * Tests for the enhanced useWebSocket hook
 */

import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

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
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('useWebSocket', () => {
  test('should initialize with correct default state', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.connectionStatus.connected).toBe(false);
    expect(result.current.connectionStatus.reconnecting).toBe(false);
    expect(result.current.gestureData).toBe(null);
  });

  test('should provide connection methods', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.reconnect).toBe('function');
    expect(typeof result.current.selectProject).toBe('function');
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.subscribeToProject).toBe('function');
    expect(typeof result.current.getConnectionQuality).toBe('function');
    expect(typeof result.current.getLatency).toBe('function');
    expect(typeof result.current.getCurrentProject).toBe('function');
  });

  test('should handle project selection', async () => {
    const { result } = renderHook(() => useWebSocket());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Wait for connection
    });

    act(() => {
      result.current.selectProject('finger_count');
    });

    expect(result.current.getCurrentProject()).toBe('finger_count');
  });

  test('should provide connection quality information', () => {
    const { result } = renderHook(() => useWebSocket());

    const quality = result.current.getConnectionQuality();
    expect(quality).toHaveProperty('status');
    expect(quality).toHaveProperty('score');
    expect(quality).toHaveProperty('factors');
  });

  test('should handle subscription management', () => {
    const { result } = renderHook(() => useWebSocket());

    const mockCallback = jest.fn();
    let unsubscribe: (() => void) | undefined;

    act(() => {
      unsubscribe = result.current.subscribeToProject(mockCallback, 'finger_count');
    });

    expect(typeof unsubscribe).toBe('function');

    // Test unsubscribe
    act(() => {
      unsubscribe?.();
    });
  });

  test('should handle disconnect and reconnect', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Disconnect
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.gestureData).toBe(null);

    // Reconnect
    await act(async () => {
      await result.current.reconnect();
    });
  });
});