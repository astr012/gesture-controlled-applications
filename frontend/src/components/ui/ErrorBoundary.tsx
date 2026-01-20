import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';
import ErrorLoggingService from '@/services/ErrorLoggingService';

// Error severity levels for different types of errors
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error boundary levels for hierarchical error handling
export type ErrorBoundaryLevel = 'app' | 'route' | 'project' | 'component';

// Error context for better error reporting
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  project?: string;
  component?: string;
  userAgent?: string;
  timestamp: number;
  buildVersion?: string;
}

// Enhanced error logging interface
export interface ErrorLogger {
  logError: (error: Error, errorInfo: ErrorInfo, context: ErrorContext, severity: ErrorSeverity) => void;
  logUserAction: (action: string, context: Partial<ErrorContext>) => void;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: ErrorBoundaryLevel;
  context?: Partial<ErrorContext>;
  onError?: (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => void;
  onRetry?: () => void;
  showRetry?: boolean;
  showRefresh?: boolean;
  showReportBug?: boolean;
  logger?: ErrorLogger;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  severity: ErrorSeverity;
  userFeedback: string;
  isReporting: boolean;
}

// Default error logger implementation that uses ErrorLoggingService
class DefaultErrorLogger implements ErrorLogger {
  private level: ErrorBoundaryLevel;

  constructor(level: ErrorBoundaryLevel = 'component') {
    this.level = level;
  }

  logError(error: Error, errorInfo: ErrorInfo, context: ErrorContext, severity: ErrorSeverity): void {
    // Use the centralized ErrorLoggingService for dual-level logging
    const errorLoggingService = ErrorLoggingService.getInstance();
    errorLoggingService.logError(error, errorInfo, context, severity, this.level);
  }

  logUserAction(action: string, context: Partial<ErrorContext>): void {
    const errorLoggingService = ErrorLoggingService.getInstance();
    errorLoggingService.logUserAction(action, context, this.level);
  }
}

class ErrorBoundary extends Component<Props, State> {
  private logger: ErrorLogger;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      severity: 'medium',
      userFeedback: '',
      isReporting: false,
    };

    this.logger = props.logger || new DefaultErrorLogger(props.level || 'component');
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const severity = ErrorBoundary.determineSeverity(error);
    
