/**
 * Specialized loading states for different async operations
 * Provides context-aware loading indicators with appropriate messaging
 */

import React from 'react';
import LoadingSpinner, { type LoadingSize, type LoadingVariant } from './LoadingSpinner';
import styles from './AsyncLoadingStates.module.css';

// Generic async loading wrapper
interface AsyncLoadingWrapperProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  retryAction?: () => void;
  loadingText?: string;
  size?: LoadingSize;
  variant?: LoadingVariant;
}

export const AsyncLoadingWrapper: React.FC<AsyncLoadingWrapperProps> = ({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
  retryAction,
  loadingText = 'Loading...',
  size = 'md',
  variant = 'spinner',
}) => {
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorMessage}>{error.message}</p>
        {retryAction && (
          <button className={styles.retryButton} onClick={retryAction}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return <LoadingSpinner size={size} variant={variant} text={loadingText} />;
  }

  return <>{children}</>;
};

// WebSocket connection loading
interface WebSocketLoadingProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  onRetry?: () => void;
  showDetails?: boolean;
}

export const WebSocketLoading: React.FC<WebSocketLoadingProps> = ({
  connectionStatus,
  onRetry,
  showDetails = false,
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          icon: '🔌',
          title: 'Connecting to Server',
          message: 'Establishing WebSocket connection...',
          variant: 'spinner' as LoadingVariant,
          showRetry: false,
        };
      case 'reconnecting':
        return {
          icon: '🔄',
          title: 'Reconnecting',
          message: 'Attempting to restore connection...',
          variant: 'pulse' as LoadingVariant,
          showRetry: true,
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Connection Failed',
          message: 'Unable to connect to the gesture control server.',
          variant: 'spinner' as LoadingVariant,
          showRetry: true,
        };
      case 'disconnected':
        return {
          icon: '⚡',
          title: 'Disconnected',
          message: 'Connection to server was lost.',
          variant: 'dots' as LoadingVariant,
          showRetry: true,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config || connectionStatus === 'connected') {
    return null;
  }

  return (
    <div className={styles.websocketLoading}>
      <div className={styles.statusIcon}>{config.icon}</div>
      <h3 className={styles.statusTitle}>{config.title}</h3>
      <p className={styles.statusMessage}>{config.message}</p>

      <LoadingSpinner size="lg" variant={config.variant} />

      {showDetails && (
        <div className={styles.connectionDetails}>
          <div className={styles.detailItem}>
            <span>Status:</span>
            <span className={styles[connectionStatus]}>{connectionStatus}</span>
          </div>
          <div className={styles.detailItem}>
            <span>Server:</span>
            <span>ws://localhost:8000/ws/gestures</span>
          </div>
        </div>
      )}

      {config.showRetry && onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Retry Connection
        </button>
      )}
    </div>
  );
};

// Project loading states
interface ProjectLoadingProps {
  stage: 'discovering' | 'loading' | 'initializing' | 'ready' | 'error';
  projectName?: string;
  progress?: number;
  error?: string;
  onRetry?: () => void;
}

export const ProjectLoading: React.FC<ProjectLoadingProps> = ({
  stage,
  projectName = 'Project',
  progress,
  error,
  onRetry,
}) => {
  const getStageConfig = () => {
    switch (stage) {
      case 'discovering':
        return {
          icon: '🔍',
          title: 'Discovering Projects',
          message: 'Scanning for available gesture projects...',
          variant: 'dots' as LoadingVariant,
        };
      case 'loading':
        return {
          icon: '📦',
          title: `Loading ${projectName}`,
          message: 'Downloading project components...',
          variant: 'spinner' as LoadingVariant,
        };
      case 'initializing':
        return {
          icon: '⚙️',
          title: 'Initializing',
          message: 'Setting up project environment...',
          variant: 'pulse' as LoadingVariant,
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Loading Failed',
          message: error || 'Failed to load project',
          variant: 'spinner' as LoadingVariant,
        };
      default:
        return null;
    }
  };

  const config = getStageConfig();
  if (!config || stage === 'ready') {
    return null;
  }

  return (
    <div className={styles.projectLoading}>
      <div className={styles.statusIcon}>{config.icon}</div>
      <h3 className={styles.statusTitle}>{config.title}</h3>
      <p className={styles.statusMessage}>{config.message}</p>

      {stage !== 'error' && (
        <LoadingSpinner size="lg" variant={config.variant} />
      )}

      {progress !== undefined && (
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Loading progress: ${progress}%`}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {stage === 'error' && onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

// Camera access loading
interface CameraLoadingProps {
  stage: 'requesting' | 'initializing' | 'ready' | 'denied' | 'error';
  onRetry?: () => void;
  onRequestPermission?: () => void;
}

export const CameraLoading: React.FC<CameraLoadingProps> = ({
  stage,
  onRetry,
  onRequestPermission,
}) => {
  const getStageConfig = () => {
    switch (stage) {
      case 'requesting':
        return {
          icon: '📷',
          title: 'Camera Access Required',
          message: 'Please allow camera access to use gesture control.',
          variant: 'pulse' as LoadingVariant,
          showAction: true,
          actionText: 'Grant Permission',
          action: onRequestPermission,
        };
      case 'initializing':
        return {
          icon: '🎥',
          title: 'Initializing Camera',
          message: 'Setting up camera for gesture detection...',
          variant: 'spinner' as LoadingVariant,
          showAction: false,
        };
      case 'denied':
        return {
          icon: '🚫',
          title: 'Camera Access Denied',
          message: 'Camera access is required for gesture control. Please enable it in your browser settings.',
          variant: 'dots' as LoadingVariant,
          showAction: true,
          actionText: 'Try Again',
          action: onRetry,
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Camera Error',
          message: 'Unable to access camera. Please check your camera connection.',
          variant: 'spinner' as LoadingVariant,
          showAction: true,
          actionText: 'Retry',
          action: onRetry,
        };
      default:
        return null;
    }
  };

  const config = getStageConfig();
  if (!config || stage === 'ready') {
    return null;
  }

  return (
    <div className={styles.cameraLoading}>
      <div className={styles.statusIcon}>{config.icon}</div>
      <h3 className={styles.statusTitle}>{config.title}</h3>
      <p className={styles.statusMessage}>{config.message}</p>

      {stage === 'initializing' && (
        <LoadingSpinner size="lg" variant={config.variant} />
      )}

      {config.showAction && config.action && (
        <button className={styles.actionButton} onClick={config.action}>
          {config.actionText}
        </button>
      )}
    </div>
  );
};

// Data loading skeleton
interface SkeletonProps {
  lines?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  lines = 1,
  width = '100%',
  height = '1rem',
  className = '',
}) => {
  return (
    <div className={`${styles.skeleton} ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={styles.skeletonLine}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
          }}
        />
      ))}
    </div>
  );
};

// Page loading overlay
interface PageLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
}

export const PageLoadingOverlay: React.FC<PageLoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  progress,
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.pageOverlay}>
      <div className={styles.overlayContent}>
        <LoadingSpinner size="xl" variant="spinner" />
        <p className={styles.overlayMessage}>{message}</p>
        {progress !== undefined && (
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Loading progress: ${progress}%`}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};