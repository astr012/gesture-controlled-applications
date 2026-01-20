/**
 * Project Manager Utilities
 * Provides high-level project management functionality
 */

import type { ProjectType, ProjectConfig, ProjectSettings, ProjectError } from '@/types/project';
import { projectRegistry, loadProject, getProjectById } from '@/projects/registry';
import { validateProjectConfig, validateProjectSettings, sanitizeProjectSettings } from './validation';

// Project manager class for centralized project operations
export class ProjectManager {
  private static instance: ProjectManager;
  private loadedProjects: Map<ProjectType, any> = new Map();
  private projectSettings: Map<ProjectType, ProjectSettings> = new Map();

  private constructor() { }

  static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  // Get all available projects
  getAvailableProjects(): ProjectConfig[] {
    return projectRegistry.getEnabledProjects();
  }

  // Get project by ID with validation
  getProject(id: ProjectType): ProjectConfig | null {
    const project = getProjectById(id);
    if (!project) return null;

    const validation = validateProjectConfig(project);
    if (!validation.valid) {
      console.warn(`Project ${id} has validation errors:`, validation.errors);
      return null;
    }

    return project;
  }

  // Load project module with caching
  async loadProjectModule(id: ProjectType): Promise<any> {
    // Check cache first
    if (this.loadedProjects.has(id)) {
      return this.loadedProjects.get(id);
    }

    try {
      const module = await loadProject(id);
      this.loadedProjects.set(id, module);
      return module;
    } catch (error) {
      console.error(`Failed to load project ${id}:`, error);
      throw this.createProjectError(
        'LOAD_FAILED',
        `Failed to load project: ${id}`,
        error instanceof Error ? error.message : 'Unknown error',
        true
      );
    }
  }

  // Get project settings with defaults
  getProjectSettings(id: ProjectType): ProjectSettings {
    const project = this.getProject(id);
    if (!project) {
      throw this.createProjectError(
        'PROJECT_NOT_FOUND',
        `Project not found: ${id}`,
        undefined,
        false
      );
    }

    // Return cached settings or defaults
    return this.projectSettings.get(id) || project.defaultSettings;
  }

  // Update project settings with validation
  updateProjectSettings(id: ProjectType, settings: Partial<ProjectSettings>): ProjectSettings {
    const project = this.getProject(id);
    if (!project) {
      throw this.createProjectError(
        'PROJECT_NOT_FOUND',
        `Project not found: ${id}`,
        undefined,
        false
      );
    }

    const currentSettings = this.getProjectSettings(id);
    const newSettings = { ...currentSettings, ...settings };

    // Validate settings
    const validation = validateProjectSettings(newSettings);
    if (!validation.valid) {
      console.warn(`Invalid settings for project ${id}:`, validation.errors);
      // Sanitize settings instead of throwing error
      const sanitizedSettings = sanitizeProjectSettings(newSettings, project.defaultSettings);
      this.projectSettings.set(id, sanitizedSettings);
      return sanitizedSettings;
    }

    this.projectSettings.set(id, newSettings);
    return newSettings;
  }

  // Reset project settings to defaults
  resetProjectSettings(id: ProjectType): ProjectSettings {
    const project = this.getProject(id);
    if (!project) {
      throw this.createProjectError(
        'PROJECT_NOT_FOUND',
        `Project not found: ${id}`,
        undefined,
        false
      );
    }

    this.projectSettings.set(id, project.defaultSettings);
    return project.defaultSettings;
  }

  // Clear project cache
  clearProjectCache(id?: ProjectType): void {
    if (id) {
      this.loadedProjects.delete(id);
      this.projectSettings.delete(id);
    } else {
      this.loadedProjects.clear();
      this.projectSettings.clear();
    }
  }

  // Get project statistics
  getProjectStats(): {
    totalProjects: number;
    enabledProjects: number;
    loadedProjects: number;
    projectsByCategory: Record<string, number>;
  } {
    const allProjects = projectRegistry.projects;
    const enabledProjects = projectRegistry.getEnabledProjects();

    const projectsByCategory = allProjects.reduce((acc, project) => {
      acc[project.category] = (acc[project.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProjects: allProjects.length,
      enabledProjects: enabledProjects.length,
      loadedProjects: this.loadedProjects.size,
      projectsByCategory,
    };
  }

  // Search projects by criteria
  searchProjects(criteria: {
    query?: string;
    category?: string;
    tags?: string[];
    enabled?: boolean;
  }): ProjectConfig[] {
    let projects = projectRegistry.projects;

    // Filter by enabled status
    if (criteria.enabled !== undefined) {
      projects = projects.filter(p => p.enabled === criteria.enabled);
    }

    // Filter by category
    if (criteria.category) {
      projects = projects.filter(p => p.category === criteria.category);
    }

    // Filter by query (name or description)
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      projects = projects.filter(p =>
        p.metadata?.tags.some(tag => criteria.tags!.includes(tag))
      );
    }

    return projects;
  }

  // Preload projects for better performance
  async preloadProjects(projectIds: ProjectType[]): Promise<void> {
    const loadPromises = projectIds.map(async (id) => {
      try {
        await this.loadProjectModule(id);
      } catch (error) {
        console.warn(`Failed to preload project ${id}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  // Create standardized project error
  private createProjectError(
    code: string,
    message: string,
    details?: string,
    recoverable: boolean = true
  ): ProjectError {
    return {
      code,
      message,
      details,
      recoverable,
    };
  }

  // Export project configuration for debugging
  exportProjectConfig(id: ProjectType): string {
    const project = this.getProject(id);
    if (!project) {
      throw this.createProjectError(
        'PROJECT_NOT_FOUND',
        `Project not found: ${id}`,
        undefined,
        false
      );
    }

    const settings = this.getProjectSettings(id);
    const isLoaded = this.loadedProjects.has(id);

    return JSON.stringify({
      project: {
        id: project.id,
        name: project.name,
        version: project.version,
        category: project.category,
        enabled: project.enabled,
        route: project.route,
        metadata: project.metadata,
      },
      settings,
      status: {
        loaded: isLoaded,
        cached: this.projectSettings.has(id),
      },
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}

// Export singleton instance
export const projectManager = ProjectManager.getInstance();

// Convenience functions
export const getAvailableProjects = () => projectManager.getAvailableProjects();
export const getProjectSettings = (id: ProjectType) => projectManager.getProjectSettings(id);
export const updateProjectSettings = (id: ProjectType, settings: Partial<ProjectSettings>) =>
  projectManager.updateProjectSettings(id, settings);
export const resetProjectSettings = (id: ProjectType) => projectManager.resetProjectSettings(id);
export const loadProjectModule = (id: ProjectType) => projectManager.loadProjectModule(id);
export const searchProjects = (criteria: Parameters<typeof projectManager.searchProjects>[0]) =>
  projectManager.searchProjects(criteria);
export const preloadProjects = (projectIds: ProjectType[]) => projectManager.preloadProjects(projectIds);