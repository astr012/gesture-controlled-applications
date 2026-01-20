/**
 * Project Registry - Central configuration for all gesture projects
 * Supports lazy loading, code splitting, validation, and error handling
 */

import { lazy } from 'react';
import type {
  ProjectType,
  ProjectConfig,
  ProjectModule,
  ProjectDisplayProps,
  ProjectSettingsProps,
  ProjectMetadata,
  ProjectSettings,
  ProjectRegistry,
  ProjectError
} from '@/types/project';

// Lazy load project modules for code splitting
const FingerCountModule = lazy(() => import('@/projects/modules/FingerCount'));
const VolumeControlModule = lazy(() => import('@/projects/modules/VolumeControl'));
const VirtualMouseModule = lazy(() => import('@/projects/modules/VirtualMouse'));

// Default project settings factory
const createDefaultSettings = (overrides: Partial<ProjectSettings> = {}): ProjectSettings => ({
  displayMode: 'detailed',
  showDebugInfo: false,
  sensitivity: 0.5,
  ...overrides,
});

// Project metadata definitions
const projectMetadata: Record<ProjectType, ProjectMetadata> = {
  finger_count: {
    name: 'Finger Counting',
    description: 'Real-time finger detection and counting with hand tracking using MediaPipe',
    version: '1.0.0',
    author: 'Gesture Control Platform',
    category: 'basic',
    requirements: ['MediaPipe', 'Hand Tracking'],
    features: ['Real-time Detection', 'Multi-hand Support', 'Confidence Scoring'],
    tags: ['fingers', 'counting', 'basic', 'hand-tracking'],
    documentation: '/docs/projects/finger-count',
    lastUpdated: '2024-01-11',
    compatibility: {
      minVersion: '1.0.0',
      platforms: ['web', 'desktop'],
    },
  },
  volume_control: {
    name: 'Volume Control',
    description: 'Control system volume using intuitive hand gestures',
    version: '1.0.0',
    author: 'Gesture Control Platform',
    category: 'basic',
    requirements: ['MediaPipe', 'System Audio API'],
    features: ['Volume Adjustment', 'Mute Control', 'Visual Feedback'],
    tags: ['volume', 'audio', 'control', 'system'],
    documentation: '/docs/projects/volume-control',
    lastUpdated: '2024-01-11',
    compatibility: {
      minVersion: '1.0.0',
      platforms: ['web', 'desktop'],
    },
  },
  virtual_mouse: {
    name: 'Virtual Mouse',
    description: 'Control cursor and clicks with precise hand movements',
    version: '1.0.0',
    author: 'Gesture Control Platform',
    category: 'advanced',
    requirements: ['MediaPipe', 'Cursor Control API'],
    features: ['Cursor Movement', 'Click Gestures', 'Smoothing', 'Calibration'],
    tags: ['mouse', 'cursor', 'advanced', 'precision'],
    documentation: '/docs/projects/virtual-mouse',
    lastUpdated: '2024-01-11',
    compatibility: {
      minVersion: '1.0.0',
      platforms: ['web', 'desktop'],
    },
  },
};

// Module validation function
const validateProjectModule = (module: unknown): module is { default: React.ComponentType<ProjectDisplayProps> } => {
  if (!module || typeof module !== 'object') return false;
  const mod = module as any;
  return (
    typeof mod.default === 'function' ||
    (typeof mod.default === 'object' && typeof mod.default.type === 'function')
  );
};

// Project registry configuration with enhanced metadata
export const projectConfigs: ProjectConfig[] = [
  {
    id: 'finger_count',
    name: 'Finger Counting',
    description: 'Real-time finger detection and counting with hand tracking',
    icon: '✋',
    category: 'basic',
    loader: () => FingerCountModule,
    enabled: true,
    version: '1.0.0',
    route: '/project/finger-count',
    metadata: projectMetadata.finger_count,
    defaultSettings: createDefaultSettings(),
    validateModule: validateProjectModule,
  },
  {
    id: 'volume_control',
    name: 'Volume Control',
    description: 'Control system volume using hand gestures',
    icon: '🔊',
    category: 'basic',
    loader: () => VolumeControlModule,
    enabled: true,
    version: '1.0.0',
    route: '/project/volume-control',
    metadata: projectMetadata.volume_control,
    defaultSettings: createDefaultSettings({ volumeStep: 5 }),
    validateModule: validateProjectModule,
  },
  {
    id: 'virtual_mouse',
    name: 'Virtual Mouse',
    description: 'Control cursor and clicks with hand movements',
    icon: '🖱️',
    category: 'advanced',
    loader: () => VirtualMouseModule,
    enabled: true,
    version: '1.0.0',
    route: '/project/virtual-mouse',
    metadata: projectMetadata.virtual_mouse,
    defaultSettings: createDefaultSettings({
      sensitivity: 1.0,
      smoothing: false,
      clickEnabled: true
    }),
    validateModule: validateProjectModule,
  },
];

