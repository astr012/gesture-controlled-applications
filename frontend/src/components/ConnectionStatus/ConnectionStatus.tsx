/**
 * Enhanced WebSocket connection status indicator component with quality metrics
 */

import React from 'react';
import type { ConnectionStatus as ConnectionStatusType } from '../../types/websocket';
import styles from './ConnectionStatus.module.css';

interface Props {
  status: ConnectionStatusType;
  onReconnect: () => void;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<Props> = ({
  status,
  onReconnect,
  showDetails = false
}) => {
  const getStatusText = () => {
    if (status.connected) return 'Connected';
    if (status.reconnecting) return 'Reconnecting...';
    if (status.error) return `Error: ${status.error}`;
    return 'Disconnected';
  };

  const getStatusClass = () => {
    if (status.connected) return styles.connected;
    if (status.reconnecting) return styles.reconnecting;
    if (status.error) return styles.error;
    return styles.disconnected;
  };

  const getQualityClass = () => {
    switch (status.quality.status) {
      case 'excellent':
        return styles.qualityExcellent;
      case 'good':
        return styles.qualityGood;
      case 'poor':
        return styles.qualityPoor;
      default:
        return styles.qualityUnknown;
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
    <div className={styles.container}>
      <div className={`${styles.indicator} ${getStatusClass()}`}>
        <div className={styles.dot} />
        <span className={styles.text}>{getStatusText()}</span>

        {status.connected && (
          <div className={`${styles.qualityIndicator} ${getQualityClass()}`}>
            <span className={styles.qualityScore}>{status.quality.score}</span>
          </div>
        )}
      </div>

      {showDetails && status.connected && (
        <div className={styles.details}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Quality:</span>
            <span className={`${styles.metricValue} ${getQualityClass()}`}>
              {status.quality.status}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Latency:</span>
            <span className={styles.metricValue}>
              {formatLatency(status.latency)}
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Uptime:</span>
            <span className={styles.metricValue}>
              {formatUptime(status.uptime)}
            </span>
          </div>
        </div>
      )}

      {!status.connected && !status.reconnecting && (
        <button className={styles.reconnectButton} onClick={onReconnect}>
          Reconnect
        </button>
      )}
    </div>
  );
};
