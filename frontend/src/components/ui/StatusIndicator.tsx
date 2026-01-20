import React from 'react';
import styles from './StatusIndicator.module.css';

export type StatusType = 'connected' | 'connecting' | 'disconnected' | 'error' | 'idle' | 'success' | 'warning';

export interface StatusIndicatorProps {
  status: StatusType;
  showText?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showText = false,
  text,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const getStatusText = (status: StatusType): string => {
    if (text) return text;
    
    const statusTexts: Record<StatusType, string> = {
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected',
      error: 'Error',
      idle: 'Idle',
      success: 'Success',
      warning: 'Warning',
    };
    
    return statusTexts[status];
  };

  const getAriaLabel = (status: StatusType): string => {
    const ariaLabels: Record<StatusType, string> = {
      connected: 'Connection status: Connected',
      connecting: 'Connection status: Connecting',
      disconnected: 'Connection status: Disconnected',
      error: 'Connection status: Error',
      idle: 'Connection status: Idle',
      success: 'Status: Success',
      warning: 'Status: Warning',
    };
    
    return ariaLabels[status];
  };

  const containerClasses = [
    styles.container,
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const dotClasses = [
    styles.dot,
    styles[status],
    pulse && styles.pulse,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} role="status" aria-label={getAriaLabel(status)}>
      <span className={dotClasses} aria-hidden="true"></span>
      {showText && (
        <span className={styles.text}>
          {getStatusText(status)}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;