/**
 * StatsPanel Component
 * 
 * Overview statistics for the dashboard.
 */

import React from 'react';
import { Card } from '../../../components/ui/Card';
import styles from './StatsPanel.module.css';

interface DashboardStats {
  totalSessions: number;
  activeTime: string;
  gesturesDetected: number;
  accuracy: number;
}

interface StatsPanelProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const defaultStats: DashboardStats = {
  totalSessions: 0,
  activeTime: '0h 0m',
  gesturesDetected: 0,
  accuracy: 0,
};

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, isLoading }) => {
  const data = stats || defaultStats;
  
  const statItems = [
    { label: 'Total Sessions', value: data.totalSessions, icon: '📊' },
    { label: 'Active Time', value: data.activeTime, icon: '⏱️' },
    { label: 'Gestures Detected', value: data.gesturesDetected.toLocaleString(), icon: '✋' },
    { label: 'Accuracy', value: `${data.accuracy}%`, icon: '🎯' },
  ];
  
  return (
    <div className={styles.panel}>
      {statItems.map((item, index) => (
        <Card 
          key={index} 
          className={`${styles.statCard} ${isLoading ? styles.loading : ''}`}
          variant="default"
          padding="md"
        >
          <div className={styles.statContent}>
            <span className={styles.icon}>{item.icon}</span>
            <div className={styles.statText}>
              <span className={styles.value}>{item.value}</span>
              <span className={styles.label}>{item.label}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatsPanel;
