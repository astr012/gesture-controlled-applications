import React from 'react';
import { Link } from 'react-router-dom';
import { projectRegistry } from '@/projects/registry';
import Card from '@/components/ui/Card';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const enabledProjects = projectRegistry.projects.filter(project => project.enabled);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gesture Control Platform</h1>
        <p className={styles.subtitle}>
          Select a gesture project to begin real-time hand tracking and control
        </p>
      </div>

      <div className={styles.projectGrid}>
        {enabledProjects.map(project => (
          <Link
            key={project.id}
            to={project.route}
            className={styles.projectLink}
          >
            <Card variant="elevated" hoverable className={styles.projectCard}>
              <div className={styles.projectIcon}>{project.icon}</div>
              <div className={styles.projectInfo}>
                <h3 className={styles.projectName}>{project.name}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
                <div className={styles.projectMeta}>
                  <span className={styles.projectCategory}>{project.category}</span>
                  <span className={styles.projectVersion}>v{project.version}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{enabledProjects.length}</span>
          <span className={styles.statLabel}>Available Projects</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>
            {enabledProjects.filter(p => p.category === 'basic').length}
          </span>
          <span className={styles.statLabel}>Basic Projects</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>
            {enabledProjects.filter(p => p.category === 'advanced').length}
          </span>
          <span className={styles.statLabel}>Advanced Projects</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
