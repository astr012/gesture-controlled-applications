/**
 * Project Utilities - Centralized exports
 */

// Export validation utilities
export * from './validation';

// Export manager utilities
export * from './manager';

// Re-export commonly used functions for convenience
export {
  validateProjectConfig,
  validateProjectSettings,
  sanitizeProjectSettings,
  checkProjectCompatibility,
} from './validation';

export {
  projectManager,
  getAvailableProjects,
  getProjectSettings,
  updateProjectSettings,
  resetProjectSettings,
  loadProjectModule,
  searchProjects,
  preloadProjects,
} from './manager';