    return {
      hasError: true,
      error,
      errorId,
      severity,
    };
  }

  static determineSeverity(error: Error): ErrorSeverity {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Critical errors that break the entire app
    if (errorName.includes('syntaxerror') || 
        errorName.includes('referenceerror') ||
        errorMessage.includes('chunk load failed') ||
        errorMessage.includes('loading chunk')) {
      return 'critical';
    }

    // High severity errors that break major functionality
    if (errorMessage.includes('network') ||
        errorMessage.includes('websocket') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout')) {
      return 'high';
    }

    // Medium severity for component errors
    if (errorMessage.includes('render') ||
        errorMessage.includes('component') ||
        errorMessage.includes('hook')) {
      return 'medium';
    }

    // Low severity for minor issues
    return 'low';
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Build error context
    const context: ErrorContext = {
      timestamp: Date.now(),
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      buildVersion: process.env.REACT_APP_VERSION || 'unknown',
      sessionId: this.getSessionId(),
      component: this.props.level || 'component',
      ...this.props.context,
    };

    // Log the error using ErrorLoggingService for dual-level logging
    this.logger.logError(error, errorInfo, context, this.state.severity);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo, context);
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  }

  handleRetry = () => {
    this.logger.logUserAction('error_boundary_retry', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: this.state.retryCount + 1,
      userFeedback: '',
    });

    this.props.onRetry?.();
  };

  handleRefresh = () => {
    this.logger.logUserAction('error_boundary_refresh', {
      errorId: this.state.errorId,
    });
    window.location.reload();
  };

  handleReportBug = async () => {
    if (this.state.isReporting) return;

    this.setState({ isReporting: true });

    try {
      this.logger.logUserAction('error_boundary_report_bug', {
        errorId: this.state.errorId,
        userFeedback: this.state.userFeedback,
      });

      // Simulate bug report submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success message
      alert('Thank you for reporting this issue. We\'ll investigate it promptly.');
    } catch (reportError) {
      console.error('Failed to report bug:', reportError);
      alert('Failed to submit bug report. Please try again later.');
    } finally {
      this.setState({ isReporting: false });
    }
  };

  handleFeedbackChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ userFeedback: event.target.value });
  };

  private getErrorMessage(): { title: string; message: string; icon: string } {
    const { severity, error } = this.state;
    const { level = 'component' } = this.props;

    switch (severity) {
      case 'critical':
        return {
          icon: '💥',
          title: 'Critical Error',
          message: 'A critical error occurred that prevents the application from working properly. Please refresh the page or contact support if the issue persists.',
        };
      case 'high':
        return {
          icon: '🚨',
          title: 'Connection Error',
          message: 'There was a problem connecting to our services. Please check your internet connection and try again.',
        };
      case 'medium':
        return {
          icon: '⚠️',
          title: level === 'app' ? 'Application Error' : 'Something went wrong',
          message: level === 'app' 
            ? 'An unexpected error occurred in the application. We\'re working to fix this issue.'
            : 'We encountered an unexpected problem. Please try again or refresh the page.',
        };
      case 'low':
      default:
        return {
          icon: '⚡',
          title: 'Minor Issue',
          message: 'A minor issue occurred, but you should be able to continue using the application.',
        };
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, message, icon } = this.getErrorMessage();
      const { 
        showRetry = true, 
        showRefresh = true, 
        showReportBug = true,
        level = 'component'
      } = this.props;

      return (
        <div className={`${styles.container} ${styles[this.state.severity]}`}>
          <div className={styles.content}>
            <div className={styles.icon}>{icon}</div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>

            {/* Retry count indicator */}
            {this.state.retryCount > 0 && (
              <p className={styles.retryCount}>
                Retry attempts: {this.state.retryCount}
              </p>
            )}

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.details}>
                <summary>Error Details (Development)</summary>
                <div className={styles.errorDetails}>
                  <div className={styles.errorSection}>
                    <strong>Error:</strong>
                    <pre className={styles.errorText}>{this.state.error.toString()}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div className={styles.errorSection}>
                      <strong>Component Stack:</strong>
                      <pre className={styles.errorText}>{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                  <div className={styles.errorSection}>
                    <strong>Context:</strong>
                    <pre className={styles.errorText}>
                      {JSON.stringify({
                        level,
                        severity: this.state.severity,
                        route: window.location.pathname,
                        timestamp: new Date().toISOString(),
                        ...this.props.context,
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            {/* Bug report section */}
            {showReportBug && this.state.severity !== 'low' && (
              <div className={styles.reportSection}>
                <textarea
                  className={styles.feedbackTextarea}
                  placeholder="Describe what you were doing when this error occurred (optional)"
                  value={this.state.userFeedback}
                  onChange={this.handleFeedbackChange}
                  rows={3}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.actions}>
              {showRetry && this.state.retryCount < 3 && (
                <button 
                  className={styles.retryButton} 
                  onClick={this.handleRetry}
                  disabled={this.state.isReporting}
                >
                  Try Again
                </button>
              )}
              {showRefresh && (
                <button
                  className={styles.refreshButton}
                  onClick={this.handleRefresh}
                  disabled={this.state.isReporting}
                >
                  Refresh Page
                </button>
              )}
              {showReportBug && this.state.severity !== 'low' && (
                <button
                  className={styles.reportButton}
                  onClick={this.handleReportBug}
                  disabled={this.state.isReporting}
                >
                  {this.state.isReporting ? 'Reporting...' : 'Report Bug'}
                </button>
              )}
            </div>

            {/* Error ID for support */}
            <div className={styles.errorMeta}>
              <p className={styles.errorId}>Error ID: {this.state.errorId}</p>
              <p className={styles.timestamp}>
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
