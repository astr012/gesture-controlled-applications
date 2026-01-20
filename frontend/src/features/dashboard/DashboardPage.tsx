/**
 * DashboardPage Component
 * 
 * Main dashboard view with project grid, stats, and quick actions.
 */

import React from 'react';
import DashboardLayout from './DashboardLayout';
import ProjectGrid from './components/ProjectGrid';
import StatsPanel from './components/StatsPanel';
import QuickActions from './components/QuickActions';
import SystemHealth from './components/SystemHealth';
import { useDashboardStats } from './hooks/useDashboardStats';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => {
  const { stats, isLoading } = useDashboardStats();
  
  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome to the Gesture Control Platform
          </p>
        </header>
        
        <section className={styles.statsRow}>
          <StatsPanel stats={stats} isLoading={isLoading} />
        </section>
        
        <div className={styles.mainGrid}>
          <section className={styles.projectsSection}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <ProjectGrid />
          </section>
          
          <aside className={styles.sidebar}>
            <QuickActions />
            <SystemHealth />
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
