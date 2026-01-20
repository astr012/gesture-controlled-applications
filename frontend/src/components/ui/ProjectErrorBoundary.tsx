/**
 * Project-level Error Boundary - Isolates project-specific failures
 * Provides project-specific error handling and fallback options
 */

import React from 'react';
import ErrorBoundary, { type ErrorLogger, type ErrorContext } from './ErrorBoundary';
import type { ErrorInfo } from 'react';
import type { ProjectType } from '@/types';

interface ProjectErrorBoundaryProps {
  children: React.ReactNode;
  projectId: ProjectType;
  projectName?: string;
  onProjectError?: (projectId: ProjectType, error: Error) => void;
  logger?: ErrorLogger;
}

// Project-level error logger
class ProjectErrorLogger implements ErrorLogger {
  constructor(private projectId: ProjectType) { }

  logError(error: Error, errorInfo: ErrorInfo, context: ErrorContext, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const logData = {
      level: 'project',
      projectId: this.projectId,
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
        level: 'project',
        project: this.projectId,
      },
      severity,
      timestamp: Date.now(),
      projectMetadata: this.getProjectMetadata(),
    };

    console.group(`🎯 PROJECT-LEVEL ERROR [${this.projectId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.log('Project Context:', logData);
    console.groupEnd();

    // Store project-specific errors
    try {
      const projectErrors = JSON.parse(localStorage.getItem('project-errors') || '{}');
      if (!projectErrors[this.projectId]) {
        projectErrors[this.projectId] = [];
      }
      projectErrors[this.projectId].push(logData);

      // Keep only last 10 errors per project
      if (projectErrors[this.projectId].length > 10) {
        projectErrors[this.projectId].splice(0, projectErrors[this.projectId].length - 10);
      }

      localStorage.setItem('project-errors', JSON.stringify(projectErrors));
    } catch (storageError) {
      console.warn('Failed to store project error:', storageError);
    }

    // Track project reliability
    this.updateProjectReliability(false);

    // In production, send to monitoring service with project context
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { 
      //   level: severity === 'critical' ? 'fatal' : 'error',
      //   extra: logData,
      //   tags: { 
      //     errorBoundary: 'project',
      //     projectId: this.projectId
      //   }
      // });
    }
  }

  logUserAction(action: string, context: Partial<ErrorContext>): void {
    console.log(`👤 Project User Action [${this.projectId}]: ${action}`, context);
  }

  private getProjectMetadata() {
    try {
      // Try to get project metadata from registry
      const projectRegistry = JSON.parse(localStorage.getItem('project-registry') || '[]');
      const project = projectRegistry.find((p: any) => p.id === this.projectId);
      return project ? {
        name: project.name,
        version: project.version,
        category: project.category,
        enabled: project.enabled,
      } : null;
    } catch (error) {
      return null;
    }
  }

  private updateProjectReliability(success: boolean) {
    try {
      const reliability = JSON.parse(localStorage.getItem('project-reliability') || '{}');
      if (!reliability[this.projectId]) {
        reliability[this.projectId] = { successes: 0, failures: 0, lastUpdated: Date.now() };
      }

      if (success) {
        reliability[this.projectId].successes++;
      } else {
        reliability[this.projectId].failures++;
      }

      reliability[this.projectId].lastUpdated = Date.now();
      localStorage.setItem('project-reliability', JSON.stringify(reliability));
    } catch (error) {
      console.warn('Failed to update project reliability:', error);
    }
  }
}

const ProjectErrorBoundary: React.FC<ProjectErrorBoundaryProps> = ({
  children,
  projectId,
  projectName,
  onProjectError,
  logger
}) => {
  const projectLogger = logger || new ProjectErrorLogger(projectId);

  const handleProjectError = (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => {
    console.error(`Project-level error in ${projectId}:`, error);

    // Notify parent component about project error
    onProjectError?.(projectId, error);

    // Track project-specific error patterns
    try {
      const errorPatterns = JSON.parse(localStorage.getItem('project-error-patterns') || '{}');
      const errorKey = `${error.name}:${error.message.substring(0, 50)}`;

      if (!errorPatterns[projectId]) {
        errorPatterns[projectId] = {};
      }

      errorPatterns[projectId][errorKey] = (errorPatterns[projectId][errorKey] || 0) + 1;
      localStorage.setItem('project-error-patterns', JSON.stringify(errorPatterns));
    } catch (trackError) {
      console.warn('Failed to track error patterns:', trackError);
    }
  };

  const handleRetry = () => {
    console.log(`Project-level retry initiated for ${projectId}`);

    // Clear project-specific state that might be corrupted
    try {
      const projectState = JSON.parse(sessionStorage.getItem('project-state') || '{}');
      delete projectState[projectId];
      sessionStorage.setItem('project-state', JSON.stringify(projectState));
    } catch (clearError) {
      console.warn('Failed to clear project state:', clearError);
    }
  };

  const getProjectSpecificFallback = () => {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'white',
        borderRadius: '12px',
        margin: '1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        borderLeft: '4px solid #ff9500'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
        <h2 style={{ color: '#171717', marginBottom: '0.5rem' }}>
          {projectName || projectId} Error
        </h2>
        <p style={{ color: '#737373', marginBottom: '1.5rem' }}>
          This project encountered an error and couldn't load properly.
          You can try reloading the project or return to the dashboard.
        </p>

        {/* Project-specific error recovery options */}
        <div style={{
          background: '#f8f9fa',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#525252' }}>Troubleshooting Tips:</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#737373', fontSize: '0.875rem' }}>
            <li>Check if your camera is connected and accessible</li>
            <li>Ensure no other applications are using the camera</li>
            <li>Try refreshing the page to reload the project</li>
            <li>Check your browser's developer console for more details</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleRetry}
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
            Retry Project
          </button>
          <button
            onClick={() => window.location.href = '/'}
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
            Go to Dashboard
          </button>
        </div>

        <div style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: '#a3a3a3',
          fontFamily: 'monospace'
        }}>
          Project: {projectId} | {new Date().toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      level="project"
      context={{
        component: 'ProjectErrorBoundary',
        project: projectId,
        projectName: projectName || projectId,
      }}
      onError={handleProjectError}
      onRetry={handleRetry}
      showRetry={true}
      showRefresh={false} // Don't show refresh for project errors
      showReportBug={true}
      logger={projectLogger}
      fallback={getProjectSpecificFallback()}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ProjectErrorBoundary;