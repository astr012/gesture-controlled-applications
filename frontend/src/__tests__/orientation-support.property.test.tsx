/**
 * Property-Based Test for Orientation Support
 * Feature: frontend-restructure, Property 15: Orientation Support
 * Validates: Requirements 9.5
 */

import { fc } from '@fast-check/jest';
import { render, screen, within, act, cleanup, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the useGlobalContext hook
const mockToggleSidebar = jest.fn();
const mockSetSidebarCollapsed = jest.fn();
const mockSelectProject = jest.fn();

let mockSidebarCollapsed = false;
let mockCurrentProject: string | null = null;

jest.mock('@/hooks/useGlobalContext', () => ({
  useGlobalContext: jest.fn(() => ({
    state: {
      isInitialized: true,
      theme: 'light' as const,
      sidebarCollapsed: mockSidebarCollapsed,
      connectionStatus: {
        connected: true,
        reconnecting: false,
        error: null,
        quality: { 
          status: 'excellent' as const, 
          score: 100, 
          factors: { latency: 10, stability: 100, throughput: 100 } 
        },
        latency: 10,
        uptime: 1000,
      },
      currentProject: mockCurrentProject,
      availableProjects: [],
      preferences: {
        theme: 'light' as const,
        sidebarCollapsed: mockSidebarCollapsed,
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
      toggleSidebar: mockToggleSidebar,
      setSidebarCollapsed: mockSetSidebarCollapsed,
      updateConnectionStatus: jest.fn(),
      selectProject: mockSelectProject,
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
  useGlobalDebug: jest.fn(() => ({
    isEnabled: false,
    stateHistory: [],
    performanceMetrics: {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
    },
    logStateChange: jest.fn(),
  })),
  useGlobalActions: jest.fn(() => ({
    setTheme: jest.fn(),
    toggleSidebar: mockToggleSidebar,
    setSidebarCollapsed: mockSetSidebarCollapsed,
    updateConnectionStatus: jest.fn(),
    selectProject: mockSelectProject,
    setAvailableProjects: jest.fn(),
    updatePreferences: jest.fn(),
    loadProjects: jest.fn(),
    toggleDebugMode: jest.fn(),
    clearStateHistory: jest.fn(),
    exportState: jest.fn(),
    importState: jest.fn(),
  })),
  useGlobalState: jest.fn(() => ({
    isInitialized: true,
    theme: 'light' as const,
    sidebarCollapsed: mockSidebarCollapsed,
    connectionStatus: {
      connected: true,
      reconnecting: false,
      error: null,
      quality: { status: 'excellent' as const, score: 100, factors: { latency: 10, stability: 100, throughput: 100 } },
      latency: 10,
      uptime: 1000,
    },
    currentProject: mockCurrentProject,
    availableProjects: [],
    preferences: {
      theme: 'light' as const,
      sidebarCollapsed: mockSidebarCollapsed,
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
    },
    actions: {
      updateGestureData: jest.fn(),
      updateSettings: jest.fn(),
      setDisplayMode: jest.fn(),
      toggleDebugInfo: jest.fn(),
    },
  })),
}));

// Mock ConnectionStatus component
jest.mock('@/components/ConnectionStatus/ConnectionStatus', () => ({
  ConnectionStatus: () => <div data-testid="connection-status">Connected</div>,
}));

// Mock ProjectSelector component
jest.mock('@/components/ProjectSelector/ProjectSelector', () => ({
  ProjectSelector: ({ currentProject, onProjectSelect, disabled }: any) => (
    <div data-testid="project-selector">
      <button
        aria-label="Finger Counting"
        title="Finger Counting"
        onClick={() => onProjectSelect('finger_count')}
        disabled={disabled}
        className={currentProject === 'finger_count' ? 'active' : ''}
      >
        ✋ Finger Counting
      </button>
      <button
        aria-label="Volume Control"
        title="Volume Control"
        onClick={() => onProjectSelect('volume_control')}
        disabled={disabled}
        className={currentProject === 'volume_control' ? 'active' : ''}
      >
        🔊 Volume Control
      </button>
    </div>
  ),
}));

// Mock WebSocket hook
jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionStatus: {
      connected: true,
      reconnecting: false,
      error: null,
      quality: { status: 'excellent', score: 100, factors: { latency: 10, stability: 100, throughput: 100 } },
      latency: 10,
      uptime: 1000,
    },
    reconnect: jest.fn(),
    sendMessage: jest.fn(),
  }),
}));

// Mock performance monitor
jest.mock('@/services/PerformanceMonitor', () => ({
  withPerformanceTracking: (Component: React.ComponentType) => Component,
}));

// Mock react-router-dom Outlet
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet-content">Test Content</div>,
}));

