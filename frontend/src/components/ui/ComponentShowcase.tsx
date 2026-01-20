import React, { useState } from 'react';
import { Button, Card, StatusIndicator } from './index';
import type { StatusType } from './StatusIndicator';
import styles from './ComponentShowcase.module.css';

// Demo component to showcase the Apple-inspired component library
const ComponentShowcase: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<StatusType>('connected');

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const statusOptions: StatusType[] = ['connected', 'connecting', 'disconnected', 'error', 'idle', 'success', 'warning'];

  return (
    <div className={styles.showcase}>
      <div className={styles.container}>
        <h1 className={styles.title}>Apple-Inspired Component Library</h1>
        <p className={styles.subtitle}>
          A collection of beautiful, accessible components following Apple's design principles
        </p>

        {/* Button Showcase */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Buttons</h2>
          <div className={styles.buttonGrid}>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
            
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
            
            <Button variant="primary" loading={loading} onClick={handleLoadingDemo}>
              {loading ? 'Loading...' : 'Test Loading'}
            </Button>
            
            <Button variant="secondary" icon="🚀">With Icon</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Card>

        {/* Card Showcase */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Cards</h2>
          <div className={styles.cardGrid}>
            <Card variant="default" padding="md">
              <h3>Default Card</h3>
              <p>This is a default card with medium padding and subtle shadow.</p>
            </Card>
            
            <Card variant="elevated" padding="lg" hoverable>
              <h3>Elevated Card</h3>
              <p>This card has more elevation and hover effects.</p>
            </Card>
            
            <Card variant="outlined" padding="sm">
              <h3>Outlined Card</h3>
              <p>This card uses borders instead of shadows.</p>
            </Card>
            
            <Card variant="ghost" padding="md">
              <h3>Ghost Card</h3>
              <p>This card has no background or borders.</p>
            </Card>
          </div>
        </Card>

        {/* Status Indicator Showcase */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Status Indicators</h2>
          <div className={styles.statusGrid}>
            <div className={styles.statusDemo}>
              <h4>Current Status:</h4>
              <StatusIndicator status={currentStatus} showText size="lg" pulse />
              <div className={styles.statusButtons}>
                {statusOptions.map((status) => (
                  <Button
                    key={status}
                    variant={currentStatus === status ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentStatus(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className={styles.statusSizes}>
              <h4>Sizes:</h4>
              <div className={styles.statusRow}>
                <StatusIndicator status="connected" size="sm" showText />
                <StatusIndicator status="connecting" size="md" showText />
                <StatusIndicator status="error" size="lg" showText />
              </div>
            </div>
          </div>
        </Card>

        {/* Gesture Demo Card */}
        <Card variant="elevated" padding="lg" className={styles.gestureDemo}>
          <h2 className={styles.sectionTitle}>Gesture Control Demo</h2>
          <div className={styles.gestureContent}>
            <StatusIndicator status="connected" showText size="lg" />
            <div className={styles.gestureActions}>
              <Button variant="primary" icon="✋">Start Detection</Button>
              <Button variant="secondary" icon="⏸️">Pause</Button>
              <Button variant="danger" icon="⏹️">Stop</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ComponentShowcase;