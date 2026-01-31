/**
 * ProjectService - Service layer for project management
 *
 * Handles project configuration, settings persistence, and state management.
 */

import {
  projectRegistry,
  getProjectById,
  getEnabledProjects,
  loadProject,
} from '@/projects/registry';
import type { ProjectConfig, ProjectSettings } from '@/types/project';
import type { ProjectType } from '@/types/project-types';

const SETTINGS_STORAGE_KEY = 'gesture_project_settings';

export interface ProjectState {
  selectedProject: ProjectType | null;
  settings: Record<ProjectType, ProjectSettings>;
  isLoading: boolean;
  error: string | null;
}

type ProjectStateCallback = (state: ProjectState) => void;

class ProjectService {
  private static instance: ProjectService | null = null;
  private state: ProjectState = {
    selectedProject: null,
    settings: {} as Record<ProjectType, ProjectSettings>,
    isLoading: false,
    error: null,
  };
  private subscribers: Set<ProjectStateCallback> = new Set();

  private constructor() {
    this.loadPersistedSettings();
  }

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  private loadPersistedSettings(): void {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state.settings = parsed;
      }
    } catch (error) {
      console.warn('Failed to load persisted project settings:', error);
    }
  }

  private persistSettings(): void {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(this.state.settings)
      );
    } catch (error) {
      console.warn('Failed to persist project settings:', error);
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('Error in project state subscriber:', error);
      }
    });
  }

  // Public API

  /**
   * Get all available projects
   */
  getProjects(): ProjectConfig[] {
    return projectRegistry.projects;
  }

  /**
   * Get enabled projects only
   */
  getEnabledProjects(): ProjectConfig[] {
    return getEnabledProjects();
  }

  /**
   * Get a specific project by ID
   */
  getProject(id: ProjectType): ProjectConfig | undefined {
    return getProjectById(id);
  }

  /**
   * Select a project
   */
  async selectProject(id: ProjectType): Promise<void> {
    const project = getProjectById(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }
    if (!project.enabled) {
      throw new Error(`Project is disabled: ${id}`);
    }

    this.state = { ...this.state, isLoading: true, error: null };
    this.notifySubscribers();

    try {
      // Lazy load the project module
      await loadProject(id);

      // Initialize settings if not already set
      if (!this.state.settings[id]) {
        this.state.settings[id] = { ...project.defaultSettings };
      }

      this.state = {
        ...this.state,
        selectedProject: id,
        isLoading: false,
      };
      this.notifySubscribers();
    } catch (error) {
      this.state = {
        ...this.state,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to load project',
      };
      this.notifySubscribers();
      throw error;
    }
  }

  /**
   * Get settings for a project
   */
  getSettings(id: ProjectType): ProjectSettings {
    const project = getProjectById(id);
    return (
      this.state.settings[id] ||
      project?.defaultSettings || {
        displayMode: 'detailed',
        showDebugInfo: false,
        sensitivity: 0.5,
      }
    );
  }

  /**
   * Update settings for a project
   */
  updateSettings(id: ProjectType, settings: Partial<ProjectSettings>): void {
    const currentSettings = this.getSettings(id);
    this.state.settings[id] = { ...currentSettings, ...settings };
    this.persistSettings();
    this.notifySubscribers();
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(id: ProjectType): void {
    const project = getProjectById(id);
    if (project) {
      this.state.settings[id] = { ...project.defaultSettings };
      this.persistSettings();
      this.notifySubscribers();
    }
  }

  /**
   * Get current state
   */
  getState(): ProjectState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: ProjectStateCallback): () => void {
    this.subscribers.add(callback);
    // Immediately notify with current state
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

export default ProjectService;
