/**
 * Projects - Main export file
 * Provides centralized access to all project-related functionality
 */

// Export registry
export * from './registry';

// Export utilities
export * from './utils';

// Export specific modules (for direct access if needed)
export { default as FingerCountModule } from './modules/FingerCount';
export { default as VolumeControlModule } from './modules/VolumeControl';
export { default as VirtualMouseModule } from './modules/VirtualMouse';

// Re-export commonly used items for convenience
export {
  projectRegistry,
  getProjectById,
  getEnabledProjects,
  getProjectByRoute,
  getProjectRoute,
  loadProject,
} from './registry';

export {
  projectManager,
  getAvailableProjects,
  getProjectSettings,
  updateProjectSettings,
  loadProjectModule,
} from './utils';