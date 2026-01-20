/**
 * ProjectGrid Component
 * 
 * Grid of project cards for the dashboard.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useProjectStore } from '../../../state/stores/projectStore';
import styles from './ProjectGrid.module.css';

// Project definitions
const projects = [
  {
    id: 'finger_count',
    name: 'Smart Finger Counter',
    description: 'Real-time finger counting with pose detection',
    icon: '✋',
    category: 'basic',
    route: '/projects/finger-count',
    version: '2.0.0',
  },
  {
    id: 'volume_control',
    name: 'Gesture Volume Controller',
    description: 'Control system audio with pinch gestures',
    icon: '🔊',
    category: 'intermediate',
    route: '/projects/volume-control',
    version: '2.0.0',
  },
  {
    id: 'virtual_mouse',
    name: 'Precision Virtual Mouse',
    description: 'Control cursor with hand gestures',
    icon: '🖱️',
    category: 'advanced',
    route: '/projects/virtual-mouse',
    version: '2.0.0',
  },
  {
    id: 'sign_language',
    name: 'Sign Language Alphabet',
    description: 'ASL alphabet recognition (experimental)',
    icon: '🤟',
    category: 'experimental',
    route: '/projects/sign-language',
    version: '1.0.0',
    disabled: true,
  },
  {
    id: 'presentation',
    name: 'Presentation Controller',
    description: 'Control slideshows with air gestures',
    icon: '📽️',
    category: 'advanced',
    route: '/projects/presentation',
    version: '1.0.0',
    disabled: true,
  },
];

const ProjectGrid: React.FC = () => {
  const navigate = useNavigate();
  const activeProject = useProjectStore((state) => state.activeProject);
  
  return (
    <div className={styles.grid}>
      {projects.map((project) => (
        <Card
          key={project.id}
          className={`${styles.projectCard} ${project.disabled ? styles.disabled : ''}`}
          variant="elevated"
          hoverable={!project.disabled}
          onClick={() => !project.disabled && navigate(project.route)}
          data-active={activeProject === project.id}
        >
          <div className={styles.cardHeader}>
            <span className={styles.icon}>{project.icon}</span>
            <Badge 
              variant={
                project.category === 'advanced' ? 'accent' :
                project.category === 'intermediate' ? 'primary' :
                project.category === 'experimental' ? 'warning' :
                'default'
              }
              size="sm"
            >
              {project.category}
            </Badge>
          </div>
          
          <div className={styles.cardBody}>
            <h3 className={styles.projectName}>{project.name}</h3>
            <p className={styles.projectDescription}>{project.description}</p>
          </div>
          
          <div className={styles.cardFooter}>
            <span className={styles.version}>v{project.version}</span>
            <Button 
              variant="ghost" 
              size="sm"
              disabled={project.disabled}
              onClick={(e) => {
                e.stopPropagation();
                navigate(project.route);
              }}
            >
              {project.disabled ? 'Coming Soon' : 'Launch →'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProjectGrid;
