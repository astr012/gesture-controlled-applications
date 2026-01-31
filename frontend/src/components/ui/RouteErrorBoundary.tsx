/**
 * RouteErrorBoundary Component
 *
 * An error boundary for route-level errors.
 * Uses Tailwind CSS for all styling.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
  }

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-warning-100 dark:bg-warning-500/20">
            <svg
              className="w-8 h-8 text-warning-600 dark:text-warning-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Page Error
          </h2>

          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
            There was an error loading this page. Please try again or go back to
            the dashboard.
          </p>

          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="secondary">
              Try Again
            </Button>
            <Button onClick={this.handleGoHome} variant="primary">
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
