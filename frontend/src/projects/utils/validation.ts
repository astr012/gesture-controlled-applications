/**
 * Project Validation Utilities
 * Provides validation functions for project modules and configurations
 */

import type { ProjectConfig, ProjectSettings, ProjectModule, ProjectMetadata } from '@/types/project';

// Validate project configuration
export const validateProjectConfig = (config: ProjectConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  if (!config.id) errors.push('Project ID is required');
  if (!config.name) errors.push('Project name is required');
  if (!config.description) errors.push('Project description is required');
  if (!config.icon) errors.push('Project icon is required');
  if (!config.category) errors.push('Project category is required');
  if (!config.loader) errors.push('Project loader function is required');
  if (!config.version) errors.push('Project version is required');
  if (!config.route) errors.push('Project route is required');

  // Type validation
  if (typeof config.enabled !== 'boolean') errors.push('Project enabled must be a boolean');
  if (config.route && !config.route.startsWith('/')) errors.push('Project route must start with "/"');

  // Category validation
  const validCategories = ['basic', 'advanced', 'experimental'];
  if (config.category && !validCategories.includes(config.category)) {
    errors.push(`Project category must be one of: ${validCategories.join(', ')}`);
  }

  // Version format validation (basic semver check)
  if (config.version && !/^\d+\.\d+\.\d+/.test(config.version)) {
    errors.push('Project version must follow semantic versioning (e.g., 1.0.0)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate project metadata
export const validateProjectMetadata = (metadata: ProjectMetadata): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!metadata.name) errors.push('Metadata name is required');
  if (!metadata.description) errors.push('Metadata description is required');
  if (!metadata.version) errors.push('Metadata version is required');
  if (!metadata.author) errors.push('Metadata author is required');
  if (!metadata.category) errors.push('Metadata category is required');
  if (!metadata.lastUpdated) errors.push('Metadata lastUpdated is required');

  // Array validation
  if (!Array.isArray(metadata.requirements)) errors.push('Requirements must be an array');
  if (!Array.isArray(metadata.features)) errors.push('Features must be an array');
  if (!Array.isArray(metadata.tags)) errors.push('Tags must be an array');

  // Compatibility validation
  if (!metadata.compatibility) {
    errors.push('Compatibility information is required');
  } else {
    if (!metadata.compatibility.minVersion) errors.push('Minimum version is required');
    if (!Array.isArray(metadata.compatibility.platforms)) errors.push('Platforms must be an array');
  }

  // Date validation
  if (metadata.lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.lastUpdated)) {
    errors.push('Last updated must be in YYYY-MM-DD format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate project settings
export const validateProjectSettings = (settings: ProjectSettings): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!settings.displayMode) errors.push('Display mode is required');
  if (typeof settings.showDebugInfo !== 'boolean') errors.push('Show debug info must be a boolean');
  if (typeof settings.sensitivity !== 'number') errors.push('Sensitivity must be a number');

  // Value validation
  if (settings.displayMode && !['compact', 'detailed'].includes(settings.displayMode)) {
    errors.push('Display mode must be "compact" or "detailed"');
  }

  if (typeof settings.sensitivity === 'number' && (settings.sensitivity < 0.1 || settings.sensitivity > 2.0)) {
    errors.push('Sensitivity must be between 0.1 and 2.0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate loaded project module
export const validateProjectModule = (module: unknown): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!module || typeof module !== 'object') {
    errors.push('Module must be an object');
    return { valid: false, errors };
  }

  const mod = module as any;

  // Check for default export (React component)
  if (!mod.default) {
    errors.push('Module must have a default export');
  } else if (typeof mod.default !== 'function' && typeof mod.default !== 'object') {
    errors.push('Default export must be a React component');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Sanitize project settings (remove invalid values, apply defaults)
export const sanitizeProjectSettings = (
  settings: Partial<ProjectSettings>,
  defaults: ProjectSettings
): ProjectSettings => {
  const sanitized: ProjectSettings = { ...defaults };

  // Sanitize display mode
  if (settings.displayMode && ['compact', 'detailed'].includes(settings.displayMode)) {
    sanitized.displayMode = settings.displayMode;
  }

  // Sanitize boolean values
  if (typeof settings.showDebugInfo === 'boolean') {
    sanitized.showDebugInfo = settings.showDebugInfo;
  }

  // Sanitize sensitivity
  if (typeof settings.sensitivity === 'number' && settings.sensitivity >= 0.1 && settings.sensitivity <= 2.0) {
    sanitized.sensitivity = settings.sensitivity;
  }

  // Copy other valid properties
  Object.keys(settings).forEach(key => {
    if (key !== 'displayMode' && key !== 'showDebugInfo' && key !== 'sensitivity') {
      const value = settings[key as keyof ProjectSettings];
      if (value !== undefined && value !== null) {
        sanitized[key] = value;
      }
    }
  });

  return sanitized;
};

// Check if project is compatible with current system
export const checkProjectCompatibility = (metadata: ProjectMetadata): { compatible: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check platform compatibility (assuming web platform)
  if (!metadata.compatibility.platforms.includes('web')) {
    issues.push('Project is not compatible with web platform');
  }

  // Check version compatibility (basic check)
  if (metadata.compatibility.minVersion) {
    // In a real implementation, you'd compare with current app version
    // For now, we'll assume compatibility
  }

  // Check requirements (basic check)
  const unsupportedRequirements = metadata.requirements.filter(req => {
    // In a real implementation, you'd check if requirements are available
    // For now, we'll assume all requirements are met
    return false;
  });

  if (unsupportedRequirements.length > 0) {
    issues.push(`Unsupported requirements: ${unsupportedRequirements.join(', ')}`);
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
};

// Generate project summary for debugging
export const generateProjectSummary = (config: ProjectConfig): string => {
  const metadata = config.metadata;

  return `Project Summary:
ID: ${config.id}
Name: ${config.name}
Version: ${config.version}
Category: ${config.category}
Enabled: ${config.enabled}
Route: ${config.route}
${metadata ? `
Author: ${metadata.author}
Last Updated: ${metadata.lastUpdated}
Requirements: ${metadata.requirements.join(', ')}
Features: ${metadata.features.join(', ')}
Tags: ${metadata.tags.join(', ')}
Platforms: ${metadata.compatibility.platforms.join(', ')}
` : ''}`;
};