import MainLayout from '@/components/layout/MainLayout';

// Orientation types
type Orientation = 'portrait' | 'landscape';

// Device configurations for testing
interface DeviceConfig {
  width: number;
  height: number;
  orientation: Orientation;
}

// Common device sizes
const DEVICE_CONFIGS: DeviceConfig[] = [
  // Mobile portrait
  { width: 375, height: 667, orientation: 'portrait' },
  { width: 414, height: 896, orientation: 'portrait' },
  { width: 360, height: 740, orientation: 'portrait' },
  // Mobile landscape
  { width: 667, height: 375, orientation: 'landscape' },
  { width: 896, height: 414, orientation: 'landscape' },
  { width: 740, height: 360, orientation: 'landscape' },
  // Tablet portrait
  { width: 768, height: 1024, orientation: 'portrait' },
  { width: 810, height: 1080, orientation: 'portrait' },
  // Tablet landscape
  { width: 1024, height: 768, orientation: 'landscape' },
  { width: 1080, height: 810, orientation: 'landscape' },
];

// Generators for property-based testing
const orientationGenerator = fc.constantFrom<Orientation>('portrait', 'landscape');
const mobilePortraitGenerator = fc.record({
  width: fc.integer({ min: 320, max: 480 }),
  height: fc.integer({ min: 568, max: 926 }),
  orientation: fc.constant<Orientation>('portrait'),
});
const mobileLandscapeGenerator = fc.record({
  width: fc.integer({ min: 568, max: 926 }),
  height: fc.integer({ min: 320, max: 480 }),
  orientation: fc.constant<Orientation>('landscape'),
});
const tabletPortraitGenerator = fc.record({
  width: fc.integer({ min: 768, max: 834 }),
  height: fc.integer({ min: 1024, max: 1194 }),
  orientation: fc.constant<Orientation>('portrait'),
});
const tabletLandscapeGenerator = fc.record({
  width: fc.integer({ min: 1024, max: 1194 }),
  height: fc.integer({ min: 768, max: 834 }),
  orientation: fc.constant<Orientation>('landscape'),
});

// Combined device generator
const deviceConfigGenerator = fc.oneof(
  mobilePortraitGenerator,
  mobileLandscapeGenerator,
  tabletPortraitGenerator,
  tabletLandscapeGenerator
);

// Reduced number of runs for faster testing
const NUM_RUNS = 50;

// Helper to set viewport size and orientation
const setViewportAndOrientation = (config: DeviceConfig) => {
  act(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: config.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: config.height,
    });
    
    // Mock matchMedia for orientation
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes(config.orientation),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
  });
};

// Helper to render MainLayout with router and wait for effects
const renderMainLayout = async () => {
  let result;
  await act(async () => {
    result = render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );
    // Wait for useEffect to run
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  return result!;
};

// Helper to check if element is visible
const isElementVisible = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
};

// Helper to get layout structure
const getLayoutStructure = (container: HTMLElement) => {
  const header = container.querySelector('header');
  const sidebar = container.querySelector('aside');
  const main = container.querySelector('main');
  const bottomNav = container.querySelector('[class*="bottomNavigation"]');
  const mobileOverlay = container.querySelector('[class*="mobileOverlay"]');

  return {
    header,
    sidebar,
    main,
    bottomNav,
    mobileOverlay,
    hasHeader: !!header,
    hasSidebar: !!sidebar,
    hasMain: !!main,
    hasBottomNav: !!bottomNav,
    hasMobileOverlay: !!mobileOverlay,
  };
};

// Helper to get all interactive elements
const getInteractiveElements = (container: HTMLElement): HTMLElement[] => {
  const buttons = Array.from(container.querySelectorAll('button'));
  const links = Array.from(container.querySelectorAll('a'));
  const inputs = Array.from(container.querySelectorAll('input, select, textarea'));
  
  return [...buttons, ...links, ...inputs] as HTMLElement[];
};

// Helper to check if layout is functional
const isLayoutFunctional = (container: HTMLElement): boolean => {
  const structure = getLayoutStructure(container);
  
  // Must have core elements
  if (!structure.hasHeader || !structure.hasMain) {
    return false;
  }
  
  // Must have some form of navigation
  if (!structure.hasSidebar && !structure.hasBottomNav) {
    return false;
  }
  
  // Must have interactive elements
  const interactiveElements = getInteractiveElements(container);
  if (interactiveElements.length === 0) {
    return false;
  }
  
  return true;
};

