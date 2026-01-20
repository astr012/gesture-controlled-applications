/**
 * Header Component
 * 
 * Top navigation bar with logo, navigation, and status indicators.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../state/stores/appStore';
import styles from './Header.module.css';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const connection = useAppStore((state) => state.connection);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>✋</span>
          <span className={styles.logoText}>Gesture Control</span>
        </Link>
      </div>
      
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLink}>Dashboard</Link>
        <Link to="/projects" className={styles.navLink}>Projects</Link>
        <Link to="/analytics" className={styles.navLink}>Analytics</Link>
      </nav>
      
      <div className={styles.right}>
        <div className={styles.connectionStatus}>
          <span 
            className={styles.connectionDot}
            data-status={connection.status}
          />
          <span className={styles.connectionLabel}>
            {connection.status === 'connected' ? 'Connected' : 
             connection.status === 'connecting' ? 'Connecting...' : 
             'Disconnected'}
          </span>
        </div>
        
        <button 
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        
        <button className={styles.settingsBtn} aria-label="Settings">
          ⚙️
        </button>
      </div>
    </header>
  );
};

export default Header;
