/**
 * DashboardLayout Component
 * 
 * Layout wrapper with dashboard-specific styles.
 */

import React from 'react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      {children}
    </div>
  );
};

export default DashboardLayout;
