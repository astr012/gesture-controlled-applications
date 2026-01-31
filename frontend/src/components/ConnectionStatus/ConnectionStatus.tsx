/**
 * Enhanced WebSocket connection status indicator component with quality metrics
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';
import type { ConnectionStatus as ConnectionStatusType } from '../../types/websocket';

interface Props {
  status: ConnectionStatusType;
  onReconnect: () => void;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<Props> = ({
  status,
  onReconnect,
  showDetails = false,
}) => {
  const getStatusText = () => {
    if (status.connected) return 'Connected';
    if (status.reconnecting) return 'Reconnecting...';
    if (status.error) return `Error: ${status.error}`;
    return 'Disconnected';
  };

  const getStatusClasses = () => {
    if (status.connected) return 'text-success-600 dark:text-success-400';
    if (status.reconnecting) return 'text-warning-600 dark:text-warning-400';
    if (status.error) return 'text-error-600 dark:text-error-400';
    return 'text-neutral-500';
  };

  const getDotClasses = () => {
    if (status.connected)
      return 'bg-success-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (status.reconnecting) return 'bg-warning-500 animate-pulse';
    if (status.error) return 'bg-error-500';
    return 'bg-neutral-400';
  };

  const getQualityClasses = () => {
    switch (status.quality.status) {
      case 'excellent':
        return 'bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-300';
      case 'good':
        return 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300';
      case 'poor':
        return 'bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-300';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
    }
  };

  const formatUptime = (uptime: number) => {
    if (uptime < 1000) return '< 1s';
    const seconds = Math.floor(uptime / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatLatency = (latency: number) => {
    if (latency === 0) return 'N/A';
    return `${latency}ms`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Status Indicator */}
      <div className={`flex items-center gap-2 ${getStatusClasses()}`}>
        <div className={`w-2 h-2 rounded-full ${getDotClasses()}`} />
        <span className="text-sm font-medium">{getStatusText()}</span>

        {status.connected && (
          <div
            className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${getQualityClasses()}`}
          >
            {status.quality.score}
          </div>
        )}
      </div>

      {/* Details */}
      {showDetails && status.connected && (
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">Quality:</span>
            <span
              className={`font-medium ${
                getQualityClasses().includes('text-')
                  ? getQualityClasses()
                      .split(' ')
                      .find(c => c.startsWith('text-'))
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {status.quality.status}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">Latency:</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {formatLatency(status.latency)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">Uptime:</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {formatUptime(status.uptime)}
            </span>
          </div>
        </div>
      )}

      {/* Reconnect Button */}
      {!status.connected && !status.reconnecting && (
        <button
          onClick={onReconnect}
          className="self-start px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};
