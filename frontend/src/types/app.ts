import type { ProjectType } from './project-types';

// Theme system
export type Theme = 'light' | 'dark';

// Layout states
export interface LayoutState {
  sidebarCollapsed: boolean;
  headerHeight: number;
  contentPadding: number;
}

// User preferences
export interface UserPreferences {
  theme: Theme;
  sidebarCollapsed: boolean;
  defaultProject: ProjectType | null;
  showDebugInfo: boolean;
  animationsEnabled: boolean;
  autoReconnect: boolean;
}

// Application metadata
export interface AppMetadata {
  version: string;
  buildDate: string;
  environment: 'development' | 'production';
}

// Route types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  loader?: () => Promise<unknown>;
  errorElement?: React.ComponentType;
}
