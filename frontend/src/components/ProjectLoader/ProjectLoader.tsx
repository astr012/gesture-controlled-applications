/**
 * ProjectLoader - Handles lazy loading of project modules with error boundaries
 *
 * Simplified loader that delegates UI to the project modules themselves,
 * which use the ProjectShowcasePage template for consistent presentation.
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
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorLoggingService from '@/services/ErrorLoggingService';
import { withPerformanceTracking } from '@/services/PerformanceMonitor';

interface ProjectLoaderProps {
  projectId?: ProjectType;
  gestureData?: any;
}

// Loading/Error state component
const ProjectLoading: React.FC<{
  stage: string;
  projectName: string;
  error?: string;
  onRetry: () => void;
}> = ({ stage, projectName, error, onRetry }) => {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Card className="max-w-md text-center" padding="lg">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Failed to load {projectName}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {error}
          </p>
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const stageMessages: Record<string, string> = {
    discovering: 'Discovering project...',
    loading: 'Loading module...',
    initializing: 'Initializing...',
    ready: 'Ready!',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center text-center p-8">
        <LoadingSpinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-white">
          {projectName}
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {stageMessages[stage] || 'Loading...'}
        </p>
      </div>
    </div>
  );
};

const ProjectLoader: React.FC<ProjectLoaderProps> = ({
  projectId: propProjectId,
  gestureData: propsGestureData,
}) => {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const { state, actions } = useProjectContext();
  const {
    gestureData: wsGestureData,
    selectProject: wsSelectProject,
    connectionStatus,
  } = useWebSocket();
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(
    null
  );
  const [ProjectComponent, setProjectComponent] =
    useState<React.ComponentType<any> | null>(null);
  const [loadingStage, setLoadingStage] = useState<
    'discovering' | 'loading' | 'initializing' | 'ready' | 'error'
  >('discovering');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const errorLogger = ErrorLoggingService.getInstance();

  const urlProjectId = propProjectId || paramProjectId;
  const actualProjectId = urlProjectId
    ? urlToProjectId(urlProjectId) || (urlProjectId as ProjectType)
    : null;
  const gestureData = wsGestureData || propsGestureData || state.gestureData;

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
      if (!config) throw new Error(`Project not found: ${projectId}`);
      if (!config.enabled) throw new Error(`Project is disabled: ${projectId}`);

      setProjectConfig(config);
      setLoadingStage('loading');

      const module = await loadProject(projectId);
      setLoadingStage('initializing');
      setProjectComponent(() => module.default);

      actions.selectProject(projectId);
      const mergedSettings = { ...config.defaultSettings, ...state.settings };
      actions.updateSettings(mergedSettings);

      setLoadingStage('ready');
      errorLogger.logUserAction('project_load_success', { project: projectId });
    } catch (error) {
      console.error(`Failed to load project ${projectId}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setLoadingError(errorMessage);
      setLoadingStage('error');
      errorLogger.logUserAction('project_load_error', {
        project: projectId,
        error: errorMessage,
        retryCount,
      });
      throw error;
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoadingError(null);
    setProjectComponent(null);
    setLoadingStage('discovering');
    errorLogger.logUserAction('project_retry', {
      project: actualProjectId,
      retryCount: retryCount + 1,
    });
    if (actualProjectId) loadProjectModule(actualProjectId);
  };

  useEffect(() => {
    if (!actualProjectId) return;
    loadProjectModule(actualProjectId);
  }, [actualProjectId, retryCount]);

  if (urlProjectId && !actualProjectId) {
    return <Navigate to="/404" replace />;
  }

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

  // Render the project component directly - it handles its own layout via ProjectShowcasePage
  return (
    <ProjectErrorBoundary projectName={projectConfig.name}>
      <Suspense
        fallback={
          <ProjectLoading
            stage="loading"
            projectName={projectConfig.name}
            onRetry={handleRetry}
          />
        }
      >
        <ProjectComponent
          gestureData={gestureData}
          settings={state.settings}
          onSettingsChange={actions.updateSettings}
          connectionStatus={connectionStatus}
        />
      </Suspense>
    </ProjectErrorBoundary>
  );
};

export default withPerformanceTracking(ProjectLoader, 'ProjectLoader');
