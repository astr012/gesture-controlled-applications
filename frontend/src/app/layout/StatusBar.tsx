/**
 * StatusBar Component
 * 
 * Bottom status bar showing connection, FPS, latency, and notifications.
 */

import React from 'react';
import { useAppStore } from '../../state/stores/appStore';
import { useProjectStore } from '../../state/stores/projectStore';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  className?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ className = '' }) => {
  const connection = useAppStore((state) => state.connection);
  const notifications = useAppStore((state) => state.notifications);
  const fps = useProjectStore((state) => state.fps);
  const latency = useProjectStore((state) => state.processingLatency);
  const activeProject = useProjectStore((state) => state.activeProject);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <footer className={`${styles.statusBar} ${className}`}>
      <div className={styles.left}>
        <div className={styles.item}>
          <span 
            className={styles.statusDot}
            data-status={connection.status}
          />
          <span className={styles.label}>
            {connection.status === 'connected' ? 
              `Connected (${connection.latency}ms)` : 
              connection.status}
          </span>
        </div>
        
        {activeProject && (
          <div className={styles.item}>
            <span className={styles.label}>
              Project: {activeProject}
            </span>
          </div>
        )}
      </div>
      
      <div className={styles.center}>
        {activeProject && (
          <>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{fps}</span>
              <span className={styles.metricLabel}>FPS</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.metric}>
              <span className={styles.metricValue}>{latency.toFixed(1)}</span>
              <span className={styles.metricLabel}>ms</span>
            </div>
          </>
        )}
      </div>
      
      <div className={styles.right}>
        {unreadCount > 0 && (
          <div className={styles.notifications}>
            <span className={styles.notificationBadge}>{unreadCount}</span>
            <span className={styles.label}>Notifications</span>
          </div>
        )}
        <span className={styles.version}>v2.0.0</span>
      </div>
    </footer>
  );
};

export default StatusBar;
