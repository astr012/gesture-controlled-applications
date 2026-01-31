/**
 * AppErrorBoundary Component
 *
 * A top-level error boundary for the entire application.
 * Uses Tailwind CSS for all styling.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-error-100 dark:bg-error-500/20">
              <svg
                className="w-10 h-10 text-error-600 dark:text-error-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Application Error
            </h1>

            <p className="mb-6 text-neutral-600 dark:text-neutral-400">
              Something went wrong. Please try refreshing the page.
            </p>

            <div className="p-4 mb-6 text-left bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
