/**
 * Project selection component for switching between gesture projects
 */

import React from 'react';
import type { ProjectType } from '@/types';
import styles from './ProjectSelector.module.css';

interface Props {
  currentProject: ProjectType | null;
  onProjectSelect: (project: ProjectType) => void;
  disabled?: boolean;
}

const projects = [
  {
    id: 'finger_count' as ProjectType,
    name: 'Finger Counting',
    description: 'Count raised fingers in real-time',
    icon: '✋',
  },
  {
    id: 'volume_control' as ProjectType,
    name: 'Volume Control',
    description: 'Control system volume with gestures',
    icon: '🔊',
  },
  {
    id: 'virtual_mouse' as ProjectType,
    name: 'Virtual Mouse',
    description: 'Control cursor with hand movements',
    icon: '🖱️',
  },
];

export const ProjectSelector: React.FC<Props> = ({
  currentProject,
  onProjectSelect,
  disabled = false,
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select Gesture Project</h2>

      <div className={styles.projectGrid}>
        {projects.map(project => (
          <button
            key={project.id}
            className={`${styles.projectCard} ${currentProject === project.id ? styles.active : ''
              } ${disabled ? styles.disabled : ''}`}
            onClick={() => onProjectSelect(project.id)}
            disabled={disabled}
          >
            <div className={styles.projectIcon}>{project.icon}</div>
            <div className={styles.projectInfo}>
              <h3 className={styles.projectName}>{project.name}</h3>
              <p className={styles.projectDescription}>{project.description}</p>
            </div>
            {currentProject === project.id && (
              <div className={styles.activeIndicator}>Active</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
