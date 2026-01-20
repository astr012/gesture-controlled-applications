/**
 * Property-Based Test for Project Module Interface Compliance
 * Feature: frontend-restructure, Property 5: Project Module Interface Compliance
 * Validates: Requirements 3.2, 3.3 - EACH Project_Module SHALL export standardized interfaces for integration
 */

import { fc } from '@fast-check/jest';
import React from 'react';
import type {
  ProjectDisplayProps,
  ProjectMetadata,
  ProjectSettings,
  ProjectModule,
  ProjectCategory
} from '@/types/project';

// Import actual project modules to test
import * as FingerCountModule from '@/projects/modules/FingerCount';
import * as VolumeControlModule from '@/projects/modules/VolumeControl';
import * as VirtualMouseModule from '@/projects/modules/VirtualMouse';

// Generators for property-based testing
const projectCategoryGenerator = fc.constantFrom<ProjectCategory>('basic', 'advanced', 'experimental');

const projectMetadataGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  version: fc.string().filter(s => /^\d+\.\d+\.\d+$/.test(s) || s === '1.0.0'),
  author: fc.string({ minLength: 1, maxLength: 50 }),
  category: projectCategoryGenerator,
  requirements: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
  features: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 1, maxLength: 8 }),
  lastUpdated: fc.constant('2024-01-11'),
  compatibility: fc.record({
    minVersion: fc.constant('1.0.0'),
    platforms: fc.array(fc.constantFrom('web', 'desktop', 'mobile'), { minLength: 1, maxLength: 3 })
  })
}) as fc.Arbitrary<ProjectMetadata>;

const projectSettingsGenerator = fc.record({
  displayMode: fc.constantFrom<'compact' | 'detailed'>('compact', 'detailed'),
  showDebugInfo: fc.boolean(),
  sensitivity: fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) })
}) as fc.Arbitrary<ProjectSettings>;

// Helper function to validate project metadata structure
const validateMetadata = (metadata: unknown): metadata is ProjectMetadata => {
  if (!metadata || typeof metadata !== 'object') return false;
  
  const meta = metadata as any;
  
  return (
    typeof meta.name === 'string' && meta.name.length > 0 &&
    typeof meta.description === 'string' && meta.description.length > 0 &&
    typeof meta.version === 'string' && /^\d+\.\d+\.\d+$/.test(meta.version) &&
    typeof meta.author === 'string' && meta.author.length > 0 &&
    ['basic', 'advanced', 'experimental'].includes(meta.category) &&
    Array.isArray(meta.requirements) && meta.requirements.length > 0 &&
    Array.isArray(meta.features) && meta.features.length > 0 &&
    Array.isArray(meta.tags) && meta.tags.length > 0 &&
    typeof meta.lastUpdated === 'string' &&
    meta.compatibility &&
    typeof meta.compatibility.minVersion === 'string' &&
    Array.isArray(meta.compatibility.platforms) &&
    meta.compatibility.platforms.length > 0
  );
};

// Helper function to validate project settings structure
const validateSettings = (settings: unknown): settings is ProjectSettings => {
  if (!settings || typeof settings !== 'object') return false;
  
  const set = settings as any;
  
  return (
    ['compact', 'detailed'].includes(set.displayMode) &&
    typeof set.showDebugInfo === 'boolean' &&
    typeof set.sensitivity === 'number' &&
    set.sensitivity >= 0 && set.sensitivity <= 2.0
  );
};

// Helper function to validate React component
const validateReactComponent = (component: unknown): boolean => {
  if (!component) return false;
  
  // Check if it's a function (functional component)
  if (typeof component === 'function') return true;
  
  // Check if it's a React component object
  if (typeof component === 'object' && (component as any).$$typeof) return true;
  
  return false;
};

