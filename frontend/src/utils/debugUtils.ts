/**
 * Debug utilities for development environment
 * These utilities help developers monitor state changes, performance, and debug issues
 */

import React from 'react';
import type { GlobalState } from '@/context/GlobalContext';
import type { ProjectState } from '@/context/ProjectContext';

// Global debug flag
export const isDebugMode = process.env.NODE_ENV === 'development';

// Debug logger with different levels
export const debugLogger = {
  info: (message: string, data?: unknown) => {
    if (isDebugMode) {
      console.log(`🔍 [DEBUG] ${message}`, data);
    }
  },

  warn: (message: string, data?: unknown) => {
    if (isDebugMode) {
      console.warn(`⚠️ [DEBUG] ${message}`, data);
    }
  },

  error: (message: string, data?: unknown) => {
    if (isDebugMode) {
      console.error(`❌ [DEBUG] ${message}`, data);
    }
  },

  performance: (message: string, data?: unknown) => {
    if (isDebugMode) {
      console.log(`⚡ [PERF] ${message}`, data);
    }
  },

  state: (message: string, data?: unknown) => {
    if (isDebugMode) {
      console.log(`🔄 [STATE] ${message}`, data);
    }
  },
};

// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static start(label: string): void {
    if (isDebugMode) {
      this.timers.set(label, performance.now());
    }
  }

  static end(label: string): number {
    if (!isDebugMode) return 0;

    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      debugLogger.warn(`Timer "${label}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    debugLogger.performance(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    if (!isDebugMode) return fn();

    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
}

// State diff utility
export function getStateDiff<T extends Record<string, unknown>>(
  prevState: T,
  newState: T
): { changed: string[]; added: string[]; removed: string[] } {
  const prevKeys = Object.keys(prevState);
  const newKeys = Object.keys(newState);

  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  // Find changed and removed keys
  prevKeys.forEach(key => {
    if (!(key in newState)) {
      removed.push(key);
    } else if (JSON.stringify(prevState[key]) !== JSON.stringify(newState[key])) {
      changed.push(key);
    }
  });

  // Find added keys
  newKeys.forEach(key => {
    if (!(key in prevState)) {
      added.push(key);
    }
  });

  return { changed, added, removed };
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if (!isDebugMode || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
    total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
    percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
  };
}

// Component render tracking
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  if (!isDebugMode) return Component;

  return function TrackedComponent(props: P) {
    const renderStart = performance.now();

    React.useEffect(() => {
      const renderTime = performance.now() - renderStart;
      debugLogger.performance(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    });

    return React.createElement(Component, props);
  };
}

// Local storage debugging
export const localStorageDebug = {
  inspect: () => {
    if (!isDebugMode) return;

    const keys = Object.keys(localStorage);
    const data: Record<string, unknown> = {};

    keys.forEach(key => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    });

    console.table(data);
  },

  clear: (prefix?: string) => {
    if (!isDebugMode) return;

    const keys = Object.keys(localStorage);
    const keysToRemove = prefix
      ? keys.filter(key => key.startsWith(prefix))
      : keys;

    keysToRemove.forEach(key => localStorage.removeItem(key));
    debugLogger.info(`Cleared ${keysToRemove.length} localStorage items`);
  },

  backup: () => {
    if (!isDebugMode) return '';

    const data: Record<string, string | null> = {};
    Object.keys(localStorage).forEach(key => {
      data[key] = localStorage.getItem(key);
    });

    return JSON.stringify(data, null, 2);
  },

  restore: (backup: string) => {
    if (!isDebugMode) return;

    try {
      const data = JSON.parse(backup);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      });
      debugLogger.info('LocalStorage restored from backup');
    } catch (error) {
      debugLogger.error('Failed to restore localStorage backup', error);
    }
  },
};

// WebSocket debugging
export const webSocketDebug = {
  logMessage: (direction: 'sent' | 'received', message: unknown) => {
    if (!isDebugMode) return;

    const emoji = direction === 'sent' ? '📤' : '📥';
    debugLogger.info(`${emoji} WebSocket ${direction}:`, message);
  },

  logConnection: (event: 'open' | 'close' | 'error', data?: unknown) => {
    if (!isDebugMode) return;

    const emojis = { open: '🔗', close: '🔌', error: '💥' };
    debugLogger.info(`${emojis[event]} WebSocket ${event}`, data);
  },
};

// Global debug object for browser console access
if (isDebugMode && typeof window !== 'undefined') {
  (window as any).__DEBUG__ = {
    logger: debugLogger,
    performance: PerformanceMonitor,
    getStateDiff,
    getMemoryUsage,
    localStorage: localStorageDebug,
    webSocket: webSocketDebug,
  };

  console.log('🔧 Debug utilities available at window.__DEBUG__');
}