/**
 * ProjectErrorBoundary Component
 *
 * An error boundary for project module errors.
 * Uses Tailwind CSS for all styling.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button/Button';

interface Props {
  children: ReactNode;
  projectName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ProjectErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ProjectErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-error-100 dark:bg-error-500/20">
            <svg
              className="w-7 h-7 text-error-600 dark:text-error-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>

          <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {this.props.projectName
              ? `${this.props.projectName} Error`
              : 'Project Error'}
          </h3>

          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Failed to load project component
          </p>

          <Button onClick={this.handleRetry} variant="secondary" size="sm">
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProjectErrorBoundary;
