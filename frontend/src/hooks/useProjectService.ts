/**
 * useProjectService - Hook for project management
 *
 * Implements the hook-service pattern by wrapping ProjectService
 * in a React hook with proper lifecycle management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import ProjectService from '@/services/api/ProjectService';
import type { ProjectState } from '@/services/api/ProjectService';
import type { ProjectConfig, ProjectSettings } from '@/types/project';
import type { ProjectType } from '@/types/project-types';

export interface UseProjectServiceReturn {
  // State
  state: ProjectState;
  selectedProject: ProjectType | null;
  isLoading: boolean;
  error: string | null;

  // Data
  projects: ProjectConfig[];
  enabledProjects: ProjectConfig[];

  // Actions
  selectProject: (id: ProjectType) => Promise<void>;
  getSettings: (id: ProjectType) => ProjectSettings;
  updateSettings: (id: ProjectType, settings: Partial<ProjectSettings>) => void;
  resetSettings: (id: ProjectType) => void;
}

export function useProjectService(): UseProjectServiceReturn {
  const serviceRef = useRef<ProjectService | null>(null);
  const [state, setState] = useState<ProjectState>({
    selectedProject: null,
    settings: {} as Record<ProjectType, ProjectSettings>,
    isLoading: false,
    error: null,
  });

  // Initialize service
  useEffect(() => {
    serviceRef.current = ProjectService.getInstance();

    // Subscribe to state changes
    const unsubscribe = serviceRef.current.subscribe(newState => {
      setState(newState);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  const selectProject = useCallback(async (id: ProjectType) => {
    await serviceRef.current?.selectProject(id);
  }, []);

  const getSettings = useCallback((id: ProjectType) => {
    return (
      serviceRef.current?.getSettings(id) || {
        displayMode: 'detailed' as const,
        showDebugInfo: false,
        sensitivity: 0.5,
      }
    );
  }, []);

  const updateSettings = useCallback(
    (id: ProjectType, settings: Partial<ProjectSettings>) => {
      serviceRef.current?.updateSettings(id, settings);
    },
    []
  );

  const resetSettings = useCallback((id: ProjectType) => {
    serviceRef.current?.resetSettings(id);
  }, []);

  return {
    state,
    selectedProject: state.selectedProject,
    isLoading: state.isLoading,
    error: state.error,
    projects: serviceRef.current?.getProjects() || [],
    enabledProjects: serviceRef.current?.getEnabledProjects() || [],
    selectProject,
    getSettings,
    updateSettings,
    resetSettings,
  };
}

export default useProjectService;
