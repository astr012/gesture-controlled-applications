/**
 * Sidebar Component
 * 
 * Navigation sidebar with project links and quick actions.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../state/stores/appStore';
import styles from './Sidebar.module.css';

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
}

const navItems = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/projects/finger-count', icon: '✋', label: 'Finger Count' },
  { path: '/projects/volume-control', icon: '🔊', label: 'Volume Control' },
  { path: '/projects/virtual-mouse', icon: '🖱️', label: 'Virtual Mouse' },
  { path: '/analytics', icon: '📊', label: 'Analytics' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ className = '', collapsed = false }) => {
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  
  return (
    <aside className={`${styles.sidebar} ${className}`} data-collapsed={collapsed}>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.icon}>{item.icon}</span>
            {!collapsed && <span className={styles.label}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      
      <div className={styles.footer}>
        <button 
          className={styles.collapseBtn}
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className={styles.collapseIcon}>
            {collapsed ? '→' : '←'}
          </span>
          {!collapsed && <span className={styles.label}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
