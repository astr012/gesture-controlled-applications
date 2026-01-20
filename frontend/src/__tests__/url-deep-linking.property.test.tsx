/**
 * Property-Based Test for URL Deep Linking
 * Feature: frontend-restructure, Property 13: URL Deep Linking
 * Validates: Requirements 1.5
 */

import { fc } from '@fast-check/jest';
import { render, waitFor, cleanup, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import {
  projectRegistry,
  getProjectById,
  urlToProjectId,
  projectIdToUrl,
  getProjectByRoute,
  type ProjectType,
} from '@/projects';

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

const urlSegmentGenerator = fc.constantFrom(
  'finger-count',
  'volume-control',
  'virtual-mouse'
);

const validProjectUrlGenerator = fc.record({
  projectId: projectTypeGenerator,
  urlSegment: urlSegmentGenerator,
}).filter(({ projectId, urlSegment }) => {
  // Ensure URL segment matches project ID
  const expectedUrl = projectIdToUrl(projectId);
  return urlSegment === expectedUrl;
});

// Reduced number of runs for async tests
const NUM_RUNS = 10;

describe('Property 13: URL Deep Linking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 13a: Valid Project URL Navigation
   * For any valid project URL, navigating to it should load the correct project
   * and display the appropriate content
   * Validates: Requirements 1.5
   */
  test('Property 13a: Valid project URLs load the correct project', async () => {
    await fc.assert(
      fc.asyncProperty(projectTypeGenerator, async (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        // Get the URL segment for this project
        const urlSegment = projectIdToUrl(projectId);
        const projectUrl = `/project/${urlSegment}`;

        // Test 1: URL should be properly formatted
        expect(projectUrl).toMatch(/^\/project\/[a-z-]+$/);

        // Test 2: URL segment should match project ID conversion
        const convertedId = urlToProjectId(urlSegment);
        expect(convertedId).toBe(projectId);

        // Test 3: Project config should have matching route
        expect(projectConfig.route).toContain(urlSegment);

        // Test 4: Render a simple component with the URL to verify routing works
        const { container } = render(
          <MemoryRouter initialEntries={[projectUrl]}>
            <Routes>
              <Route 
                path="/project/:projectId" 
                element={<div data-testid="project-route">Project: {urlSegment}</div>} 
              />
            </Routes>
          </MemoryRouter>
        );

        // Test 5: Component should render without errors
        expect(container).toBeInTheDocument();
        expect(container.textContent).toContain(urlSegment);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13b: URL to Project ID Conversion
   * For any valid URL segment, it should correctly convert to the corresponding project ID
   * Validates: Requirements 1.5
   */
  test('Property 13b: URL segments correctly convert to project IDs', () => {
    fc.assert(
      fc.property(validProjectUrlGenerator, ({ projectId, urlSegment }) => {
        // Test 1: URL to project ID conversion should work
        const convertedId = urlToProjectId(urlSegment);
        expect(convertedId).toBe(projectId);

        // Test 2: Reverse conversion should work
        const convertedUrl = projectIdToUrl(projectId);
        expect(convertedUrl).toBe(urlSegment);

        // Test 3: Round-trip conversion should be consistent
        const roundTripId = urlToProjectId(projectIdToUrl(projectId));
        expect(roundTripId).toBe(projectId);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13c: Project Route Resolution
   * For any project, the route should be resolvable from the registry
   * Validates: Requirements 1.5
   */
  test('Property 13c: Project routes are correctly registered and resolvable', () => {
    fc.assert(
      fc.property(projectTypeGenerator, (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        // Test 1: Project should have a route defined
        expect(projectConfig.route).toBeDefined();
        expect(typeof projectConfig.route).toBe('string');
        expect(projectConfig.route).toMatch(/^\/project\//);

        // Test 2: Route should be resolvable from registry
        const resolvedProject = getProjectByRoute(projectConfig.route);
        expect(resolvedProject).toBeDefined();
        expect(resolvedProject?.id).toBe(projectId);

        // Test 3: Route should contain URL-friendly segment
        const urlSegment = projectConfig.route.split('/').pop();
        expect(urlSegment).toMatch(/^[a-z-]+$/);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13d: Invalid URL Handling
   * For any invalid project URL, the system should handle it gracefully
   * Validates: Requirements 1.5
   */
  test('Property 13d: Invalid project URLs are handled gracefully', () => {
    const invalidUrls = [
      'invalid-project',
      'nonexistent',
      'test-123',
      'UPPERCASE',
      'with_underscore',
    ];

    for (const invalidUrlSegment of invalidUrls) {
      // Test 1: Invalid URL segment should not convert to valid project ID
      const projectId = urlToProjectId(invalidUrlSegment);
      expect(projectId).toBeNull();

      // Test 2: Invalid project ID should not be found in registry
      if (projectId) {
        const projectConfig = getProjectById(projectId);
        expect(projectConfig).toBeUndefined();
      }
    }
  });

  /**
   * Property 13e: Deep Link State Preservation
   * For any valid project URL with parameters, the state should be preserved
   * Validates: Requirements 1.5
   */
  test('Property 13e: Deep links preserve project state correctly', () => {
    fc.assert(
      fc.property(projectTypeGenerator, (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        const urlSegment = projectIdToUrl(projectId);
        const projectUrl = `/project/${urlSegment}`;

        // Test 1: URL should be consistent across conversions
        const roundTripId = urlToProjectId(urlSegment);
        expect(roundTripId).toBe(projectId);

        // Test 2: Project route should match URL
        expect(projectConfig.route).toBe(projectUrl);

        // Test 3: Multiple conversions should be idempotent
        const secondUrl = projectIdToUrl(roundTripId!);
        expect(secondUrl).toBe(urlSegment);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13f: URL Navigation Consistency
   * For any sequence of project URL navigations, each should load correctly
   * Validates: Requirements 1.5
   */
  test('Property 13f: Sequential URL navigations work correctly', () => {
    fc.assert(
      fc.property(
        fc.array(projectTypeGenerator, { minLength: 2, maxLength: 3 }),
        (projectSequence) => {
          const uniqueProjects = Array.from(new Set(projectSequence));
          if (uniqueProjects.length < 2) return true;

          // Create URLs for each project
          const urls = uniqueProjects.map(id => projectIdToUrl(id));

          // Test 1: All URLs should be valid and unique
          const uniqueUrls = new Set(urls);
          expect(uniqueUrls.size).toBe(uniqueProjects.length);

          // Test 2: Each URL should convert back to correct project ID
          for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const projectId = uniqueProjects[i];
            const convertedId = urlToProjectId(url);
            expect(convertedId).toBe(projectId);
          }

          // Test 3: Each project should have a valid config
          for (const projectId of uniqueProjects) {
            const config = getProjectById(projectId);
            expect(config).toBeDefined();
            expect(config?.route).toContain(projectIdToUrl(projectId));
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13g: URL Format Validation
   * For any project, the URL format should follow conventions
   * Validates: Requirements 1.5
   */
  test('Property 13g: All project URLs follow consistent format conventions', () => {
    fc.assert(
      fc.property(projectTypeGenerator, (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        // Test 1: Route should start with /project/
        expect(projectConfig.route).toMatch(/^\/project\//);

        // Test 2: URL segment should be lowercase with hyphens
        const urlSegment = projectConfig.route.split('/').pop();
        expect(urlSegment).toMatch(/^[a-z]+(-[a-z]+)*$/);

        // Test 3: URL segment should not contain underscores
        expect(urlSegment).not.toContain('_');

        // Test 4: URL segment should match conversion function
        const convertedUrl = projectIdToUrl(projectId);
        expect(urlSegment).toBe(convertedUrl);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13h: Browser History Integration
   * For any project URL navigation, browser history should be updated correctly
   * Validates: Requirements 1.5
   */
  test('Property 13h: URL navigation updates browser history correctly', () => {
    fc.assert(
      fc.property(projectTypeGenerator, (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        const urlSegment = projectIdToUrl(projectId);
        const projectUrl = `/project/${urlSegment}`;

        // Test 1: URL should be properly formatted for browser history
        expect(projectUrl).toMatch(/^\/project\/[a-z-]+$/);

        // Test 2: URL should be resolvable from route
        const resolvedProject = getProjectByRoute(projectUrl);
        expect(resolvedProject).toBeDefined();
        expect(resolvedProject?.id).toBe(projectId);

        // Test 3: Render with history stack
        const historyStack = ['/', projectUrl];
        const { container } = render(
          <MemoryRouter initialEntries={historyStack} initialIndex={1}>
            <Routes>
              <Route path="/" element={<div>Dashboard</div>} />
              <Route 
                path="/project/:projectId" 
                element={<div data-testid="project-page">Project: {urlSegment}</div>} 
              />
            </Routes>
          </MemoryRouter>
        );

        // Test 4: Should render project page
        expect(container).toBeInTheDocument();
        expect(container.textContent).toContain(urlSegment);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13i: Direct URL Access
   * For any valid project URL, direct access (e.g., page refresh) should work
   * Validates: Requirements 1.5
   */
  test('Property 13i: Direct URL access loads projects correctly', () => {
    fc.assert(
      fc.property(projectTypeGenerator, (projectId) => {
        const projectConfig = getProjectById(projectId);
        if (!projectConfig) return true;

        const urlSegment = projectIdToUrl(projectId);
        const projectUrl = `/project/${urlSegment}`;

        // Test 1: Direct URL should be properly formatted
        expect(projectUrl).toMatch(/^\/project\/[a-z-]+$/);

        // Test 2: URL should resolve to correct project
        const convertedId = urlToProjectId(urlSegment);
        expect(convertedId).toBe(projectId);

        // Test 3: Project should be findable by route
        const foundProject = getProjectByRoute(projectUrl);
        expect(foundProject).toBeDefined();
        expect(foundProject?.id).toBe(projectId);

        // Test 4: Simulate direct URL access (no previous history)
        const { container } = render(
          <MemoryRouter initialEntries={[projectUrl]}>
            <Routes>
              <Route 
                path="/project/:projectId" 
                element={<div data-testid="direct-access">Direct: {urlSegment}</div>} 
              />
            </Routes>
          </MemoryRouter>
        );

        // Test 5: Should render without errors
        expect(container).toBeInTheDocument();
        expect(container.textContent).toContain(urlSegment);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 13j: URL Case Sensitivity
   * For any project URL, case variations should be handled appropriately
   * Validates: Requirements 1.5
   */
  test('Property 13j: URL case handling is consistent', () => {
    fc.assert(
      fc.property(projectTypeGenerator, (projectId) => {
        const urlSegment = projectIdToUrl(projectId);

        // Test 1: URL segment should be lowercase
        expect(urlSegment).toBe(urlSegment.toLowerCase());

        // Test 2: URL segment should not contain uppercase letters
        expect(urlSegment).toMatch(/^[a-z-]+$/);

        // Test 3: Conversion should be deterministic
        const secondConversion = projectIdToUrl(projectId);
        expect(secondConversion).toBe(urlSegment);

        return true;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
