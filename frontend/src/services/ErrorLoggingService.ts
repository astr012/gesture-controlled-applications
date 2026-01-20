/**
 * Centralized Error Logging Service
 * Handles error collection, storage, and reporting with appropriate detail levels
 */

import type { ErrorInfo } from 'react';
import type { ErrorSeverity, ErrorBoundaryLevel, ErrorContext } from '@/components/ui/ErrorBoundary';
import { isProduction } from '@/utils/env';

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  level: ErrorBoundaryLevel;
  severity: ErrorSeverity;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  errorInfo?: {
    componentStack?: string;
  };
  context: ErrorContext;
  userAgent: string;
  url: string;
  viewport: {
    width: number;
    height: number;
  };
  performance?: {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
    timing?: {
      navigationStart: number;
      loadEventEnd: number;
      domContentLoadedEventEnd: number;
    };
  };
  breadcrumbs: BreadcrumbEntry[];
  tags: Record<string, string>;
}

export interface BreadcrumbEntry {
  timestamp: number;
  category: 'navigation' | 'user' | 'console' | 'network' | 'error' | 'system';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface UserActionEntry {
  timestamp: number;
  action: string;
  context: Partial<ErrorContext>;
  level: ErrorBoundaryLevel;
}

class ErrorLoggingService {
  private breadcrumbs: BreadcrumbEntry[] = [];
  private userActions: UserActionEntry[] = [];
  private maxBreadcrumbs = 50;
  private maxUserActions = 100;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Set up navigation tracking
    this.setupNavigationTracking();

    // Set up console tracking
    this.setupConsoleTracking();

    // Load existing breadcrumbs and user actions from storage
    this.loadFromStorage();

