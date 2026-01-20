/**
 * AppShell Component
 * 
 * Main application layout with header, sidebar, content, and status bar.
 */

import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { useAppStore } from '../../state/stores/appStore';
import styles from './AppShell.module.css';

interface AppShellProps {
  children?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const theme = useAppStore((state) => state.theme);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  
  return (
    <div 
      className={styles.shell}
      data-theme={theme}
      data-sidebar-collapsed={sidebarCollapsed}
    >
      <Header className={styles.header} />
      
      <div className={styles.body}>
        <Sidebar 
          className={styles.sidebar}
          collapsed={sidebarCollapsed}
        />
        
        <main className={styles.content}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
            {children}
          </Suspense>
        </main>
      </div>
      
      <StatusBar className={styles.statusBar} />
    </div>
  );
};

const PageSkeleton: React.FC = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonHeader} />
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonCard} />
      <div className={styles.skeletonCard} />
      <div className={styles.skeletonCard} />
    </div>
  </div>
);

export default AppShell;
