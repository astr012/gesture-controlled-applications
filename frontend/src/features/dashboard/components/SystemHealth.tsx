/**
 * SystemHealth Component
 * 
 * System health indicators for the dashboard.
 */

import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useAppStore } from '../../../state/stores/appStore';
import styles from './SystemHealth.module.css';

const SystemHealth: React.FC = () => {
  const connection = useAppStore((state) => state.connection);
  
  const healthItems = [
    { 
      label: 'Backend Connection', 
      status: connection.status === 'connected' ? 'healthy' : 
              connection.status === 'connecting' ? 'warning' : 'error',
      value: connection.status === 'connected' ? 'Connected' : 
             connection.status === 'connecting' ? 'Connecting...' : 'Disconnected'
    },
    { 
      label: 'Camera', 
      status: 'healthy',
      value: 'Ready'
    },
    { 
      label: 'MediaPipe', 
      status: 'healthy',
      value: 'Loaded'
    },
    { 
      label: 'Latency', 
      status: connection.latency < 50 ? 'healthy' : 
              connection.latency < 100 ? 'warning' : 'error',
      value: `${connection.latency}ms`
    },
  ];
  
  return (
    <Card variant="default" padding="md">
      <h3 className={styles.title}>System Health</h3>
      <div className={styles.items}>
        {healthItems.map((item, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.itemInfo}>
              <span 
                className={styles.statusDot}
                data-status={item.status}
              />
              <span className={styles.label}>{item.label}</span>
            </div>
            <Badge 
              variant={
                item.status === 'healthy' ? 'success' :
                item.status === 'warning' ? 'warning' : 'danger'
              }
              size="sm"
            >
              {item.value}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SystemHealth;
