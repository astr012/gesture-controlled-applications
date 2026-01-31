/**
 * ErrorBoundary Component
 *
 * A generic error boundary with retry functionality.
 * Uses Tailwind CSS for all styling.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './Button/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-error-100 dark:bg-error-500/20">
            <svg
              className="w-8 h-8 text-error-600 dark:text-error-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Something went wrong
          </h2>

          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>

          <Button onClick={this.handleRetry} variant="primary">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
