import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Header from './Header';
import Sidebar from './Sidebar';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import { withPerformanceTracking } from '@/services/PerformanceMonitor';
import styles from './MainLayout.module.css';

const MainLayoutContent: React.FC = () => {
  const { state, actions } = useGlobalContext();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile sidebar overlay
  useEffect(() => {
    if (isMobile) {
      setShowMobileOverlay(!state.sidebarCollapsed);
    } else {
      setShowMobileOverlay(false);
    }
  }, [state.sidebarCollapsed, isMobile]);

  // Close mobile sidebar when clicking overlay
  const handleOverlayClick = () => {
    if (isMobile) {
      actions.toggleSidebar();
    }
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && showMobileOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, showMobileOverlay]);

  const mainGridClasses = [
    styles.mainGrid,
    state.sidebarCollapsed ? styles.sidebarCollapsed : ''
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    styles.mobileOverlay,
    showMobileOverlay ? styles.visible : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.appLayout}>
      <Header />

      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={overlayClasses}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <div className={styles.mainContainer}>
        <div className="container">
          <div className={mainGridClasses}>
            <Sidebar isMobile={isMobile} />
            <main className={styles.content}>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with performance tracking
const TrackedMainLayoutContent = withPerformanceTracking(MainLayoutContent, 'MainLayoutContent');

const MainLayout: React.FC = () => {
  return (
    <ErrorBoundary>
      <TrackedMainLayoutContent />
    </ErrorBoundary>
  );
};

export default MainLayout;
