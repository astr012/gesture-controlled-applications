import type { ProjectType, ProjectCategory } from './project-types';
import type { GestureData } from './gesture';

// Enhanced project metadata with comprehensive information
export interface ProjectMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  category: ProjectCategory;
  requirements: string[];
  features: string[];
  tags: string[];
  documentation?: string;
  repository?: string;
  license?: string;
  lastUpdated: string;
  compatibility: {
    minVersion: string;
    maxVersion?: string;
    platforms: string[];
  };
}

// Enhanced project configuration with routing and lazy loading
export interface ProjectConfig {
  id: ProjectType;
  name: string;
  description: string;
  icon: string;
  category: ProjectCategory;
  loader: () => Promise<{ default: React.ComponentType<ProjectDisplayProps> }>;
  enabled: boolean;
  version: string;
  route: string;
  metadata?: ProjectMetadata;
  defaultSettings: ProjectSettings;
  // Validation function to check if project module conforms to interface
  validateModule?: (module: unknown) => boolean;
}

// Enhanced project settings with validation
export interface ProjectSettings {
  displayMode: 'compact' | 'detailed';
  showDebugInfo: boolean;
  sensitivity: number;
  [key: string]: unknown; // Project-specific settings
}

// Standard project interface all projects must implement
export interface ProjectDisplayProps {
  gestureData: GestureData | null;
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
}

export interface ProjectSettingsProps {
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
  onReset: () => void;
}

// Project module export interface with enhanced metadata
export interface ProjectModule {
  DisplayComponent: React.ComponentType<ProjectDisplayProps>;
  SettingsComponent?: React.ComponentType<ProjectSettingsProps>;
  metadata: ProjectMetadata;
  defaultSettings: ProjectSettings;
  // Optional validation function for settings
  validateSettings?: (settings: ProjectSettings) => boolean;
  // Optional initialization function
  initialize?: () => Promise<void>;
  // Optional cleanup function
  cleanup?: () => Promise<void>;
}

// Project loading states
export type ProjectLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

// Project error types
export interface ProjectError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
}

// Project registry interface for managing projects
export interface ProjectRegistry {
  projects: ProjectConfig[];
  getProject: (id: ProjectType) => ProjectConfig | undefined;
  getEnabledProjects: () => ProjectConfig[];
  getProjectByRoute: (route: string) => ProjectConfig | undefined;
  validateProject: (config: ProjectConfig) => boolean;
  registerProject: (config: ProjectConfig) => boolean;
  unregisterProject: (id: ProjectType) => boolean;
}
