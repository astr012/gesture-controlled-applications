/**
 * Comprehensive Performance Monitoring Service
 * Tracks application performance metrics, bundle loading, and user experience
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Custom metrics
  componentRenderTime: Map<string, number[]>;
  routeLoadTime: Map<string, number>;
  bundleLoadTime: Map<string, number>;
  webSocketLatency: number[];
  memoryUsage: MemoryInfo[];
  
  // User interaction metrics
  interactionLatency: number[];
  errorCount: number;
  sessionDuration: number;
  
  // Performance scores
  performanceScore: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  seoScore?: number;
}

export interface MemoryInfo {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  [key: string]: any;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[] = [];
  private timers: Map<string, number> = new Map();
  private sessionStartTime: number;
  private isEnabled: boolean;

  private constructor() {
    this.sessionStartTime = performance.now();
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('performance-monitoring') === 'true';
    
    this.metrics = {
      componentRenderTime: new Map(),
      routeLoadTime: new Map(),
      bundleLoadTime: new Map(),
      webSocketLatency: [],
      memoryUsage: [],
      interactionLatency: [],
      errorCount: 0,
      sessionDuration: 0,
      performanceScore: 0,
    };

    if (this.isEnabled) {
      this.initializeObservers();
      this.startMemoryMonitoring();
      this.measureCoreWebVitals();
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Core Web Vitals measurement
  private measureCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.startTime;
          this.logMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.logMetric('FID', this.metrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.logMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.logMetric('FCP', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (error) {
        console.warn('FCP observer not supported:', error);
      }
    }

    // Navigation timing for TTFB
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      this.metrics.ttfb = ttfb;
      this.logMetric('TTFB', ttfb);
    }
  }

  private initializeObservers(): void {
    if ('PerformanceObserver' in window) {
      // Resource loading observer
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes('.js') || entry.name.includes('.css')) {
              const bundleName = this.extractBundleName(entry.name);
              this.metrics.bundleLoadTime.set(bundleName, entry.duration);
              this.logMetric(`Bundle Load: ${bundleName}`, entry.duration);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      // Navigation observer
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.logMetric('Navigation', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive - entry.navigationStart,
            });
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }
    }
  }

  private startMemoryMonitoring(): void {
    if ((performance as any).memory) {
      const collectMemoryInfo = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });

        // Keep only last 100 entries
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
        }
      };

      // Collect memory info every 30 seconds
      setInterval(collectMemoryInfo, 30000);
      collectMemoryInfo(); // Initial collection
    }
  }

  // Component performance tracking
  startComponentRender(componentName: string): string {
    const timerId = `${componentName}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, performance.now());
    return timerId;
  }

  endComponentRender(timerId: string, componentName: string): number {
    const startTime = this.timers.get(timerId);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.timers.delete(timerId);

    // Store component render time
    if (!this.metrics.componentRenderTime.has(componentName)) {
      this.metrics.componentRenderTime.set(componentName, []);
    }
    const times = this.metrics.componentRenderTime.get(componentName)!;
    times.push(duration);

    // Keep only last 50 render times per component
    if (times.length > 50) {
      times.splice(0, times.length - 50);
    }

    this.logMetric(`Component Render: ${componentName}`, duration);
    return duration;
  }

  // Route performance tracking
  measureRouteLoad(routeName: string, startTime: number): void {
    const duration = performance.now() - startTime;
    this.metrics.routeLoadTime.set(routeName, duration);
    this.logMetric(`Route Load: ${routeName}`, duration);
  }

  // WebSocket latency tracking
  recordWebSocketLatency(latency: number): void {
    this.metrics.webSocketLatency.push(latency);
    
    // Keep only last 100 latency measurements
    if (this.metrics.webSocketLatency.length > 100) {
      this.metrics.webSocketLatency = this.metrics.webSocketLatency.slice(-100);
    }

    this.logMetric('WebSocket Latency', latency);
  }

  // Interaction latency tracking
  recordInteractionLatency(latency: number): void {
    this.metrics.interactionLatency.push(latency);
    
    // Keep only last 100 interaction measurements
    if (this.metrics.interactionLatency.length > 100) {
      this.metrics.interactionLatency = this.metrics.interactionLatency.slice(-100);
    }

    this.logMetric('Interaction Latency', latency);
  }

  // Error tracking
  recordError(): void {
    this.metrics.errorCount++;
    this.logMetric('Error Count', this.metrics.errorCount);
  }

  // Performance score calculation
  calculatePerformanceScore(): number {
    let score = 100;

    // Deduct points based on Core Web Vitals
    if (this.metrics.lcp && this.metrics.lcp > 2500) score -= 20;
    if (this.metrics.fid && this.metrics.fid > 100) score -= 20;
    if (this.metrics.cls && this.metrics.cls > 0.1) score -= 20;
    if (this.metrics.fcp && this.metrics.fcp > 1800) score -= 10;
    if (this.metrics.ttfb && this.metrics.ttfb > 600) score -= 10;

    // Deduct points for slow component renders
    const avgComponentRenderTime = this.getAverageComponentRenderTime();
    if (avgComponentRenderTime > 16) score -= 10; // 60fps threshold

    // Deduct points for slow route loads
    const avgRouteLoadTime = this.getAverageRouteLoadTime();
    if (avgRouteLoadTime > 300) score -= 10;

    // Deduct points for high WebSocket latency
    const avgWebSocketLatency = this.getAverageWebSocketLatency();
    if (avgWebSocketLatency > 100) score -= 5;

    // Deduct points for errors
    if (this.metrics.errorCount > 0) score -= this.metrics.errorCount * 2;

    this.metrics.performanceScore = Math.max(0, score);
    return this.metrics.performanceScore;
  }

  // Utility methods
  private extractBundleName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0]; // Remove query parameters
  }

  private getAverageComponentRenderTime(): number {
    let totalTime = 0;
    let totalCount = 0;

    this.metrics.componentRenderTime.forEach((times) => {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalCount += times.length;
    });

    return totalCount > 0 ? totalTime / totalCount : 0;
  }

  private getAverageRouteLoadTime(): number {
    const times = Array.from(this.metrics.routeLoadTime.values());
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  private getAverageWebSocketLatency(): number {
    const latencies = this.metrics.webSocketLatency;
    return latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
  }

  private logMetric(name: string, value: any): void {
    if (this.isEnabled) {
      console.log(`⚡ [PERF] ${name}:`, value);
    }
  }

  // Public API
  getMetrics(): PerformanceMetrics {
    this.metrics.sessionDuration = performance.now() - this.sessionStartTime;
    this.calculatePerformanceScore();
    return { ...this.metrics };
  }

  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metrics,
    }, null, 2);
  }

  // Enable/disable monitoring
  enable(): void {
    this.isEnabled = true;
    localStorage.setItem('performance-monitoring', 'true');
  }

  disable(): void {
    this.isEnabled = false;
    localStorage.removeItem('performance-monitoring');
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.timers.clear();
  }
}

import React from 'react';

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    const timerId = monitor.startComponentRender(componentName);
    
    return () => {
      monitor.endComponentRender(timerId, componentName);
    };
  });
}

// HOC for component performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const TrackedComponent = React.memo((props: P) => {
    usePerformanceTracking(displayName);
    return <WrappedComponent {...props} />;
  });

  TrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  return TrackedComponent;
}

export default PerformanceMonitor;