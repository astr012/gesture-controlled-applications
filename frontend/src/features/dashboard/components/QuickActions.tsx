/**
 * QuickActions Component
 * 
 * Quick action buttons for the dashboard sidebar.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import styles from './QuickActions.module.css';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    { label: 'Start Finger Count', icon: '✋', action: () => navigate('/projects/finger-count') },
    { label: 'Volume Control', icon: '🔊', action: () => navigate('/projects/volume-control') },
    { label: 'Virtual Mouse', icon: '🖱️', action: () => navigate('/projects/virtual-mouse') },
  ];
  
  return (
    <Card variant="default" padding="md">
      <h3 className={styles.title}>Quick Actions</h3>
      <div className={styles.actions}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="secondary"
            onClick={action.action}
            leftIcon={<span>{action.icon}</span>}
            fullWidth
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
