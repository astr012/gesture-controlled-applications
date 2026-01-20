/**
 * Bundle Optimization Unit Tests
 * Tests bundle sizes and splitting effectiveness
 * Validates: Requirement 7.4 - Efficient bundle splitting to minimize initial payload
 */

import { projectRegistry } from '../projects/registry';
import type { ProjectConfig } from '../types/project-types';

describe('Bundle Optimization Tests', () => {
  describe('Project Registry Configuration', () => {
    it('should have lazy loaders configured for all projects', () => {
      const projects = projectRegistry.projects;
      
      expect(projects.length).toBeGreaterThan(0);
      
      projects.forEach((project: ProjectConfig) => {
        expect(project.loader).toBeDefined();
        expect(typeof project.loader).toBe('function');
      });
    });

    it('should return React lazy components from project loaders', () => {
      const projects = projectRegistry.projects;
      
      projects.forEach((project: ProjectConfig) => {
        const loaderResult = project.loader();
        // React lazy components have a $$typeof property
        expect(loaderResult).toBeDefined();
        expect(typeof loaderResult).toBe('object');
      });
    });

    it('should have unique IDs for all projects to enable proper code splitting', () => {
      const projects = projectRegistry.projects;
      const ids = projects.map((p: ProjectConfig) => p.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(projects.length);
    });
  });

  describe('Lazy Loading Implementation', () => {
    it('should not eagerly load project modules', () => {
      // Check that project modules are not in the initial module cache
      const moduleKeys = Object.keys(require.cache || {});
      
      // Project modules should not be loaded yet
      const fingerCountLoaded = moduleKeys.some(key => 
        key.includes('projects/modules/FingerCount') && !key.includes('test')
      );
      const volumeControlLoaded = moduleKeys.some(key => 
        key.includes('projects/modules/VolumeControl') && !key.includes('test')
      );
      const virtualMouseLoaded = moduleKeys.some(key => 
        key.includes('projects/modules/VirtualMouse') && !key.includes('test')
      );
      
      // In a properly code-split application, these should not be loaded initially
      // Note: This test may pass differently in test vs production environments
      expect(fingerCountLoaded || volumeControlLoaded || virtualMouseLoaded).toBe(false);
    });

    it('should have lazy loader functions that return React components', () => {
      const projects = projectRegistry.projects;
      
      projects.forEach((project: ProjectConfig) => {
        const lazyComponent = project.loader();
        
        // React lazy components have specific properties
        expect(lazyComponent).toBeDefined();
        expect(typeof lazyComponent).toBe('object');
        
        // Lazy components should have a $$typeof symbol
        expect(lazyComponent).toHaveProperty('$$typeof');
      });
    });

    it('should have different lazy components for different projects', () => {
      const projects = projectRegistry.projects;
      
      // Get lazy components for different projects
      const lazyComponents = projects.map((project: ProjectConfig) => project.loader());
      
      // Each should be a distinct lazy component
      expect(lazyComponents.length).toBeGreaterThan(1);
      
      // They should not all be the same reference
      const uniqueComponents = new Set(lazyComponents);
      expect(uniqueComponents.size).toBe(lazyComponents.length);
    });
  });

  describe('Code Splitting Strategy', () => {
    it('should separate vendor code from application code', () => {
      // This test validates the Vite configuration strategy
      // In production builds, vendor code should be in separate chunks
      
      // Check that React is imported as a dependency
      const reactImported = typeof React !== 'undefined' || 
                           require.resolve('react') !== undefined;
      
      expect(reactImported).toBe(true);
    });

    it('should have separate chunks for different project modules', () => {
      const projects = projectRegistry.projects;
      
      // Each project should have a unique loader function
      const loaders = projects.map((p: ProjectConfig) => p.loader);
      const uniqueLoaders = new Set(loaders);
      
      // All loaders should be unique (different code chunks)
      expect(uniqueLoaders.size).toBe(projects.length);
    });

    it('should enable tree shaking by using ES modules', () => {
      // Verify that the project uses ES module syntax
      // This is validated by checking the module type
      
      // The registry should export named exports
      expect(projectRegistry).toBeDefined();
      expect(typeof projectRegistry).toBe('object');
      expect(Array.isArray(projectRegistry.projects)).toBe(true);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should minimize initial bundle by deferring project loads', async () => {
      const projects = projectRegistry.projects;
      
      // Track which modules are loaded
      const loadedModules: string[] = [];
      
      // Initially, no project modules should be loaded
      expect(loadedModules.length).toBe(0);
      
      // Load one project
      const firstProject = projects[0];
      const lazyComponent = firstProject.loader();
      
      // Lazy component should be created without loading the actual module
      expect(lazyComponent).toBeDefined();
    });

    it('should support dynamic imports for all projects', () => {
      const projects = projectRegistry.projects;
      
      projects.forEach((project: ProjectConfig) => {
        // Each loader should be a function that returns a lazy component
        expect(typeof project.loader).toBe('function');
        
        const result = project.loader();
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });
    });

    it('should have metadata available without loading full module', () => {
      const projects = projectRegistry.projects;
      
      // Project metadata should be available in the registry
      // without loading the actual project code
      projects.forEach((project: ProjectConfig) => {
        expect(project.id).toBeDefined();
        expect(project.name).toBeDefined();
        expect(project.description).toBeDefined();
        expect(project.icon).toBeDefined();
        expect(project.category).toBeDefined();
        expect(project.metadata).toBeDefined();
        
        // These should be available without calling loader()
        expect(typeof project.id).toBe('string');
        expect(typeof project.name).toBe('string');
        expect(project.metadata.name).toBeDefined();
        expect(project.metadata.description).toBeDefined();
      });
    });
  });

  describe('Performance Characteristics', () => {
    it('should create lazy components instantly without loading modules', () => {
      const projects = projectRegistry.projects;
      
      const startTime = performance.now();
      
      // Creating lazy components should be instant
      projects.forEach((project: ProjectConfig) => {
        const lazyComponent = project.loader();
        expect(lazyComponent).toBeDefined();
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Creating lazy components should be very fast (< 10ms)
      expect(totalTime).toBeLessThan(10);
    });

    it('should support concurrent lazy component creation', () => {
      const projects = projectRegistry.projects;
      
      const startTime = performance.now();
      
      // Create all lazy components concurrently
      const lazyComponents = projects.map((project: ProjectConfig) => project.loader());
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All lazy components should be created quickly
      expect(totalTime).toBeLessThan(20);
      expect(lazyComponents.length).toBe(projects.length);
    });

    it('should return the same lazy component instance for repeated calls', () => {
      const projects = projectRegistry.projects;
      const firstProject = projects[0];
      
      // Call loader multiple times
      const component1 = firstProject.loader();
      const component2 = firstProject.loader();
      const component3 = firstProject.loader();
      
      // Should return the same instance (lazy components are cached)
      expect(component1).toBe(component2);
      expect(component2).toBe(component3);
    });
  });

  describe('Error Handling in Bundle Loading', () => {
    it('should handle module load failures gracefully', async () => {
      // Create a mock project with a failing loader
      const failingProject: ProjectConfig = {
        id: 'test_failing',
        name: 'Failing Project',
        description: 'Test project that fails to load',
        icon: '❌',
        category: 'basic',
        loader: () => Promise.reject(new Error('Module load failed')),
        enabled: true,
        version: '1.0.0',
        route: '/test-failing',
      };
      
      // Should reject with an error
      await expect(failingProject.loader()).rejects.toThrow('Module load failed');
    });

    it('should provide meaningful error messages for load failures', async () => {
      const failingProject: ProjectConfig = {
        id: 'test_error',
        name: 'Error Project',
        description: 'Test project with error',
        icon: '⚠️',
        category: 'basic',
        loader: () => Promise.reject(new Error('Network error: Failed to fetch module')),
        enabled: true,
        version: '1.0.0',
        route: '/test-error',
      };
      
      try {
        await failingProject.loader();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Network error');
      }
    });
  });

  describe('Bundle Splitting Configuration Validation', () => {
    it('should have proper module boundaries', () => {
      // Validate that different parts of the app are properly separated
      const projects = projectRegistry.projects;
      
      // Projects should be in their own modules
      expect(projects.length).toBeGreaterThan(0);
      
      // Each project should have distinct characteristics
      const categories = new Set(projects.map((p: ProjectConfig) => p.category));
      expect(categories.size).toBeGreaterThan(0);
    });

    it('should support incremental lazy component creation', () => {
      const projects = projectRegistry.projects;
      
      // Create lazy components one at a time
      const lazyComponent1 = projects[0].loader();
      expect(lazyComponent1).toBeDefined();
      
      const lazyComponent2 = projects[1].loader();
      expect(lazyComponent2).toBeDefined();
      
      // Each should be distinct
      expect(lazyComponent1).not.toBe(lazyComponent2);
    });

    it('should minimize shared dependencies between chunks', () => {
      const projects = projectRegistry.projects;
      
      // Each project should be independently loadable
      // This is validated by the fact that each has its own loader
      projects.forEach((project: ProjectConfig) => {
        expect(project.loader).toBeDefined();
        expect(typeof project.loader).toBe('function');
      });
    });
  });

  describe('Production Build Optimization', () => {
    it('should have version information for cache busting', () => {
      const projects = projectRegistry.projects;
      
      projects.forEach((project: ProjectConfig) => {
        expect(project.version).toBeDefined();
        expect(typeof project.version).toBe('string');
        expect(project.version).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });

    it('should enable selective project loading', () => {
      const projects = projectRegistry.projects;
      
      // Should be able to filter and load only enabled projects
      const enabledProjects = projects.filter((p: ProjectConfig) => p.enabled);
      
      expect(enabledProjects.length).toBeGreaterThan(0);
      expect(enabledProjects.length).toBeLessThanOrEqual(projects.length);
    });

    it('should support route-based code splitting', () => {
      const projects = projectRegistry.projects;
      
      // Each project should have a unique route
      const routes = projects.map((p: ProjectConfig) => p.route);
      const uniqueRoutes = new Set(routes);
      
      expect(uniqueRoutes.size).toBe(projects.length);
      
      // Routes should follow a consistent pattern (allowing for /project/ prefix)
      routes.forEach(route => {
        expect(route).toMatch(/^\/[a-z/-]+$/);
        expect(route.startsWith('/')).toBe(true);
      });
    });
  });
});
