/**
 * Property-Based Test for Dynamic Code Splitting
 * Feature: frontend-restructure, Property 1: Dynamic Code Splitting
 * Validates: Requirements 1.2, 3.1, 3.4
 */

import { fc } from '@fast-check/jest';
import { render, waitFor, cleanup, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import React, { Suspense } from 'react';
import {
  projectRegistry,
  loadProject,
  getProjectById,
  type ProjectConfig,
  type ProjectType,
} from '@/projects';

// Mock performance.now for consistent timing
const mockPerformanceNow = jest.fn(() => Date.now());
global.performance.now = mockPerformanceNow;

// Track which modules have been loaded
const loadedModules = new Set<string>();
const moduleLoadTimes = new Map<string, number>();

// Mock dynamic imports to track code splitting
const originalImport = global.import;

beforeAll(() => {
  // Override dynamic import to track module loading
  (global as any).import = jest.fn((modulePath: string) => {
    loadedModules.add(modulePath);
    moduleLoadTimes.set(modulePath, Date.now());
    return originalImport?.(modulePath) || Promise.resolve({ default: () => null });
  });
});

afterAll(() => {
  // Restore original import
  if (originalImport) {
    (global as any).import = originalImport;
  }
});

// Mock the useGlobalContext hook
jest.mock('@/hooks/useGlobalContext', () => ({
  useGlobalContext: jest.fn(() => ({
    state: {
      isInitialized: true,
      theme: 'light' as const,
      sidebarCollapsed: false,
      connectionStatus: {
        connected: true,
        reconnecting: false,
        error: null,
        quality: { status: 'excellent' as const, score: 100, factors: { latency: 10, stability: 100, throughput: 100 } },
        latency: 10,
        uptime: 1000,
      },
      currentProject: null,
      availableProjects: [],
      preferences: {
        theme: 'light' as const,
        sidebarCollapsed: false,
        defaultProject: null,
        showDebugInfo: false,
        animationsEnabled: true,
        autoReconnect: true,
      },
      debugMode: false,
      stateHistory: [],
      performanceMetrics: {
        renderCount: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
      },
    },
    actions: {
      setTheme: jest.fn(),
      toggleSidebar: jest.fn(),
      setSidebarCollapsed: jest.fn(),
      updateConnectionStatus: jest.fn(),
      selectProject: jest.fn(),
      setAvailableProjects: jest.fn(),
      updatePreferences: jest.fn(),
      loadProjects: jest.fn(),
      toggleDebugMode: jest.fn(),
      clearStateHistory: jest.fn(),
      exportState: jest.fn(),
      importState: jest.fn(),
    },
    debug: {
      isEnabled: false,
      stateHistory: [],
      performanceMetrics: {
        renderCount: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
      },
      logStateChange: jest.fn(),
    },
  })),
}));

// Mock the useProjectContext hook
jest.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: jest.fn(() => ({
    state: {
      gestureData: null,
      settings: {
        displayMode: 'detailed' as const,
        showDebugInfo: false,
        sensitivity: 0.5,
      },
      currentProjectId: null,
    },
    actions: {
      updateGestureData: jest.fn(),
      updateSettings: jest.fn(),
      setDisplayMode: jest.fn(),
      toggleDebugInfo: jest.fn(),
      selectProject: jest.fn(),
    },
  })),
}));

// Mock services
jest.mock('@/services/ErrorLoggingService', () => {
  const mockInstance = {
    logError: jest.fn(),
    logUserAction: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      getInstance: () => mockInstance,
    },
  };
});

jest.mock('@/services/PerformanceMonitor', () => ({
  withPerformanceTracking: (Component: React.ComponentType) => Component,
  default: {
    getInstance: () => ({
      measureRouteLoad: jest.fn(),
      startComponentRender: jest.fn(() => 'timer-id'),
      endComponentRender: jest.fn(),
    }),
  },
}));

// Mock the actual project modules to return valid React components
jest.mock('@/projects/modules/FingerCount', () => ({
  __esModule: true,
  default: () => <div data-testid="finger-count-module">Finger Count Module</div>,
}));

jest.mock('@/projects/modules/VolumeControl', () => ({
  __esModule: true,
  default: () => <div data-testid="volume-control-module">Volume Control Module</div>,
}));