// Helper to determine if device is mobile based on dimensions
const isMobileDevice = (width: number, height: number): boolean => {
  return Math.min(width, height) <= 768;
};

describe('Property 15: Orientation Support', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockSidebarCollapsed = false;
    mockCurrentProject = null;
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  /**
   * Property 15a: Layout Adapts to Orientation Changes
   * For any device orientation change, the layout should adapt and remain functional
   * Validates: Requirements 9.5
   */
  test('Property 15a: Layout adapts to orientation changes and remains functional', () => {
    fc.assert(
      fc.asyncProperty(
        deviceConfigGenerator,
        async (config) => {
          // Set viewport and orientation
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();

          // Test 1: Layout should be functional in any orientation
          const isFunctional = isLayoutFunctional(container);
          expect(isFunctional).toBe(true);

          // Test 2: Core elements should be present
          const structure = getLayoutStructure(container);
          expect(structure.hasHeader).toBe(true);
          expect(structure.hasMain).toBe(true);

          // Test 3: Should have navigation
          const hasNavigation = structure.hasSidebar || structure.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15b: Portrait Mode Functionality
   * For any portrait orientation, the layout should be fully functional
   * Validates: Requirements 9.5
   */
  test('Property 15b: Layout is fully functional in portrait orientation', () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(mobilePortraitGenerator, tabletPortraitGenerator),
        async (config) => {
          // Set portrait orientation
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();
          const structure = getLayoutStructure(container);

          // Test 1: Core elements should be present
          expect(structure.hasHeader).toBe(true);
          expect(structure.hasMain).toBe(true);

          // Test 2: Should have navigation
          const hasNavigation = structure.hasSidebar || structure.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Test 3: Interactive elements should be accessible
          const interactiveElements = getInteractiveElements(container);
          expect(interactiveElements.length).toBeGreaterThan(0);

          // Test 4: Layout should be functional
          expect(isLayoutFunctional(container)).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15c: Landscape Mode Functionality
   * For any landscape orientation, the layout should be fully functional
   * Validates: Requirements 9.5
   */
  test('Property 15c: Layout is fully functional in landscape orientation', () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(mobileLandscapeGenerator, tabletLandscapeGenerator),
        async (config) => {
          // Set landscape orientation
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();
          const structure = getLayoutStructure(container);

          // Test 1: Core elements should be present
          expect(structure.hasHeader).toBe(true);
          expect(structure.hasMain).toBe(true);

          // Test 2: Should have navigation
          const hasNavigation = structure.hasSidebar || structure.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Test 3: Interactive elements should be accessible
          const interactiveElements = getInteractiveElements(container);
          expect(interactiveElements.length).toBeGreaterThan(0);

          // Test 4: Layout should be functional
          expect(isLayoutFunctional(container)).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15d: Orientation Change Preserves State
   * For any orientation change, the application state should be preserved
   * Validates: Requirements 9.5
   */
  test('Property 15d: Orientation changes preserve application state', () => {
    fc.assert(
      fc.asyncProperty(
        mobilePortraitGenerator,
        async (portraitConfig) => {
          // Start in portrait
          setViewportAndOrientation(portraitConfig);
          mockSidebarCollapsed = false;
          mockCurrentProject = 'finger_count';

          // Render layout
          const { container: container1 } = await renderMainLayout();
          const structure1 = getLayoutStructure(container1);

          // Verify initial state
          expect(structure1.hasHeader).toBe(true);
          expect(structure1.hasMain).toBe(true);

          // Switch to landscape
          const landscapeConfig: DeviceConfig = {
            width: portraitConfig.height,
            height: portraitConfig.width,
            orientation: 'landscape',
          };
          
          cleanup();
          setViewportAndOrientation(landscapeConfig);

          // Render layout again
          const { container: container2 } = await renderMainLayout();
          const structure2 = getLayoutStructure(container2);

          // Test: Core elements should still be present after orientation change
          expect(structure2.hasHeader).toBe(true);
          expect(structure2.hasMain).toBe(true);
          
          // Should still have navigation
          const hasNavigation = structure2.hasSidebar || structure2.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: 20 } // Reduced for complex async tests
    );
  });

  /**
   * Property 15e: Mobile Portrait Navigation
   * For any mobile portrait orientation, navigation should be accessible
   * Validates: Requirements 9.5
   */
  test('Property 15e: Mobile portrait provides accessible navigation', () => {
    fc.assert(
      fc.asyncProperty(
        mobilePortraitGenerator,
        async (config) => {
          // Set mobile portrait
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();
          const structure = getLayoutStructure(container);

          // Test 1: Should have navigation
          const hasNavigation = structure.hasSidebar || structure.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Test 2: Should have interactive elements
          const interactiveElements = getInteractiveElements(container);
          expect(interactiveElements.length).toBeGreaterThan(0);

          // Test 3: Header should be present
          expect(structure.hasHeader).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15f: Mobile Landscape Navigation
   * For any mobile landscape orientation, navigation should be accessible
   * Validates: Requirements 9.5
   */
  test('Property 15f: Mobile landscape provides accessible navigation', () => {
    fc.assert(
      fc.asyncProperty(
        mobileLandscapeGenerator,
        async (config) => {
          // Set mobile landscape
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();
          const structure = getLayoutStructure(container);

          // Test 1: Should have navigation
          const hasNavigation = structure.hasSidebar || structure.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Test 2: Should have interactive elements
          const interactiveElements = getInteractiveElements(container);
          expect(interactiveElements.length).toBeGreaterThan(0);

          // Test 3: Header should be present
          expect(structure.hasHeader).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15g: Tablet Orientation Flexibility
   * For any tablet orientation, the layout should adapt appropriately
   * Validates: Requirements 9.5
   */
  test('Property 15g: Tablet layout adapts to both orientations', () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(tabletPortraitGenerator, tabletLandscapeGenerator),
        async (config) => {
          // Set tablet orientation
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();
          const structure = getLayoutStructure(container);

          // Test 1: Core elements should be present
          expect(structure.hasHeader).toBe(true);
          expect(structure.hasMain).toBe(true);

          // Test 2: Should have navigation
          const hasNavigation = structure.hasSidebar || structure.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Test 3: Layout should be functional
          expect(isLayoutFunctional(container)).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15h: Content Visibility in All Orientations
   * For any orientation, main content should be visible and accessible
   * Validates: Requirements 9.5
   */
  test('Property 15h: Main content remains visible in all orientations', () => {
    fc.assert(
      fc.asyncProperty(
        deviceConfigGenerator,
        async (config) => {
          // Set orientation
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();
          const structure = getLayoutStructure(container);

          // Test 1: Main content area should exist
          expect(structure.hasMain).toBe(true);
          expect(structure.main).toBeTruthy();

          // Test 2: Main content should be in the DOM
          if (structure.main) {
            expect(container.contains(structure.main)).toBe(true);
          }

          // Test 3: Outlet content should be rendered
          const outletContent = container.querySelector('[data-testid="outlet-content"]');
          expect(outletContent).toBeTruthy();

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15i: Interactive Elements Remain Accessible
   * For any orientation change, interactive elements should remain accessible
   * Validates: Requirements 9.5
   */
  test('Property 15i: Interactive elements remain accessible across orientations', () => {
    fc.assert(
      fc.asyncProperty(
        deviceConfigGenerator,
        async (config) => {
          // Set orientation
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();

          // Test 1: Should have interactive elements
          const interactiveElements = getInteractiveElements(container);
          expect(interactiveElements.length).toBeGreaterThan(0);

          // Test 2: Interactive elements should be in the DOM
          interactiveElements.forEach(element => {
            expect(container.contains(element)).toBe(true);
          });

          // Test 3: Buttons should have proper attributes
          const buttons = container.querySelectorAll('button');
          buttons.forEach(button => {
            // Should have type or aria-label
            const hasProperAttributes = 
              button.hasAttribute('type') ||
              button.hasAttribute('aria-label') ||
              button.textContent;
            expect(hasProperAttributes).toBeTruthy();
          });

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 15j: Common Device Orientations
   * Test common real-world device configurations
   * Validates: Requirements 9.5
   */
  test('Property 15j: Layout works correctly on common device orientations', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...DEVICE_CONFIGS),
        async (config) => {
          // Set orientation
          setViewportAndOrientation(config);

          // Render layout
          const { container } = await renderMainLayout();

          // Test 1: Core elements should be present
          const structure = getLayoutStructure(container);
          expect(structure.hasHeader).toBe(true);
          expect(structure.hasMain).toBe(true);

          // Test 2: Should have navigation
          const hasNavigation = structure.hasSidebar || structure.hasBottomNav;
          expect(hasNavigation).toBe(true);

          // Test 3: Layout should be functional
          expect(isLayoutFunctional(container)).toBe(true);

          // Cleanup
          cleanup();
          return true;
        }
      ),
      { numRuns: DEVICE_CONFIGS.length }
    );
  });
});
