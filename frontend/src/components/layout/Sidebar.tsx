import React from 'react';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import type { ProjectType } from '@/types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isMobile?: boolean;
  isTablet?: boolean;
}

// Project data with numbered display
const PROJECTS = [
  {
    id: 'finger_count' as ProjectType,
    name: 'Finger Counting',
    number: 1,
  },
  {
    id: 'volume_control' as ProjectType,
    name: 'Volume Control',
    number: 2,
  },
  {
    id: 'virtual_mouse' as ProjectType,
    name: 'Virtual Mouse',
    number: 3,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, isTablet = false }) => {
  const { state, actions } = useGlobalContext();

  const handleProjectSelect = (project: ProjectType) => {
    actions.selectProject(project);
    // Auto-close sidebar on mobile/tablet after selection
    if ((isMobile || isTablet) && !state.sidebarCollapsed) {
      actions.toggleSidebar();
    }
  };

  const isDisabled = !state.connectionStatus.connected;

  // Mobile bottom navigation
  if (isMobile && state.sidebarCollapsed) {
    return (
      <div className={styles.bottomNavigation}>
        <div className={styles.bottomNavContent}>
          {PROJECTS.map(project => (
            <button
              key={project.id}
              className={`${styles.projectTab} ${state.currentProject === project.id ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
              onClick={() => handleProjectSelect(project.id)}
              disabled={isDisabled}
              title={project.name}
              aria-label={project.name}
            >
              <span className={styles.projectNumber}>{project.number}</span>
              <span className={styles.projectLabel}>{project.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.sidebar} ${isMobile ? styles.mobile : ''}`}>
      <div className={styles.sidebarContent}>
        {/* Project tabs - always visible */}
        <div className={styles.projectTabs}>
          <div className={styles.tabsHeader}>
            <span className={styles.tabsTitle}>Projects</span>
          </div>
          <div className={styles.tabsList}>
            {PROJECTS.map(project => (
              <button
                key={project.id}
                className={`${styles.projectTab} ${state.currentProject === project.id ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
                onClick={() => handleProjectSelect(project.id)}
                disabled={isDisabled}
                title={project.name}
                aria-label={`${project.number}. ${project.name}`}
              >
                <span className={styles.projectNumber}>{project.number}</span>
                <span className={styles.projectName}>{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Connection status footer */}
        <div className={styles.sidebarFooter}>
          <div className={`${styles.connectionStatus} ${state.connectionStatus.connected ? styles.connected : styles.disconnected}`}>
            <span className={styles.statusDot}></span>
            <span className={styles.statusText}>
              {state.connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;