// Enhanced project registry implementation
class ProjectRegistryImpl implements ProjectRegistry {
  private _projects: ProjectConfig[] = [...projectConfigs];

  get projects(): ProjectConfig[] {
    return [...this._projects];
  }

  getProject(id: ProjectType): ProjectConfig | undefined {
    return this._projects.find(project => project.id === id);
  }

  getEnabledProjects(): ProjectConfig[] {
    return this._projects.filter(project => project.enabled);
  }

  getProjectByRoute(route: string): ProjectConfig | undefined {
    return this._projects.find(project => project.route === route);
  }

  validateProject(config: ProjectConfig): boolean {
    // Basic validation
    if (!config.id || !config.name || !config.loader) {
      return false;
    }

    // Check for duplicate IDs
    const existingProject = this._projects.find(p => p.id === config.id);
    if (existingProject) {
      return false;
    }

    // Validate route format
    if (!config.route || !config.route.startsWith('/')) {
      return false;
    }

    // Check for duplicate routes
    const existingRoute = this._projects.find(p => p.route === config.route);
    if (existingRoute) {
      return false;
    }

    return true;
  }

  registerProject(config: ProjectConfig): boolean {
    if (!this.validateProject(config)) {
      return false;
    }

    this._projects.push(config);
    return true;
  }

  unregisterProject(id: ProjectType): boolean {
    const index = this._projects.findIndex(project => project.id === id);
    if (index === -1) {
      return false;
    }

    this._projects.splice(index, 1);
    return true;
  }
}

// Create singleton registry instance
export const projectRegistry = new ProjectRegistryImpl();

// Helper functions for backward compatibility and convenience
export const getProjectById = (id: ProjectType): ProjectConfig | undefined => {
  return projectRegistry.getProject(id);
};

export const getEnabledProjects = (): ProjectConfig[] => {
  return projectRegistry.getEnabledProjects();
};

export const getProjectByRoute = (route: string): ProjectConfig | undefined => {
  return projectRegistry.getProjectByRoute(route);
};

export const getProjectRoute = (id: ProjectType): string => {
  const project = getProjectById(id);
  return project?.route || '/';
};

export const getProjectMetadata = (id: ProjectType): ProjectMetadata | undefined => {
  const project = getProjectById(id);
  return project?.metadata;
};

// Project loading utilities
export const loadProject = async (id: ProjectType): Promise<{ default: React.ComponentType<ProjectDisplayProps> }> => {
  const project = getProjectById(id);
  if (!project) {
    throw new Error(`Project not found: ${id}`);
  }

  if (!project.enabled) {
    throw new Error(`Project is disabled: ${id}`);
  }

  try {
    const module = await project.loader();

    // Validate the loaded module
    if (project.validateModule && !project.validateModule(module)) {
      throw new Error(`Invalid project module: ${id}`);
    }

    return module;
  } catch (error) {
    console.error(`Failed to load project ${id}:`, error);
    throw new Error(`Failed to load project: ${id}`);
  }
};

// URL conversion utilities
export const projectIdToUrl = (id: ProjectType): string => {
  const urlMap: Record<ProjectType, string> = {
    finger_count: 'finger-count',
    volume_control: 'volume-control',
    virtual_mouse: 'virtual-mouse',
  };
  return urlMap[id] || id;
};

export const urlToProjectId = (url: string): ProjectType | null => {
  const idMap: Record<string, ProjectType> = {
    'finger-count': 'finger_count',
    'volume-control': 'volume_control',
    'virtual-mouse': 'virtual_mouse',
  };
  return idMap[url] || null;
};

// Error handling utilities
export const createProjectError = (
  code: string,
  message: string,
  details?: string,
  recoverable: boolean = true
): ProjectError => ({
  code,
  message,
  details,
  recoverable,
});

// Export types for external use
export type { ProjectConfig, ProjectRegistry, ProjectError };