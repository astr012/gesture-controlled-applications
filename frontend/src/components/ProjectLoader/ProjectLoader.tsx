/**
 * ProjectLoader - Handles lazy loading of project modules with error boundaries
 * Uses Tailwind CSS for all styling
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
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ErrorLoggingService from '@/services/ErrorLoggingService';
import { withPerformanceTracking } from '@/services/PerformanceMonitor';

interface ProjectLoaderProps {
  projectId?: ProjectType;
  gestureData?: any;
}

const ProjectLoadingFallback: React.FC<{ projectName: string }> = ({
  projectName,
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center text-center p-8">
      <LoadingSpinner size="lg" />
      <h2 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Loading {projectName}
      </h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Preparing your gesture control experience...
      </p>
    </div>
  </div>
);

// Loading stage component
const ProjectLoading: React.FC<{
  stage: string;
  projectName: string;
  error?: string;
  onRetry: () => void;
}> = ({ stage, projectName, error, onRetry }) => {
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-error-100 dark:bg-error-500/20">
            <svg
              className="w-8 h-8 text-error-600 dark:text-error-400"
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
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Failed to load {projectName}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center text-center p-8">
        <LoadingSpinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {projectName}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
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

  return (
    <ProjectErrorBoundary projectName={projectConfig.name}>
      <Suspense
        fallback={<ProjectLoadingFallback projectName={projectConfig.name} />}
      >
        <div className="max-w-6xl mx-auto">
          {/* Project Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-2xl">
                {projectConfig.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {projectConfig.name}
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {projectConfig.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">v{projectConfig.version}</Badge>
              <Badge
                variant={
                  projectConfig.category === 'basic' ? 'success' : 'accent'
                }
              >
                {projectConfig.category}
              </Badge>
            </div>
          </div>

          {/* Project Tags */}
          {projectConfig.metadata && (
            <div className="flex flex-wrap gap-2 mb-6">
              {projectConfig.metadata.tags.map(tag => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Project Content */}
          <Card padding="lg">
            <ProjectComponent
              gestureData={gestureData}
              settings={state.settings}
              onSettingsChange={actions.updateSettings}
            />
          </Card>

          {/* Debug Information */}
          {state.showDebugInfo && projectConfig.metadata && (
            <Card className="mt-6 bg-neutral-50 dark:bg-neutral-800/50">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                Debug Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500">Project ID:</span>
                  <span className="ml-2 text-neutral-900 dark:text-neutral-100">
                    {projectConfig.id}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Version:</span>
                  <span className="ml-2 text-neutral-900 dark:text-neutral-100">
                    {projectConfig.metadata.version}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Author:</span>
                  <span className="ml-2 text-neutral-900 dark:text-neutral-100">
                    {projectConfig.metadata.author}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Loading Stage:</span>
                  <span className="ml-2 text-neutral-900 dark:text-neutral-100">
                    {loadingStage}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Suspense>
    </ProjectErrorBoundary>
  );
};

export default withPerformanceTracking(ProjectLoader, 'ProjectLoader');
