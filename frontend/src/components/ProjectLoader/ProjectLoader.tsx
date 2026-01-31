/**
 * ProjectLoader - Handles lazy loading of project modules with error boundaries
 * Provides Apple-style loading states and comprehensive error handling
 */

import React, { Suspense, useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import type { ProjectType } from '@/types';
import {
  getProjectById,
  loadProject,
  urlToProjectId,
  type ProjectConfig,
} from '@/projects/registry';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import ProjectErrorBoundary from '@/components/ui/ProjectErrorBoundary';
import { ProjectLoading } from '@/components/ui/AsyncLoadingStates';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorLoggingService from '@/services/ErrorLoggingService';
import { withPerformanceTracking } from '@/services/PerformanceMonitor';
import styles from './ProjectLoader.module.css';

interface ProjectLoaderProps {
  projectId?: ProjectType;
  gestureData?: any;
}

const ProjectLoadingFallback: React.FC<{ projectName: string }> = ({ projectName }) => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingCard}>
      <LoadingSpinner size="lg" />
      <h2 className={styles.loadingTitle}>Loading {projectName}</h2>
      <p className={styles.loadingMessage}>Preparing your gesture control experience...</p>
    </div>
  </div>
);

const ProjectLoader: React.FC<ProjectLoaderProps> = ({ projectId: propProjectId, gestureData: propsGestureData }) => {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const { state, actions } = useProjectContext();
  const { gestureData: wsGestureData, selectProject: wsSelectProject, connectionStatus } = useWebSocket();
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
  const [ProjectComponent, setProjectComponent] = useState<React.ComponentType<any> | null>(null);
  const [loadingStage, setLoadingStage] = useState<'discovering' | 'loading' | 'initializing' | 'ready' | 'error'>('discovering');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const errorLogger = ErrorLoggingService.getInstance();

  // Determine project ID from props or URL params
  const urlProjectId = propProjectId || paramProjectId;
  const actualProjectId = urlProjectId ? urlToProjectId(urlProjectId) || urlProjectId as ProjectType : null;

  // Use gesture data from WebSocket if available, otherwise from props or context
  const gestureData = wsGestureData || propsGestureData || state.gestureData;

  // Select project on WebSocket when project loads
  useEffect(() => {
    if (actualProjectId && connectionStatus.connected) {
      wsSelectProject(actualProjectId);
    }
  }, [actualProjectId, connectionStatus.connected, wsSelectProject]);

  const loadProjectModule = async (projectId: ProjectType) => {
    try {
      setLoadingError(null);
      setLoadingStage('discovering');

      errorLogger.logUserAction('project_load_start', { project: projectId });

      const config = getProjectById(projectId);

      if (!config) {
        throw new Error(`Project not found: ${projectId}`);
      }

      if (!config.enabled) {
        throw new Error(`Project is disabled: ${projectId}`);
      }

      setProjectConfig(config);
      setLoadingStage('loading');

      // Load project component dynamically with enhanced error handling
      const module = await loadProject(projectId);
      setLoadingStage('initializing');

      setProjectComponent(() => module.default);

      // Update project context with default settings
      actions.selectProject(projectId);

      // Merge default settings with current settings
      const mergedSettings = {
        ...config.defaultSettings,
        ...state.settings,
      };
      actions.updateSettings(mergedSettings);

      setLoadingStage('ready');
      errorLogger.logUserAction('project_load_success', { project: projectId });

    } catch (error) {
      console.error(`Failed to load project ${projectId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLoadingError(errorMessage);
      setLoadingStage('error');

      errorLogger.logUserAction('project_load_error', {
        project: projectId,
        error: errorMessage,
        retryCount
      });

      throw error; // Let error boundary handle it
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoadingError(null);
    setProjectComponent(null);
    setLoadingStage('discovering');

    errorLogger.logUserAction('project_retry', {
      project: actualProjectId,
      retryCount: retryCount + 1
    });

    if (actualProjectId) {
      loadProjectModule(actualProjectId);
    }
  };

  const handleProjectError = (projectId: ProjectType, error: Error) => {
    console.error(`Project error in ${projectId}:`, error);
    errorLogger.logUserAction('project_runtime_error', {
      project: projectId,
      error: error.message
    });
  };

  useEffect(() => {
    if (!actualProjectId) return;

    loadProjectModule(actualProjectId);
  }, [actualProjectId, retryCount]);

  // Redirect if project not found
  if (urlProjectId && !actualProjectId) {
    console.warn(`Invalid project URL: ${urlProjectId}`);
    return <Navigate to="/404" replace />;
  }

  // Show project loading states
  if (loadingStage !== 'ready' || !ProjectComponent || !projectConfig) {
    return (
      <ProjectLoading
        stage={loadingStage}
        projectName={projectConfig?.name || 'Project'}
        error={loadingError || undefined}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <ProjectErrorBoundary
      projectId={projectConfig.id}
      projectName={projectConfig.name}
      onProjectError={handleProjectError}
    >
      <Suspense fallback={<ProjectLoadingFallback projectName={projectConfig.name} />}>
        <div className={styles.projectContainer}>
          <div className={styles.projectHeader}>
            <div className={styles.projectInfo}>
              <span className={styles.projectIcon}>{projectConfig.icon}</span>
              <div>
                <h1 className={styles.projectTitle}>{projectConfig.name}</h1>
                <p className={styles.projectDescription}>{projectConfig.description}</p>
              </div>
            </div>
            <div className={styles.projectMeta}>
              <span className={styles.projectVersion}>v{projectConfig.version}</span>
              <span className={styles.projectCategory}>{projectConfig.category}</span>
              {projectConfig.metadata && (
                <div className={styles.projectTags}>
                  {projectConfig.metadata.tags.slice(0, 3).map(tag => (
                    <span key={tag} className={styles.projectTag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.projectContent}>
            <ProjectComponent
              gestureData={gestureData}
              settings={state.settings}
              onSettingsChange={actions.updateSettings}
            />
          </div>

          {/* Debug information */}
          {state.showDebugInfo && projectConfig.metadata && (
            <div className={styles.debugInfo}>
              <h3>Debug Information</h3>
              <div className={styles.debugGrid}>
                <div>
                  <strong>Project ID:</strong> {projectConfig.id}
                </div>
                <div>
                  <strong>Version:</strong> {projectConfig.metadata.version}
                </div>
                <div>
                  <strong>Author:</strong> {projectConfig.metadata.author}
                </div>
                <div>
                  <strong>Last Updated:</strong> {projectConfig.metadata.lastUpdated}
                </div>
                <div>
                  <strong>Requirements:</strong> {projectConfig.metadata.requirements.join(', ')}
                </div>
                <div>
                  <strong>Features:</strong> {projectConfig.metadata.features.join(', ')}
                </div>
                <div>
                  <strong>Loading Stage:</strong> {loadingStage}
                </div>
                <div>
                  <strong>Retry Count:</strong> {retryCount}
                </div>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </ProjectErrorBoundary>
  );
};

export default withPerformanceTracking(ProjectLoader, 'ProjectLoader');