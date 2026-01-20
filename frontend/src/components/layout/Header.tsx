import React from 'react';
import { ConnectionStatus } from '@/components/ConnectionStatus/ConnectionStatus';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { state, actions } = useGlobalContext();
  const { connectionStatus, reconnect } = useWebSocket();

  const handleToggleSidebar = () => {
    actions.toggleSidebar();
  };

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <div className={styles.leftSection}>
            <button
              className={styles.sidebarToggle}
              onClick={handleToggleSidebar}
              aria-label={state.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            <div className={styles.logoSection}>
              <h1 className={styles.appTitle}>Gesture Control Platform</h1>
              <p className={styles.appSubtitle}>Real-time Hand Gesture Recognition</p>
            </div>
          </div>

          <div className={styles.rightSection}>
            <ConnectionStatus 
              status={connectionStatus} 
              onReconnect={reconnect}
              showDetails={true}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;