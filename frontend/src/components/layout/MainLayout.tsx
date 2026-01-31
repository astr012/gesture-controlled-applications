import React, { useEffect, useState, useCallback } from 'react';
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
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  // Detect viewport size
  const checkViewport = useCallback(() => {
    const width = window.innerWidth;
    setIsMobile(width <= 768);
    setIsTablet(width > 768 && width <= 1024);
  }, []);

  useEffect(() => {
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [checkViewport]);

  // Handle mobile/tablet sidebar overlay
  useEffect(() => {
    if (isMobile || isTablet) {
      setShowMobileOverlay(!state.sidebarCollapsed);
    } else {
      setShowMobileOverlay(false);
    }
  }, [state.sidebarCollapsed, isMobile, isTablet]);

  // Close mobile sidebar when clicking overlay
  const handleOverlayClick = useCallback(() => {
    if ((isMobile || isTablet) && !state.sidebarCollapsed) {
      actions.toggleSidebar();
    }
  }, [isMobile, isTablet, state.sidebarCollapsed, actions]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if ((isMobile || isTablet) && showMobileOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isTablet, showMobileOverlay]);

  // Keyboard accessibility - close sidebar on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isMobile || isTablet) && !state.sidebarCollapsed) {
        actions.toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isTablet, state.sidebarCollapsed, actions]);

  const sidebarContainerClasses = [
    styles.sidebarContainer,
    state.sidebarCollapsed ? styles.collapsed : '',
    (isMobile || isTablet) && !state.sidebarCollapsed ? styles.mobileOpen : ''
  ].filter(Boolean).join(' ');

  const canvasAreaClasses = [
    styles.canvasArea,
    state.sidebarCollapsed && !isMobile && !isTablet ? styles.expanded : ''
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    styles.mobileOverlay,
    showMobileOverlay ? styles.visible : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.appLayout}>
      <Header />

      {/* Mobile/Tablet overlay */}
      <div
        className={overlayClasses}
        onClick={handleOverlayClick}
        aria-hidden="true"
        role="presentation"
      />

      {/* Main Wrapper with Sidebar + Canvas */}
      <div className={styles.mainWrapper}>
        {/* Fixed Sidebar */}
        <aside className={sidebarContainerClasses}>
          <Sidebar isMobile={isMobile} isTablet={isTablet} />
        </aside>

        {/* Canvas Content Area */}
        <main className={canvasAreaClasses}>
          <div className={styles.canvasContainer}>
            <div className={styles.contentCanvas}>
              <div className={styles.contentInner}>
                <Outlet />
              </div>
            </div>
          </div>
        </main>
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