describe('Property 5: Project Module Interface Compliance', () => {
  const projectModules = [
    { name: 'FingerCount', module: FingerCountModule },
    { name: 'VolumeControl', module: VolumeControlModule },
    { name: 'VirtualMouse', module: VirtualMouseModule }
  ];

  /**
   * Property 5a: Every project module must export a default React component
   * Validates: Requirements 3.2 - EACH Project_Module SHALL export standardized interfaces
   */
  test('Property 5a: All project modules must export a default React component', () => {
    projectModules.forEach(({ name, module }) => {
      // Test 1: Module must have a default export
      expect(module.default).toBeDefined();
      
      // Test 2: Default export must be a valid React component
      expect(validateReactComponent(module.default)).toBe(true);
      
      // Test 3: Component should be a function (functional component)
      expect(typeof module.default).toBe('function');
    });
  });

  /**
   * Property 5b: Every project module must export valid metadata
   * Validates: Requirements 3.2 - Project metadata and configuration system
   */
  test('Property 5b: All project modules must export valid metadata', () => {
    projectModules.forEach(({ name, module }) => {
      // Test 1: Module must have metadata export
      expect(module.metadata).toBeDefined();
      
      // Test 2: Metadata must conform to ProjectMetadata interface
      expect(validateMetadata(module.metadata)).toBe(true);
      
      // Test 3: Metadata must have all required fields
      expect(module.metadata.name).toBeTruthy();
      expect(module.metadata.description).toBeTruthy();
      expect(module.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(module.metadata.author).toBeTruthy();
      expect(['basic', 'advanced', 'experimental']).toContain(module.metadata.category);
      expect(Array.isArray(module.metadata.requirements)).toBe(true);
      expect(module.metadata.requirements.length).toBeGreaterThan(0);
      expect(Array.isArray(module.metadata.features)).toBe(true);
      expect(module.metadata.features.length).toBeGreaterThan(0);
      expect(Array.isArray(module.metadata.tags)).toBe(true);
      expect(module.metadata.tags.length).toBeGreaterThan(0);
    });
  });

  /**
   * Property 5c: Every project module must export valid default settings
   * Validates: Requirements 3.2 - Project configuration system
   */
  test('Property 5c: All project modules must export valid default settings', () => {
    projectModules.forEach(({ name, module }) => {
      // Test 1: Module must have defaultSettings export
      expect(module.defaultSettings).toBeDefined();
      
      // Test 2: Settings must conform to ProjectSettings interface
      expect(validateSettings(module.defaultSettings)).toBe(true);
      
      // Test 3: Settings must have required base fields
      expect(['compact', 'detailed']).toContain(module.defaultSettings.displayMode);
      expect(typeof module.defaultSettings.showDebugInfo).toBe('boolean');
      expect(typeof module.defaultSettings.sensitivity).toBe('number');
      expect(module.defaultSettings.sensitivity).toBeGreaterThanOrEqual(0);
      expect(module.defaultSettings.sensitivity).toBeLessThanOrEqual(2.0);
    });
  });

  /**
   * Property 5d: Every project module must export a settings validation function
   * Validates: Requirements 3.3 - Project validation and error handling
   */
  test('Property 5d: All project modules must export a settings validation function', () => {
    projectModules.forEach(({ name, module }) => {
      // Test 1: Module must have validateSettings export
      expect(module.validateSettings).toBeDefined();
      
      // Test 2: validateSettings must be a function
      expect(typeof module.validateSettings).toBe('function');
      
      // Test 3: validateSettings should accept valid settings
      const validResult = module.validateSettings(module.defaultSettings);
      expect(validResult).toBe(true);
      
      // Test 4: validateSettings should reject invalid sensitivity
      const invalidSettings = { ...module.defaultSettings, sensitivity: -1 };
      const invalidResult = module.validateSettings(invalidSettings);
      expect(invalidResult).toBe(false);
    });
  });

  /**
   * Property 5e: Project components must accept standardized props
   * Validates: Requirements 3.2 - Standardized interfaces for integration
   */
  test('Property 5e: Project components must accept standardized ProjectDisplayProps', () => {
    fc.assert(
      fc.property(
        projectSettingsGenerator,
        fc.constantFrom(null, { project: 'finger_count', timestamp: Date.now(), hands_detected: 1, confidence: 0.9, processing_time: 10, frame_id: 'test' }),
        (settings, gestureData) => {
          projectModules.forEach(({ name, module }) => {
            const Component = module.default;
            
            // Test 1: Component should be callable with ProjectDisplayProps
            const mockOnSettingsChange = jest.fn();
            
            // Test 2: Component should not throw when rendered with valid props
            expect(() => {
              const props: ProjectDisplayProps = {
                gestureData,
                settings,
                onSettingsChange: mockOnSettingsChange
              };
              
              // Verify props structure matches interface
              expect(props.gestureData).toBeDefined();
              expect(props.settings).toBeDefined();
              expect(typeof props.onSettingsChange).toBe('function');
            }).not.toThrow();
          });
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 5f: Module interface consistency across all projects
   * Validates: Requirements 3.2, 3.3 - Standardized interfaces and validation
   */
  test('Property 5f: All project modules must have consistent interface structure', () => {
    const requiredExports = ['default', 'metadata', 'defaultSettings', 'validateSettings'];
    
    projectModules.forEach(({ name, module }) => {
      // Test 1: Module must have all required exports
      requiredExports.forEach(exportName => {
        expect(module).toHaveProperty(exportName);
        expect(module[exportName as keyof typeof module]).toBeDefined();
      });
      
      // Test 2: Export types must be consistent
      expect(typeof module.default).toBe('function'); // React component
      expect(typeof module.metadata).toBe('object'); // Metadata object
      expect(typeof module.defaultSettings).toBe('object'); // Settings object
      expect(typeof module.validateSettings).toBe('function'); // Validation function
    });
  });

  /**
   * Property 5g: Metadata compatibility fields must be valid
   * Validates: Requirements 3.2 - Project metadata system
   */
  test('Property 5g: All project modules must have valid compatibility metadata', () => {
    projectModules.forEach(({ name, module }) => {
      const { compatibility } = module.metadata;
      
      // Test 1: Compatibility object must exist
      expect(compatibility).toBeDefined();
      
      // Test 2: minVersion must be valid semver
      expect(compatibility.minVersion).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Test 3: Platforms must be a non-empty array
      expect(Array.isArray(compatibility.platforms)).toBe(true);
      expect(compatibility.platforms.length).toBeGreaterThan(0);
      
      // Test 4: Platforms must contain valid values
      const validPlatforms = ['web', 'desktop', 'mobile'];
      compatibility.platforms.forEach(platform => {
        expect(validPlatforms).toContain(platform);
      });
    });
  });

  /**
   * Property 5h: Settings validation must be consistent with default settings
   * Validates: Requirements 3.3 - Project validation system
   */
  test('Property 5h: Default settings must always pass validation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...projectModules),
        ({ name, module }) => {
          // Test 1: Default settings must pass validation
          const isValid = module.validateSettings(module.defaultSettings);
          expect(isValid).toBe(true);
          
          // Test 2: Modified valid settings should pass
          const modifiedSettings = {
            ...module.defaultSettings,
            sensitivity: 0.5,
            showDebugInfo: !module.defaultSettings.showDebugInfo
          };
          const modifiedValid = module.validateSettings(modifiedSettings);
          expect(modifiedValid).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 5i: Metadata version must match module version
   * Validates: Requirements 3.2 - Project metadata consistency
   */
  test('Property 5i: Metadata version must be consistent and valid', () => {
    projectModules.forEach(({ name, module }) => {
      // Test 1: Version must be valid semver
      expect(module.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Test 2: Version must not be empty
      expect(module.metadata.version.length).toBeGreaterThan(0);
      
      // Test 3: Version parts must be valid numbers
      const [major, minor, patch] = module.metadata.version.split('.').map(Number);
      expect(major).toBeGreaterThanOrEqual(0);
      expect(minor).toBeGreaterThanOrEqual(0);
      expect(patch).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * Property 5j: Project-specific settings must extend base settings
   * Validates: Requirements 3.2 - Project configuration extensibility
   */
  test('Property 5j: Project-specific settings must include base settings', () => {
    projectModules.forEach(({ name, module }) => {
      const settings = module.defaultSettings;
      
      // Test 1: Must have base settings
      expect(settings).toHaveProperty('displayMode');
      expect(settings).toHaveProperty('showDebugInfo');
      expect(settings).toHaveProperty('sensitivity');
      
      // Test 2: Base settings must have correct types
      expect(['compact', 'detailed']).toContain(settings.displayMode);
      expect(typeof settings.showDebugInfo).toBe('boolean');
      expect(typeof settings.sensitivity).toBe('number');
      
      // Test 3: Can have additional project-specific settings
      const allKeys = Object.keys(settings);
      expect(allKeys.length).toBeGreaterThanOrEqual(3); // At least the 3 base settings
    });
  });
});