    this.isInitialized = true;
    this.addBreadcrumb('system', 'ErrorLoggingService initialized', 'info');
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.addBreadcrumb('error', `Unhandled error: ${event.message}`, 'error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addBreadcrumb('error', `Unhandled promise rejection: ${event.reason}`, 'error', {
        reason: event.reason,
      });
    });
  }

  private setupNavigationTracking() {
    // Track navigation changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      ErrorLoggingService.getInstance().addBreadcrumb(
        'navigation',
        `Navigation to ${window.location.pathname}`,
        'info',
        { url: window.location.href }
      );
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      ErrorLoggingService.getInstance().addBreadcrumb(
        'navigation',
        `Navigation replaced to ${window.location.pathname}`,
        'info',
        { url: window.location.href }
      );
    };

    // Track back/forward navigation
    window.addEventListener('popstate', () => {
      this.addBreadcrumb(
        'navigation',
        `Back/forward navigation to ${window.location.pathname}`,
        'info',
        { url: window.location.href }
      );
    });
  }

  private setupConsoleTracking() {
    // Track console errors and warnings
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      this.addBreadcrumb('console', `Console error: ${args.join(' ')}`, 'error');
    };

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      this.addBreadcrumb('console', `Console warning: ${args.join(' ')}`, 'warning');
    };
  }

  private loadFromStorage() {
    try {
      const storedBreadcrumbs = localStorage.getItem('error-breadcrumbs');
      if (storedBreadcrumbs) {
        this.breadcrumbs = JSON.parse(storedBreadcrumbs).slice(-this.maxBreadcrumbs);
      }

      const storedUserActions = sessionStorage.getItem('user-actions');
      if (storedUserActions) {
        this.userActions = JSON.parse(storedUserActions).slice(-this.maxUserActions);
      }
    } catch (error) {
      console.warn('Failed to load error logging data from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('error-breadcrumbs', JSON.stringify(this.breadcrumbs));
      sessionStorage.setItem('user-actions', JSON.stringify(this.userActions));
    } catch (error) {
      console.warn('Failed to save error logging data to storage:', error);
    }
  }

  addBreadcrumb(
    category: BreadcrumbEntry['category'],
    message: string,
    level: BreadcrumbEntry['level'] = 'info',
    data?: Record<string, any>
  ) {
    const breadcrumb: BreadcrumbEntry = {
      timestamp: Date.now(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    this.saveToStorage();
  }

  logUserAction(action: string, context: Partial<ErrorContext>, level: ErrorBoundaryLevel = 'component') {
    const userAction: UserActionEntry = {
      timestamp: Date.now(),
      action,
      context,
      level,
    };

    this.userActions.push(userAction);

    // Keep only the most recent user actions
    if (this.userActions.length > this.maxUserActions) {
      this.userActions = this.userActions.slice(-this.maxUserActions);
    }

    // Also add as breadcrumb
    this.addBreadcrumb('user', `User action: ${action}`, 'info', context);

    this.saveToStorage();
  }

  logError(
    error: Error,
    errorInfo: ErrorInfo | null,
    context: ErrorContext,
    severity: ErrorSeverity,
    level: ErrorBoundaryLevel = 'component'
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: Date.now(),
      level,
      severity,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: errorInfo ? {
        componentStack: errorInfo.componentStack || undefined,
      } : undefined,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      performance: this.getPerformanceData(),
      breadcrumbs: [...this.breadcrumbs],
      tags: this.generateTags(error, context, level),
    };

    // Log to console with appropriate level
    this.logToConsole(logEntry);

    // Store in localStorage
    this.storeErrorLog(logEntry);

    // Add error as breadcrumb
    this.addBreadcrumb('error', `${level} error: ${error.message}`, 'error', {
      errorId,
      severity,
    });

    // Send to monitoring service in production
    if (isProduction()) {
      this.sendToMonitoringService(logEntry);
    }

    return errorId;
  }

  private getPerformanceData() {
    const performanceData: ErrorLogEntry['performance'] = {};

    // Memory information (Chrome only)
    if ((performance as any).memory) {
      performanceData.memory = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }

    // Navigation timing
    if (performance.timing) {
      performanceData.timing = {
        navigationStart: performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd,
        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
      };
    }

    return performanceData;
  }

  private generateTags(error: Error, context: ErrorContext, level: ErrorBoundaryLevel): Record<string, string> {
    return {
      errorBoundary: level,
      errorType: error.name,
      route: context.route || window.location.pathname,
      project: context.project || 'unknown',
      component: context.component || 'unknown',
      buildVersion: context.buildVersion || 'unknown',
      browser: this.getBrowserName(),
      os: this.getOSName(),
    };
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private logToConsole(logEntry: ErrorLogEntry) {
    const { level, severity, error, context } = logEntry;

    const groupTitle = `🚨 ${level.toUpperCase()} ERROR [${severity.toUpperCase()}]`;
    console.group(groupTitle);
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Breadcrumbs:', logEntry.breadcrumbs.slice(-10)); // Last 10 breadcrumbs
    console.log('User Actions:', this.userActions.slice(-5)); // Last 5 user actions
    console.log('Full Log Entry:', logEntry);
    console.groupEnd();
  }

  private storeErrorLog(logEntry: ErrorLogEntry) {
    try {
      const errorLogs = JSON.parse(localStorage.getItem('error-logs') || '[]');
      errorLogs.push(logEntry);

      // Keep only last 20 error logs
      if (errorLogs.length > 20) {
        errorLogs.splice(0, errorLogs.length - 20);
      }

      localStorage.setItem('error-logs', JSON.stringify(errorLogs));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
  }

  private async sendToMonitoringService(logEntry: ErrorLogEntry) {
    try {
      // In a real application, you would send this to your monitoring service
      // Example: Sentry, LogRocket, Bugsnag, etc.

      // For now, we'll just simulate the API call
      console.log('Sending error to monitoring service:', logEntry.id);

      // Example implementation:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      // });

    } catch (error) {
      console.warn('Failed to send error to monitoring service:', error);
    }
  }

  // Public methods for retrieving error data
  getErrorLogs(): ErrorLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('error-logs') || '[]');
    } catch (error) {
      console.warn('Failed to retrieve error logs:', error);
      return [];
    }
  }

  getBreadcrumbs(): BreadcrumbEntry[] {
    return [...this.breadcrumbs];
  }

  getUserActions(): UserActionEntry[] {
    return [...this.userActions];
  }

  clearErrorLogs() {
    localStorage.removeItem('error-logs');
    localStorage.removeItem('error-breadcrumbs');
    sessionStorage.removeItem('user-actions');
    this.breadcrumbs = [];
    this.userActions = [];
  }

  exportErrorData(): string {
    const exportData = {
      errorLogs: this.getErrorLogs(),
      breadcrumbs: this.getBreadcrumbs(),
      userActions: this.getUserActions(),
      timestamp: new Date().toISOString(),
      version: this.getAppVersion(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  private getAppVersion(): string {
    // Try to get version from import.meta in browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        // eslint-disable-next-line no-eval
        const version = eval('typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_APP_VERSION : null');
        if (version) return version;
      } catch (e) {
        // Fall through to default
      }
    }
    return 'unknown';
  }

  // Singleton pattern
  private static instance: ErrorLoggingService;

  static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }
}

export default ErrorLoggingService;