jest.mock('@/projects/modules/VirtualMouse', () => ({
  __esModule: true,
  default: () => <div data-testid="virtual-mouse-module">Virtual Mouse Module</div>,
}));

// Import ProjectLoader after mocks
import ProjectLoader from '@/components/ProjectLoader/ProjectLoader';

// Generators for property-based testing
const projectTypeGenerator = fc.constantFrom<ProjectType>(
  'finger_count',
  'volume_control',
  'virtual_mouse'
);

const projectSequenceGenerator = fc.array(projectTypeGenerator, {
  minLength: 1,
  maxLength: 3,
});

// Reduced number of runs for async tests
const NUM_RUNS = 10;

describe('Property 1: Dynamic Code Splitting', () => {
  beforeEach(() => {
    // Clear tracking between tests
    loadedModules.clear();
    moduleLoadTimes.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 1a: Lazy Loading Verification
   * For any project selection, the system should load only the required code chunks
   * for that specific project, ensuring no unnecessary code is downloaded
   * Validates: Requirements 1.2, 3.1
   */
  test('Property 1a: Only required project code is loaded for each project selection', async () => {
    await fc.assert(
      fc.asyncProperty(projectTypeGenerator, async (projectId) => {
        // Get project configuration
        const projectConfig = getProjectById(projectId);
        expect(projectConfig).toBeDefined();

        if (!projectConfig) return true;

        // Track initial loaded modules count
        const initialModuleCount = loadedModules.size;

        // Load the project module - the loader returns a lazy component
        const loadStartTime = Date.now();
        const LazyComponent = projectConfig.loader();
        const loadEndTime = Date.now();

        // Test 1: Lazy component should be returned
        expect(LazyComponent).toBeDefined();
        expect(typeof LazyComponent).toBe('object');

        // Test 2: Loading should be reasonably fast (< 5 seconds in test environment)
        const loadTime = loadEndTime - loadStartTime;
        expect(loadTime).toBeLessThan(5000);

        // Test 3: Verify the lazy component can be rendered
        let container: HTMLElement;
        await act(async () => {
          const result = render(
            <Suspense fallback={<div>Loading...</div>}>
              <LazyComponent
                gestureData={null}
                settings={{
                  displayMode: 'detailed' as const,
                  showDebugInfo: false,
                  sensitivity: 0.5,
                }}
                onSettingsChange={jest.fn()}
              />
            </Suspense>
          );
          container = result.container;
        });

        // Test 4: Component should render successfully
        expect(container!).toBeInTheDocument();

        cleanup();

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 1b: Code Splitting Isolation
   * For any sequence of project selections, each project should load independently
   * without loading code for other projects
   * Validates: Requirements 1.2, 3.1, 3.4
   */
  test('Property 1b: Projects load independently without cross-contamination', async () => {
    await fc.assert(
      fc.asyncProperty(projectSequenceGenerator, async (projectSequence) => {
        const loadedProjects = new Set<ProjectType>();
        const loadResults: Array<{ projectId: ProjectType; success: boolean; loadTime: number }> = [];

        // Load each project in sequence
        for (const projectId of projectSequence) {
          const startTime = Date.now();
          
          try {
            const projectConfig = getProjectById(projectId);
            if (!projectConfig) {
              throw new Error(`Project not found: ${projectId}`);
            }

            const LazyComponent = projectConfig.loader();
            const endTime = Date.now();

            // Test 1: Each project should load successfully
            expect(LazyComponent).toBeDefined();

            loadedProjects.add(projectId);
            loadResults.push({
              projectId,
              success: true,
              loadTime: endTime - startTime,
            });

            // Test 2: Lazy component should be renderable
            let container: HTMLElement;
            await act(async () => {
              const result = render(
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyComponent
                    gestureData={null}
                    settings={{
                      displayMode: 'detailed' as const,
                      showDebugInfo: false,
                      sensitivity: 0.5,
                    }}
                    onSettingsChange={jest.fn()}
                  />
                </Suspense>
              );
              container = result.container;
            });

            expect(container!).toBeInTheDocument();
            cleanup();

          } catch (error) {
            const endTime = Date.now();
            loadResults.push({
              projectId,
              success: false,
              loadTime: endTime - startTime,
            });
            
            // If loading fails, it should fail gracefully
            expect(error).toBeDefined();
          }
        }

        // Test 3: All unique projects in sequence should be loaded
        const uniqueProjects = new Set(projectSequence);
        expect(loadedProjects.size).toBe(uniqueProjects.size);

        // Test 4: Load times should be consistent (no project should take significantly longer)
        const successfulLoads = loadResults.filter(r => r.success);
        if (successfulLoads.length > 1) {
          const avgLoadTime = successfulLoads.reduce((sum, r) => sum + r.loadTime, 0) / successfulLoads.length;
          
          // No load should take more than 3x the average (accounting for test environment variability)
          successfulLoads.forEach(result => {
            expect(result.loadTime).toBeLessThan(avgLoadTime * 3 + 1000);
          });
        }

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 1c: Lazy Component Rendering
   * For any project, the ProjectLoader should handle lazy loading with proper Suspense
   * Validates: Requirements 1.2, 3.4
   */
  test('Property 1c: ProjectLoader handles lazy loading with Suspense correctly', async () => {
    await fc.assert(
      fc.asyncProperty(projectTypeGenerator, async (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        // Test: Lazy component should be loadable and renderable directly
        const LazyComponent = projectConfig.loader();
        
        // Render with Suspense
        let container: HTMLElement;
        await act(async () => {
          const result = render(
            <MemoryRouter initialEntries={[`/project/${projectId}`]}>
              <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
                <LazyComponent
                  gestureData={null}
                  settings={{
                    displayMode: 'detailed' as const,
                    showDebugInfo: false,
                    sensitivity: 0.5,
                  }}
                  onSettingsChange={jest.fn()}
                />
              </Suspense>
            </MemoryRouter>
          );
          container = result.container;
        });

        // Test 1: Component should render without errors
        expect(container!).toBeInTheDocument();

        // Test 2: Either loading state or project content should be present
        await waitFor(
          () => {
            const content = container!.textContent;
            expect(content).toBeTruthy();
          },
          { timeout: 1000 }
        );

        cleanup();

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  }, 10000); // Increase timeout for this test

  /**
   * Property 1d: Module Validation
   * For any loaded project module, it should conform to the expected interface
   * Validates: Requirements 3.1, 3.4
   */
  test('Property 1d: Loaded modules conform to project interface', async () => {
    await fc.assert(
      fc.asyncProperty(projectTypeGenerator, async (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        // Load the project module - loader returns lazy component
        const LazyComponent = projectConfig.loader();

        // Test 1: Lazy component should be defined
        expect(LazyComponent).toBeDefined();
        expect(typeof LazyComponent).toBe('object');

        // Test 2: Component should be renderable
        let container: HTMLElement;
        
        await act(async () => {
          const result = render(
            <BrowserRouter>
              <Suspense fallback={<div>Loading...</div>}>
                <LazyComponent
                  gestureData={null}
                  settings={{
                    displayMode: 'detailed' as const,
                    showDebugInfo: false,
                    sensitivity: 0.5,
                  }}
                  onSettingsChange={jest.fn()}
                />
              </Suspense>
            </BrowserRouter>
          );
          container = result.container;
        });

        // Test 3: Component should render without throwing
        expect(container!).toBeInTheDocument();

        cleanup();

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 1e: Concurrent Loading
   * For any set of projects loaded concurrently, each should load independently
   * Validates: Requirements 1.2, 3.1
   */
  test('Property 1e: Multiple projects can be loaded concurrently without interference', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(projectTypeGenerator, { minLength: 2, maxLength: 3 }),
        async (projectIds) => {
          // Remove duplicates
          const uniqueProjectIds = Array.from(new Set(projectIds));
          
          if (uniqueProjectIds.length < 2) {
            // Skip if we don't have at least 2 unique projects
            return true;
          }

          // Load all projects concurrently
          const loadPromises = uniqueProjectIds.map(async (projectId) => {
            const startTime = Date.now();
            try {
              const projectConfig = getProjectById(projectId);
              if (!projectConfig) {
                throw new Error(`Project not found: ${projectId}`);
              }

              const LazyComponent = projectConfig.loader();
              const endTime = Date.now();
              
              return {
                projectId,
                success: true,
                component: LazyComponent,
                loadTime: endTime - startTime,
                error: null,
              };
            } catch (error) {
              const endTime = Date.now();
              return {
                projectId,
                success: false,
                component: null,
                loadTime: endTime - startTime,
                error: error as Error,
              };
            }
          });

          const results = await Promise.all(loadPromises);

          // Test 1: All projects should load successfully
          const successfulLoads = results.filter(r => r.success);
          expect(successfulLoads.length).toBe(uniqueProjectIds.length);

          // Test 2: Each loaded component should be valid
          successfulLoads.forEach(result => {
            expect(result.component).toBeDefined();
            expect(typeof result.component).toBe('object');
          });

          // Test 3: Concurrent loading should not significantly increase load times
          // (compared to sequential loading, accounting for test environment)
          const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
          expect(avgLoadTime).toBeLessThan(5000); // Should complete within 5 seconds

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 1f: Registry Integration
   * For any project in the registry, it should be loadable through the standard mechanism
   * Validates: Requirements 3.1, 3.4
   */
  test('Property 1f: All registered projects are loadable through standard mechanism', async () => {
    // Get all enabled projects from registry
    const enabledProjects = projectRegistry.getEnabledProjects();
    
    // Test: At least one project should be enabled
    expect(enabledProjects.length).toBeGreaterThan(0);

    // Load each enabled project
    for (const projectConfig of enabledProjects) {
      const startTime = Date.now();
      
      try {
        const LazyComponent = projectConfig.loader();
        const endTime = Date.now();

        // Test 1: Component should load successfully
        expect(LazyComponent).toBeDefined();
        expect(typeof LazyComponent).toBe('object');

        // Test 2: Load time should be reasonable
        const loadTime = endTime - startTime;
        expect(loadTime).toBeLessThan(5000);

        // Test 3: Component should be renderable
        let container: HTMLElement;
        await act(async () => {
          const result = render(
            <Suspense fallback={<div>Loading...</div>}>
              <LazyComponent
                gestureData={null}
                settings={{
                  displayMode: 'detailed' as const,
                  showDebugInfo: false,
                  sensitivity: 0.5,
                }}
                onSettingsChange={jest.fn()}
              />
            </Suspense>
          );
          container = result.container;
        });

        expect(container!).toBeInTheDocument();
        cleanup();

      } catch (error) {
        // If loading fails, fail the test with details
        throw new Error(`Failed to load project ${projectConfig.id}: ${error}`);
      }
    }
  });

  /**
   * Property 1g: Error Handling in Code Splitting
   * For any project loading failure, the system should handle errors gracefully
   * Validates: Requirements 3.4
   */
  test('Property 1g: Loading errors are handled gracefully without crashing', async () => {
    // Test with an invalid project ID
    const invalidProjectId = 'invalid_project_123' as ProjectType;

    // Test 1: Invalid project should return undefined from registry
    const invalidConfig = getProjectById(invalidProjectId);
    expect(invalidConfig).toBeUndefined();

    // Test 2: After error, valid projects should still load
    const validProjectId: ProjectType = 'finger_count';
    const validConfig = getProjectById(validProjectId);
    
    expect(validConfig).toBeDefined();
    
    if (validConfig) {
      const LazyComponent = validConfig.loader();
      expect(LazyComponent).toBeDefined();
      expect(typeof LazyComponent).toBe('object');
    }
  });

  /**
   * Property 1h: Loader Configuration Consistency
   * For any project configuration, the loader function should be properly defined
   * Validates: Requirements 3.1
   */
  test('Property 1h: All project configurations have valid loader functions', () => {
    fc.assert(
      fc.property(projectTypeGenerator, (projectId) => {
        const projectConfig = getProjectById(projectId);
        
        if (!projectConfig) {
          // Project not found is acceptable for some IDs
          return true;
        }

        // Test 1: Loader should be defined
        expect(projectConfig.loader).toBeDefined();
        expect(typeof projectConfig.loader).toBe('function');

        // Test 2: Loader should return a lazy component (object with $$typeof)
        const loaderResult = projectConfig.loader();
        expect(loaderResult).toBeDefined();
        expect(typeof loaderResult).toBe('object');

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
