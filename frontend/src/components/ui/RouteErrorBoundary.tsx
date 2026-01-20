/**
 * Route-level Error Boundary - Handles routing and navigation errors
 * Provides route-specific error handling and recovery options
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary, { type ErrorLogger, type ErrorContext } from './ErrorBoundary';
import type { ErrorInfo } from 'react';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  fallbackRoute?: string;
  logger?: ErrorLogger;
}

// Route-level error logger
class RouteErrorLogger implements ErrorLogger {
  logError(error: Error, errorInfo: ErrorInfo, context: ErrorContext, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const logData = {
      level: 'route',
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
        level: 'route',
      },
      severity,
      timestamp: Date.now(),
      route: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
    };

    console.group('🛣️ ROUTE-LEVEL ERROR');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.log('Route Context:', logData);
    console.groupEnd();

    // Store route errors separately
    try {
      const routeErrors = JSON.parse(localStorage.getItem('route-errors') || '[]');
      routeErrors.push(logData);
      // Keep only last 20 route errors
      if (routeErrors.length > 20) {
        routeErrors.splice(0, routeErrors.length - 20);
      }
      localStorage.setItem('route-errors', JSON.stringify(routeErrors));
    } catch (storageError) {
      console.warn('Failed to store route error:', storageError);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { 
      //   level: severity === 'critical' ? 'fatal' : 'error',
      //   extra: logData,
      //   tags: { errorBoundary: 'route' }
      // });
    }
  }

  logUserAction(action: string, context: Partial<ErrorContext>): void {
    console.log(`👤 Route User Action: ${action}`, context);
  }
}

const RouteErrorBoundaryComponent: React.FC<RouteErrorBoundaryProps> = ({
  children,
  fallbackRoute = '/',
  logger
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeLogger = logger || new RouteErrorLogger();

  const handleRouteError = (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => {
    console.error('Route-level error occurred:', error);

    // Track problematic routes
    try {
      const problemRoutes = JSON.parse(localStorage.getItem('problem-routes') || '{}');
      const currentRoute = location.pathname;
      problemRoutes[currentRoute] = (problemRoutes[currentRoute] || 0) + 1;
      localStorage.setItem('problem-routes', JSON.stringify(problemRoutes));
    } catch (trackError) {
      console.warn('Failed to track problem route:', trackError);
    }
  };

  const handleRetry = () => {
    console.log('Route-level retry initiated');
    // For route errors, we might want to navigate to a safe route
    if (location.pathname !== fallbackRoute) {
      navigate(fallbackRoute, { replace: true });
    } else {
      // If we're already on the fallback route, just reload
      window.location.reload();
    }
  };

  const getRouteSpecificFallback = () => {
    const currentPath = location.pathname;

    // Provide route-specific error messages
    if (currentPath.startsWith('/project/')) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'white',
          borderRadius: '12px',
          margin: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <h2 style={{ color: '#171717', marginBottom: '0.5rem' }}>Project Loading Error</h2>
          <p style={{ color: '#737373', marginBottom: '1.5rem' }}>
            We couldn't load the requested project. This might be due to a missing project file or configuration issue.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/', { replace: true })}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#007aff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f5f5f5',
                color: '#525252',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return null; // Use default error boundary fallback
  };

  return (
    <ErrorBoundary
      level="route"
      context={{
        component: 'RouteErrorBoundary',
        route: location.pathname,
        search: location.search,
        hash: location.hash,
      }}
      onError={handleRouteError}
      onRetry={handleRetry}
      showRetry={true}
      showRefresh={true}
      showReportBug={true}
      logger={routeLogger}
      fallback={getRouteSpecificFallback()}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundaryComponent;