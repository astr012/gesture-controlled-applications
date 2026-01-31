/**
 * StatusIndicator Component
 *
 * Shows connection and system status.
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';

export type StatusType = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<StatusType, { dot: string; text: string }> = {
  connected: {
    dot: 'bg-success-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    text: 'text-success-600 dark:text-success-400',
  },
  connecting: {
    dot: 'bg-warning-500 animate-pulse',
    text: 'text-warning-600 dark:text-warning-400',
  },
  disconnected: {
    dot: 'bg-neutral-400',
    text: 'text-neutral-500',
  },
  error: {
    dot: 'bg-error-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
    text: 'text-error-600 dark:text-error-400',
  },
};

const statusLabels: Record<StatusType, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',
  error: 'Error',
};

const sizeClasses = {
  sm: { dot: 'w-1.5 h-1.5', text: 'text-xs' },
  md: { dot: 'w-2 h-2', text: 'text-sm' },
  lg: { dot: 'w-3 h-3', text: 'text-base' },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const colors = statusColors[status];
  const sizes = sizeClasses[size];
  const displayLabel = label || statusLabels[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`rounded-full ${sizes.dot} ${colors.dot}`} />
      {showLabel && (
        <span className={`font-medium ${sizes.text} ${colors.text}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
