import React from 'react';
import { ProjectSelector } from '@/components/ProjectSelector/ProjectSelector';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import type { ProjectType } from '@/types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false }) => {
  const { state, actions } = useGlobalContext();

  const handleProjectSelect = (project: ProjectType) => {
    actions.selectProject(project);
    // Auto-close sidebar on mobile after selection
    if (isMobile && !state.sidebarCollapsed) {
      actions.toggleSidebar();
    }
  };

  const sidebarClasses = [
    styles.sidebar,
    state.sidebarCollapsed ? styles.collapsed : '',
    isMobile ? styles.mobile : ''
  ].filter(Boolean).join(' ');

  // On mobile, render as bottom navigation when collapsed
  if (isMobile && state.sidebarCollapsed) {
    return (
      <div className={styles.bottomNavigation}>
        <div className={styles.bottomNavContent}>
          <ProjectIconList
            currentProject={state.currentProject}
            onProjectSelect={handleProjectSelect}
            disabled={!state.connectionStatus.connected}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  return (
    <aside className={sidebarClasses}>
      <div className={styles.sidebarContent}>
        {!state.sidebarCollapsed && (
          <>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>Projects</h2>
              <p className={styles.sidebarSubtitle}>Select a gesture project</p>
            </div>

            <div className={styles.sidebarBody}>
              <ProjectSelector
                currentProject={state.currentProject}
                onProjectSelect={handleProjectSelect}
                disabled={!state.connectionStatus.connected}
              />
            </div>
          </>
        )}

        {state.sidebarCollapsed && !isMobile && (
          <div className={styles.collapsedContent}>
            <div className={styles.collapsedProjects}>
              <ProjectIconList
                currentProject={state.currentProject}
                onProjectSelect={handleProjectSelect}
                disabled={!state.connectionStatus.connected}
                isMobile={false}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// Component for collapsed sidebar project icons
interface ProjectIconListProps {
  currentProject: ProjectType | null;
  onProjectSelect: (project: ProjectType) => void;
  disabled: boolean;
  isMobile: boolean;
}

const ProjectIconList: React.FC<ProjectIconListProps> = ({
  currentProject,
  onProjectSelect,
  disabled,
  isMobile
}) => {
  const projects = [
    {
      id: 'finger_count' as ProjectType,
      name: 'Finger Counting',
      icon: '✋',
    },
    {
      id: 'volume_control' as ProjectType,
      name: 'Volume Control',
      icon: '🔊',
    },
    {
      id: 'virtual_mouse' as ProjectType,
      name: 'Virtual Mouse',
      icon: '🖱️',
    },
  ];

  return (
    <>
      {projects.map(project => (
        <button
          key={project.id}
          className={`${styles.projectIcon} ${currentProject === project.id ? styles.active : ''
            } ${disabled ? styles.disabled : ''} ${isMobile ? styles.mobileIcon : ''
            }`}
          onClick={() => onProjectSelect(project.id)}
          disabled={disabled}
          title={project.name}
          aria-label={project.name}
        >
          <span className={styles.iconEmoji}>{project.icon}</span>
          {isMobile && (
            <span className={styles.iconLabel}>{project.name.split(' ')[0]}</span>
          )}
        </button>
      ))}
    </>
  );
};

export default Sidebar;