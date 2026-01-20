/**
 * Property-Based Test for Project Extensibility
 * Feature: frontend-restructure, Property 19: Project Extensibility
 * Validates: Requirements 8.4 - THE System SHALL support easy addition of new gesture projects through configuration
 */

import { fc } from '@fast-check/jest';
import { 
  projectRegistry, 
  ProjectConfig, 
  ProjectType, 
  ProjectCategory,
  ProjectMetadata,
  ProjectSettings,
  ProjectDisplayProps
} from '@/projects';
import React from 'react';

// Test component that conforms to project interface
const TestProjectComponent: React.FC<ProjectDisplayProps> = ({ gestureData, settings, onSettingsChange }) => {
  return (
    <div data-testid="test-project">
      <div>Gesture Data: {gestureData ? 'Present' : 'None'}</div>
      <div>Display Mode: {settings.displayMode}</div>
      <button onClick={() => onSettingsChange({ ...settings, showDebugInfo: !settings.showDebugInfo })}>
        Toggle Debug
      </button>
    </div>
  );
};

// Generators for property-based testing
const projectIdGenerator = fc.string({ minLength: 3, maxLength: 20 })
  .filter(s => /^[a-z][a-z0-9_]*$/.test(s))
  .map(s => s as ProjectType);

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
  sensitivity: fc.float({ min: 0, max: 1 })
}) as fc.Arbitrary<ProjectSettings>;

const projectConfigGenerator = fc.record({
  id: projectIdGenerator,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  icon: fc.constantFrom('🎯', '🚀', '⚡', '🔧', '🎨', '📊'),
  category: projectCategoryGenerator,
  loader: fc.constant(() => Promise.resolve({ default: TestProjectComponent })),
  enabled: fc.boolean(),
  version: fc.constant('1.0.0'),
  route: fc.string({ minLength: 1, maxLength: 30 }).map(s => `/${s.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`),
  metadata: projectMetadataGenerator,
  defaultSettings: projectSettingsGenerator,
  validateModule: fc.constant((module: unknown) => {
    if (!module || typeof module !== 'object') return false;
    const mod = module as any;
    return typeof mod.default === 'function';
  })
}) as fc.Arbitrary<ProjectConfig>;

