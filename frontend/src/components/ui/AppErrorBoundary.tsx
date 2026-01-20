/**
 * App-level Error Boundary - Catches catastrophic errors and provides app-wide fallback
 * This is the highest level error boundary that should never fail
 */

import React from 'react';
import ErrorBoundary, { type ErrorLogger, type ErrorContext } from './ErrorBoundary';
import type { ErrorInfo } from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  logger?: ErrorLogger;
}

// App-level error logger with enhanced reporting
class AppErrorLogger implements ErrorLogger {
  logError(error: Error, errorInfo: ErrorInfo, context: ErrorContext, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const logData = {
      level: 'app',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        ...context,
        level: 'app',
      },
      severity,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : undefined,
    };

    // Always log app-level errors to console
    console.group('🚨 APP-LEVEL ERROR');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.log('Context:', context);
    console.log('Full Log Data:', logData);
    console.groupEnd();

    // Store in localStorage for debugging
    try {
      const appErrors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      appErrors.push(logData);
      // Keep only last 10 app errors
      if (appErrors.length > 10) {
        appErrors.splice(0, appErrors.length - 10);
      }
      localStorage.setItem('app-errors', JSON.stringify(appErrors));
    } catch (storageError) {
      console.warn('Failed to store app error:', storageError);
    }

    // In production, send to error monitoring service immediately
    if (process.env.NODE_ENV === 'production') {
      // Critical app errors should be reported immediately
      // Example: Sentry.captureException(error, { 
      //   level: 'fatal',
      //   extra: logData,
      //   tags: { errorBoundary: 'app' }
      // });

      // Also send to analytics
      // Example: analytics.track('App Error', logData);
    }
  }

  logUserAction(action: string, context: Partial<ErrorContext>): void {
    console.log(`👤 App User Action: ${action}`, context);

    // Track user actions in app-level errors for better debugging
    try {
      const userActions = JSON.parse(sessionStorage.getItem('user-actions') || '[]');
      userActions.push({
        action,
        context,
        timestamp: Date.now(),
        level: 'app',
      });
      // Keep only last 50 actions
      if (userActions.length > 50) {
        userActions.splice(0, userActions.length - 50);
      }
      sessionStorage.setItem('user-actions', JSON.stringify(userActions));
    } catch (storageError) {
      console.warn('Failed to store user action:', storageError);
    }
  }
}

const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({
  children,
  logger
}) => {
  const appLogger = logger || new AppErrorLogger();

  const handleAppError = (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => {
    // App-level errors are always critical
    console.error('App-level error occurred:', error);

    // Try to save application state before potential crash
    try {
      const appState = {
        url: window.location.href,
        timestamp: Date.now(),
        error: error.message,
        userAgent: navigator.userAgent,
      };
      localStorage.setItem('last-app-error-state', JSON.stringify(appState));
    } catch (stateError) {
      console.warn('Failed to save app state:', stateError);
    }
  };

  const handleRetry = () => {
    // For app-level errors, we might want to reset more state
    console.log('App-level retry initiated');

    // Clear any potentially corrupted state
    try {
      sessionStorage.removeItem('app-state');
      sessionStorage.removeItem('user-actions');
    } catch (clearError) {
      console.warn('Failed to clear session state:', clearError);
    }
  };

  return (
    <ErrorBoundary
      level="app"
      context={{
        component: 'AppErrorBoundary',
        buildVersion: process.env.REACT_APP_VERSION || 'unknown',
      }}
      onError={handleAppError}
      onRetry={handleRetry}
      showRetry={true}
      showRefresh={true}
      showReportBug={true}
      logger={appLogger}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;