describe('Property 19: Project Extensibility', () => {
  beforeEach(() => {
    // Reset registry to initial state before each test
    const initialProjects = ['finger_count', 'volume_control', 'virtual_mouse'] as ProjectType[];
    const currentProjects = projectRegistry.projects.map(p => p.id);
    
    // Remove any test projects that might have been added
    currentProjects.forEach(id => {
      if (!initialProjects.includes(id)) {
        projectRegistry.unregisterProject(id);
      }
    });
  });

  /**
   * Property 19: Project Extensibility
   * For any new project added to the registry configuration, 
   * it should be discoverable and loadable through the standard project loading mechanism
   * Validates: Requirements 8.4
   */
  test('Property 19: Any valid project configuration should be registerable and discoverable', () => {
    fc.assert(
      fc.property(projectConfigGenerator, (projectConfig) => {
        // Ensure unique ID and route to avoid conflicts
        const uniqueId = `test_${projectConfig.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ProjectType;
        const uniqueRoute = `/test${projectConfig.route}/${Date.now()}`;
        
        const testConfig: ProjectConfig = {
          ...projectConfig,
          id: uniqueId,
          route: uniqueRoute
        };

        // Test 1: Project should be registerable
        const registrationResult = projectRegistry.registerProject(testConfig);
        expect(registrationResult).toBe(true);

        // Test 2: Project should be discoverable by ID
        const retrievedProject = projectRegistry.getProject(uniqueId);
        expect(retrievedProject).toBeDefined();
        expect(retrievedProject?.id).toBe(uniqueId);
        expect(retrievedProject?.name).toBe(testConfig.name);

        // Test 3: Project should be discoverable by route
        const projectByRoute = projectRegistry.getProjectByRoute(uniqueRoute);
        expect(projectByRoute).toBeDefined();
        expect(projectByRoute?.id).toBe(uniqueId);

        // Test 4: If enabled, project should appear in enabled projects list
        const enabledProjects = projectRegistry.getEnabledProjects();
        if (testConfig.enabled) {
          expect(enabledProjects.some(p => p.id === uniqueId)).toBe(true);
        } else {
          expect(enabledProjects.some(p => p.id === uniqueId)).toBe(false);
        }

        // Test 5: Project should be unregisterable
        const unregistrationResult = projectRegistry.unregisterProject(uniqueId);
        expect(unregistrationResult).toBe(true);

        // Test 6: After unregistration, project should not be discoverable
        const retrievedAfterUnregister = projectRegistry.getProject(uniqueId);
        expect(retrievedAfterUnregister).toBeUndefined();

        return true;
      }),
      { numRuns: 2 }
    );
  });

  test('Property 19a: Project validation should prevent invalid configurations', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.oneof(
            fc.constant(''), // Empty ID
            fc.constant(null), // Null ID
            fc.constant(undefined) // Undefined ID
          ),
          name: fc.string(),
          loader: fc.oneof(
            fc.constant(null), // Null loader
            fc.constant(undefined) // Undefined loader
          )
        }),
        (invalidConfig) => {
          const testConfig = {
            ...invalidConfig,
            description: 'Test description',
            icon: '🎯',
            category: 'basic' as ProjectCategory,
            enabled: true,
            version: '1.0.0',
            route: '/test',
            metadata: {} as ProjectMetadata,
            defaultSettings: {} as ProjectSettings
          } as ProjectConfig;

          // Invalid configurations should not be registerable
          const result = projectRegistry.validateProject(testConfig);
          expect(result).toBe(false);

          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  test('Property 19b: Duplicate project IDs should be rejected', () => {
    fc.assert(
      fc.property(projectConfigGenerator, (projectConfig) => {
        const uniqueId = `test_${projectConfig.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ProjectType;
        const uniqueRoute = `/test${projectConfig.route}/${Date.now()}`;
        
        const testConfig: ProjectConfig = {
          ...projectConfig,
          id: uniqueId,
          route: uniqueRoute
        };

        // Register the first project
        const firstRegistration = projectRegistry.registerProject(testConfig);
        expect(firstRegistration).toBe(true);

        // Try to register a project with the same ID
        const duplicateConfig: ProjectConfig = {
          ...testConfig,
          name: 'Different Name',
          route: `/different${uniqueRoute}`
        };

        const duplicateRegistration = projectRegistry.registerProject(duplicateConfig);
        expect(duplicateRegistration).toBe(false);

        // Clean up
        projectRegistry.unregisterProject(uniqueId);

        return true;
      }),
      { numRuns: 2 }
    );
  });

  test('Property 19c: Duplicate project routes should be rejected', () => {
    fc.assert(
      fc.property(projectConfigGenerator, (projectConfig) => {
        const uniqueId1 = `test_${projectConfig.id}_1_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ProjectType;
        const uniqueId2 = `test_${projectConfig.id}_2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ProjectType;
        const sharedRoute = `/test${projectConfig.route}/${Date.now()}`;
        
        const testConfig1: ProjectConfig = {
          ...projectConfig,
          id: uniqueId1,
          route: sharedRoute
        };

        const testConfig2: ProjectConfig = {
          ...projectConfig,
          id: uniqueId2,
          name: 'Different Name',
          route: sharedRoute // Same route
        };

        // Register the first project
        const firstRegistration = projectRegistry.registerProject(testConfig1);
        expect(firstRegistration).toBe(true);

        // Try to register a project with the same route
        const duplicateRegistration = projectRegistry.registerProject(testConfig2);
        expect(duplicateRegistration).toBe(false);

        // Clean up
        projectRegistry.unregisterProject(uniqueId1);

        return true;
      }),
      { numRuns: 2 }
    );
  });

  test('Property 19d: Project loading mechanism should work for any valid project', async () => {
    await fc.assert(
      fc.asyncProperty(projectConfigGenerator, async (projectConfig) => {
        const uniqueId = `test_${projectConfig.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ProjectType;
        const uniqueRoute = `/test${projectConfig.route}/${Date.now()}`;
        
        const testConfig: ProjectConfig = {
          ...projectConfig,
          id: uniqueId,
          route: uniqueRoute,
          enabled: true // Ensure it's enabled for loading
        };

        // Register the project
        const registrationResult = projectRegistry.registerProject(testConfig);
        expect(registrationResult).toBe(true);

        try {
          // Test the loading mechanism
          const { loadProject } = await import('@/projects/registry');
          const loadedModule = await loadProject(uniqueId);
          
          // Verify the loaded module has the expected structure
          expect(loadedModule).toBeDefined();
          expect(loadedModule.default).toBeDefined();
          expect(typeof loadedModule.default).toBe('function');

          return true;
        } catch (error) {
          // Loading should not fail for valid configurations
          throw error;
        } finally {
          // Clean up
          projectRegistry.unregisterProject(uniqueId);
        }
      }),
      { numRuns: 2 } // Fewer runs for async tests to avoid timeout
    );
  });

  test('Property 19e: Registry state should remain consistent after operations', () => {
    fc.assert(
      fc.property(
        fc.array(projectConfigGenerator, { minLength: 1, maxLength: 5 }),
        (projectConfigs) => {
          const initialProjectCount = projectRegistry.projects.length;
          const registeredIds: ProjectType[] = [];

          // Register all valid projects
          projectConfigs.forEach((config, index) => {
            const uniqueId = `test_${config.id}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ProjectType;
            const uniqueRoute = `/test${config.route}/${index}/${Date.now()}`;
            
            const testConfig: ProjectConfig = {
              ...config,
              id: uniqueId,
              route: uniqueRoute
            };

            const result = projectRegistry.registerProject(testConfig);
            if (result) {
              registeredIds.push(uniqueId);
            }
          });

          // Verify all registered projects are discoverable
          registeredIds.forEach(id => {
            const project = projectRegistry.getProject(id);
            expect(project).toBeDefined();
            expect(project?.id).toBe(id);
          });

          // Verify project count increased correctly
          expect(projectRegistry.projects.length).toBe(initialProjectCount + registeredIds.length);

          // Unregister all test projects
          registeredIds.forEach(id => {
            const result = projectRegistry.unregisterProject(id);
            expect(result).toBe(true);
          });

          // Verify registry returned to initial state
          expect(projectRegistry.projects.length).toBe(initialProjectCount);

          return true;
        }
      ),
      { numRuns: 2 } // Fewer runs for complex state operations
    );
  });
});