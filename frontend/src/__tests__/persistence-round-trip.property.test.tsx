/**
 * Property-Based Test for Persistence Round Trip
 * Feature: frontend-restructure, Property 7: Persistence Round Trip
 * Validates: Requirements 4.4
 */

import { fc } from '@fast-check/jest';
import { render, cleanup, waitFor } from '@testing-library/react';
import React, { useEffect, useState } from 'react';
import { GlobalProvider } from '@/context/GlobalContext';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import type { Theme, ProjectType, UserPreferences } from '@/types';

// Reduced number of runs for faster testing
const NUM_RUNS = 20; // Reduced for faster execution

// Generators for property-based testing
const themeGenerator = fc.constantFrom<Theme>('light', 'dark');
const projectTypeGenerator = fc.constantFrom<ProjectType | null>('finger_count', 'volume_control', 'virtual_mouse', null);
const booleanGenerator = fc.boolean();

// Generator for complete UserPreferences
const userPreferencesGenerator = fc.record({
  theme: themeGenerator,
  sidebarCollapsed: booleanGenerator,
  defaultProject: projectTypeGenerator,
  showDebugInfo: booleanGenerator,
  animationsEnabled: booleanGenerator,
  autoReconnect: booleanGenerator,
});

// Helper to clear localStorage completely and synchronously
const clearLocalStorage = () => {
  // Get all keys first
  const allKeys = Object.keys(localStorage);
  
  // Remove all keys
  allKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Double-check with clear
  localStorage.clear();
  
  // Verify it's actually empty
  if (localStorage.length > 0) {
    console.warn('localStorage not fully cleared, forcing clear');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key) {
        localStorage.removeItem(key);
      }
    }
  }
};

// Helper to get preferences from localStorage
const getStoredPreferences = (): UserPreferences | null => {
  try {
    const stored = localStorage.getItem('gesture-control-preferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse stored preferences:', error);
  }
  return null;
};

// Helper to compare preferences (ignoring undefined vs null differences)
const preferencesEqual = (a: UserPreferences, b: UserPreferences): boolean => {
  return (
    a.theme === b.theme &&
    a.sidebarCollapsed === b.sidebarCollapsed &&
    a.defaultProject === b.defaultProject &&
    a.showDebugInfo === b.showDebugInfo &&
    a.animationsEnabled === b.animationsEnabled &&
    a.autoReconnect === b.autoReconnect
  );
};

describe('Property 7: Persistence Round Trip', () => {
  beforeEach(() => {
    clearLocalStorage();
    // Wait a tick to ensure cleanup completes
    return new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    cleanup();
    clearLocalStorage();
    // Wait a tick to ensure cleanup completes
    return new Promise(resolve => setTimeout(resolve, 10));
  });

  /**
   * Property 7a: Basic Persistence Round Trip
   * For any user preference change, saving to localStorage and reloading should restore the same values
   * Validates: Requirements 4.4
   */
  test('Property 7a: Preferences persist and restore correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        userPreferencesGenerator,
        async (preferences) => {
          // Clear localStorage at the start of each iteration
          clearLocalStorage();
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Component that sets preferences
          const SetterComponent = () => {
            const { actions } = useGlobalContext();
            const [initialized, setInitialized] = useState(false);
            
            useEffect(() => {
              if (!initialized) {
                // Set all preferences
                actions.updatePreferences(preferences);
                setInitialized(true);
              }
            }, [initialized]);
            
            return <div data-testid="setter-initialized">{initialized.toString()}</div>;
          };
          
          // Render component and set preferences
          let result = render(
            <GlobalProvider>
              <SetterComponent />
            </GlobalProvider>
          );
          
          // Wait for preferences to be set
          await waitFor(() => {
            expect(result.getByTestId('setter-initialized').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for localStorage to be updated (multiple effect cycles)
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Test 1: Preferences should be saved to localStorage
          const stored = getStoredPreferences();
          expect(stored).not.toBeNull();
          
          // Verify stored preferences match what we set
          if (stored) {
            expect(preferencesEqual(stored, preferences)).toBe(true);
          }
          
          // Unmount the setter component
          result.unmount();
          
          // Wait for unmount to complete and any pending effects to finish
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Component that reads preferences
          const GetterComponent = () => {
            const { state } = useGlobalContext();
            const [ready, setReady] = useState(false);
            
            useEffect(() => {
              if (state.isInitialized) {
                setReady(true);
              }
            }, [state.isInitialized]);
            
            return (
              <div>
                <span data-testid="theme">{state.preferences.theme}</span>
                <span data-testid="sidebar">{state.preferences.sidebarCollapsed.toString()}</span>
                <span data-testid="project">{state.preferences.defaultProject || 'null'}</span>
                <span data-testid="debug">{state.preferences.showDebugInfo.toString()}</span>
                <span data-testid="animations">{state.preferences.animationsEnabled.toString()}</span>
                <span data-testid="reconnect">{state.preferences.autoReconnect.toString()}</span>
                <span data-testid="ready">{ready.toString()}</span>
              </div>
            );
          };
          
          // Render new component instance (simulating app reload)
          result = render(
            <GlobalProvider>
              <GetterComponent />
            </GlobalProvider>
          );
          
          // Wait for component to be ready
          await waitFor(() => {
            expect(result.getByTestId('ready').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for state to fully settle after initialization
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Test 2: Restored preferences should match original
          const restoredPreferences: UserPreferences = {
            theme: result.getByTestId('theme').textContent as Theme,
            sidebarCollapsed: result.getByTestId('sidebar').textContent === 'true',
            defaultProject: result.getByTestId('project').textContent === 'null' ? null : result.getByTestId('project').textContent as ProjectType,
            showDebugInfo: result.getByTestId('debug').textContent === 'true',
            animationsEnabled: result.getByTestId('animations').textContent === 'true',
            autoReconnect: result.getByTestId('reconnect').textContent === 'true',
          };
          
          expect(preferencesEqual(restoredPreferences, preferences)).toBe(true);
          
          // Unmount the getter component
          result.unmount();
          
          // Clear localStorage after this iteration
          await new Promise(resolve => setTimeout(resolve, 100));
          clearLocalStorage();
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 60000); // Increased timeout

  /**
   * Property 7b: Theme Persistence
   * For any theme change, the theme should persist across sessions
   * Validates: Requirements 4.4
   */
  test('Property 7b: Theme preference persists correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        themeGenerator,
        async (theme) => {
          // Clear localStorage before this test iteration
          clearLocalStorage();
          
          const TestComponent = () => {
            const { state, actions } = useGlobalContext();
            const [initialized, setInitialized] = useState(false);
            
            useEffect(() => {
              if (!initialized) {
                actions.setTheme(theme);
                setInitialized(true);
              }
            }, [initialized]);
            
            return (
              <div>
                <span data-testid="theme">{state.theme}</span>
                <span data-testid="initialized">{initialized.toString()}</span>
              </div>
            );
          };
          
          // Set theme
          let result = render(
            <GlobalProvider>
              <TestComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('initialized').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for localStorage update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify it was saved
          const stored = getStoredPreferences();
          expect(stored?.theme).toBe(theme);
          
          // Unmount
          result.unmount();
          
          // Wait before creating new provider
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify persistence
          const ReadComponent = () => {
            const { state } = useGlobalContext();
            const [ready, setReady] = useState(false);
            
            useEffect(() => {
              if (state.isInitialized) {
                setReady(true);
              }
            }, [state.isInitialized]);
            
            return (
              <div>
                <span data-testid="theme">{state.theme}</span>
                <span data-testid="ready">{ready.toString()}</span>
              </div>
            );
          };
          
          result = render(
            <GlobalProvider>
              <ReadComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('ready').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for state to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Test: Theme should be restored
          expect(result.getByTestId('theme').textContent).toBe(theme);
          
          // Unmount
          result.unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 60000);

  /**
   * Property 7c: Sidebar State Persistence
   * For any sidebar state change, the state should persist across sessions
   * Validates: Requirements 4.4
   */
  test('Property 7c: Sidebar collapsed state persists correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        booleanGenerator,
        async (collapsed) => {
          // Clear localStorage before this test iteration
          clearLocalStorage();
          
          const TestComponent = () => {
            const { state, actions } = useGlobalContext();
            const [initialized, setInitialized] = useState(false);
            
            useEffect(() => {
              if (!initialized) {
                actions.setSidebarCollapsed(collapsed);
                setInitialized(true);
              }
            }, [initialized]);
            
            return (
              <div>
                <span data-testid="sidebar">{state.sidebarCollapsed.toString()}</span>
                <span data-testid="initialized">{initialized.toString()}</span>
              </div>
            );
          };
          
          // Set sidebar state
          let result = render(
            <GlobalProvider>
              <TestComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('initialized').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for localStorage update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify it was saved
          const stored = getStoredPreferences();
          expect(stored?.sidebarCollapsed).toBe(collapsed);
          
          // Unmount
          result.unmount();
          
          // Wait before creating new provider
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify persistence
          const ReadComponent = () => {
            const { state } = useGlobalContext();
            const [ready, setReady] = useState(false);
            
            useEffect(() => {
              if (state.isInitialized) {
                setReady(true);
              }
            }, [state.isInitialized]);
            
            return (
              <div>
                <span data-testid="sidebar">{state.sidebarCollapsed.toString()}</span>
                <span data-testid="ready">{ready.toString()}</span>
              </div>
            );
          };
          
          result = render(
            <GlobalProvider>
              <ReadComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('ready').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for state to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Test: Sidebar state should be restored
          expect(result.getByTestId('sidebar').textContent).toBe(collapsed.toString());
          
          // Unmount
          result.unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 60000);

  /**
   * Property 7d: Multiple Preference Updates
   * For any sequence of preference updates, the final state should persist correctly
   * Validates: Requirements 4.4
   */
  test('Property 7d: Multiple preference updates persist correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(userPreferencesGenerator, { minLength: 2, maxLength: 5 }),
        async (preferencesArray) => {
          const finalPreferences = preferencesArray[preferencesArray.length - 1];
          
          const TestComponent = () => {
            const { state, actions } = useGlobalContext();
            const [currentIndex, setCurrentIndex] = useState(0);
            const [isComplete, setIsComplete] = useState(false);
            
            useEffect(() => {
              if (currentIndex < preferencesArray.length) {
                actions.updatePreferences(preferencesArray[currentIndex]);
                setTimeout(() => setCurrentIndex(i => i + 1), 50);
              } else if (!isComplete) {
                setIsComplete(true);
              }
            }, [currentIndex, isComplete]);
            
            return (
              <div>
                <span data-testid="complete">{isComplete.toString()}</span>
                <span data-testid="theme">{state.preferences.theme}</span>
              </div>
            );
          };
          
          // Apply multiple updates
          const { getByTestId: getByTestIdSetter } = render(
            <GlobalProvider>
              <TestComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(getByTestIdSetter('complete').textContent).toBe('true');
          }, { timeout: 5000 });
          
          // Wait for localStorage update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          cleanup();
          
          // Verify final state persisted
          const ReadComponent = () => {
            const { state } = useGlobalContext();
            const [ready, setReady] = useState(false);
            
            useEffect(() => {
              if (state.isInitialized) {
                setReady(true);
              }
            }, [state.isInitialized]);
            
            return (
              <div>
                <span data-testid="theme">{state.preferences.theme}</span>
                <span data-testid="sidebar">{state.preferences.sidebarCollapsed.toString()}</span>
                <span data-testid="project">{state.preferences.defaultProject || 'null'}</span>
                <span data-testid="debug">{state.preferences.showDebugInfo.toString()}</span>
                <span data-testid="animations">{state.preferences.animationsEnabled.toString()}</span>
                <span data-testid="reconnect">{state.preferences.autoReconnect.toString()}</span>
                <span data-testid="ready">{ready.toString()}</span>
              </div>
            );
          };
          
          const { getByTestId: getByTestIdGetter } = render(
            <GlobalProvider>
              <ReadComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(getByTestIdGetter('ready').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Test: Final preferences should be restored
          const restoredPreferences: UserPreferences = {
            theme: getByTestIdGetter('theme').textContent as Theme,
            sidebarCollapsed: getByTestIdGetter('sidebar').textContent === 'true',
            defaultProject: getByTestIdGetter('project').textContent === 'null' ? null : getByTestIdGetter('project').textContent as ProjectType,
            showDebugInfo: getByTestIdGetter('debug').textContent === 'true',
            animationsEnabled: getByTestIdGetter('animations').textContent === 'true',
            autoReconnect: getByTestIdGetter('reconnect').textContent === 'true',
          };
          
          expect(preferencesEqual(restoredPreferences, finalPreferences)).toBe(true);
          
          cleanup();
          return true;
        }
      ),
      { numRuns: 20 } // Reduced runs for this more complex test
    );
  }, 40000);

  /**
   * Property 7e: Persistence Resilience
   * For any preferences, persistence should handle edge cases gracefully
   * Validates: Requirements 4.4
   */
  test('Property 7e: Persistence handles edge cases gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        userPreferencesGenerator,
        async (preferences) => {
          const TestComponent = () => {
            const { state, actions } = useGlobalContext();
            const [initialized, setInitialized] = useState(false);
            
            useEffect(() => {
              if (!initialized) {
                actions.updatePreferences(preferences);
                setInitialized(true);
              }
            }, [initialized]);
            
            return (
              <div>
                <span data-testid="initialized">{initialized.toString()}</span>
              </div>
            );
          };
          
          // Set preferences
          const { getByTestId } = render(
            <GlobalProvider>
              <TestComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(getByTestId('initialized').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for localStorage update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Test 1: Preferences should be in localStorage
          const stored = getStoredPreferences();
          expect(stored).not.toBeNull();
          
          // Test 2: Stored preferences should be valid JSON
          const storedString = localStorage.getItem('gesture-control-preferences');
          expect(() => JSON.parse(storedString!)).not.toThrow();
          
          // Test 3: Stored preferences should have all required fields
          if (stored) {
            expect(stored).toHaveProperty('theme');
            expect(stored).toHaveProperty('sidebarCollapsed');
            expect(stored).toHaveProperty('showDebugInfo');
            expect(stored).toHaveProperty('animationsEnabled');
            expect(stored).toHaveProperty('autoReconnect');
          }
          
          // Test 4: Backup should be created
          const allKeys = Object.keys(localStorage);
          const backupKeys = allKeys.filter(key => key.startsWith('gesture-control-preferences-backup-'));
          expect(backupKeys.length).toBeGreaterThan(0);
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 30000);

  /**
   * Property 7f: Default Project Persistence
   * For any default project setting, it should persist correctly
   * Validates: Requirements 4.4
   */
  test('Property 7f: Default project preference persists correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectTypeGenerator,
        async (defaultProject) => {
          // Clear localStorage before this test iteration
          clearLocalStorage();
          
          const TestComponent = () => {
            const { state, actions } = useGlobalContext();
            const [initialized, setInitialized] = useState(false);
            
            useEffect(() => {
              if (!initialized) {
                actions.updatePreferences({ defaultProject });
                setInitialized(true);
              }
            }, [initialized]);
            
            return (
              <div>
                <span data-testid="project">{state.preferences.defaultProject || 'null'}</span>
                <span data-testid="initialized">{initialized.toString()}</span>
              </div>
            );
          };
          
          // Set default project
          let result = render(
            <GlobalProvider>
              <TestComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('initialized').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for localStorage update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify it was saved
          const stored = getStoredPreferences();
          expect(stored?.defaultProject).toBe(defaultProject);
          
          // Unmount
          result.unmount();
          
          // Wait before creating new provider
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify persistence
          const ReadComponent = () => {
            const { state } = useGlobalContext();
            const [ready, setReady] = useState(false);
            
            useEffect(() => {
              if (state.isInitialized) {
                setReady(true);
              }
            }, [state.isInitialized]);
            
            return (
              <div>
                <span data-testid="project">{state.preferences.defaultProject || 'null'}</span>
                <span data-testid="ready">{ready.toString()}</span>
              </div>
            );
          };
          
          result = render(
            <GlobalProvider>
              <ReadComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('ready').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for state to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Test: Default project should be restored
          const restoredProject = result.getByTestId('project').textContent;
          const expectedProject = defaultProject || 'null';
          expect(restoredProject).toBe(expectedProject);
          
          // Unmount
          result.unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 60000);

  /**
   * Property 7g: Boolean Preferences Persistence
   * For any boolean preference changes, they should persist correctly
   * Validates: Requirements 4.4
   */
  test('Property 7g: Boolean preferences persist correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        booleanGenerator,
        booleanGenerator,
        booleanGenerator,
        async (showDebugInfo, animationsEnabled, autoReconnect) => {
          // Clear localStorage before this test iteration
          clearLocalStorage();
          
          const TestComponent = () => {
            const { state, actions } = useGlobalContext();
            const [initialized, setInitialized] = useState(false);
            
            useEffect(() => {
              if (!initialized) {
                actions.updatePreferences({
                  showDebugInfo,
                  animationsEnabled,
                  autoReconnect,
                });
                setInitialized(true);
              }
            }, [initialized]);
            
            return (
              <div>
                <span data-testid="debug">{state.preferences.showDebugInfo.toString()}</span>
                <span data-testid="animations">{state.preferences.animationsEnabled.toString()}</span>
                <span data-testid="reconnect">{state.preferences.autoReconnect.toString()}</span>
                <span data-testid="initialized">{initialized.toString()}</span>
              </div>
            );
          };
          
          // Set boolean preferences
          let result = render(
            <GlobalProvider>
              <TestComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('initialized').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for localStorage update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify they were saved
          const stored = getStoredPreferences();
          expect(stored?.showDebugInfo).toBe(showDebugInfo);
          expect(stored?.animationsEnabled).toBe(animationsEnabled);
          expect(stored?.autoReconnect).toBe(autoReconnect);
          
          // Unmount
          result.unmount();
          
          // Wait before creating new provider
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify persistence
          const ReadComponent = () => {
            const { state } = useGlobalContext();
            const [ready, setReady] = useState(false);
            
            useEffect(() => {
              if (state.isInitialized) {
                setReady(true);
              }
            }, [state.isInitialized]);
            
            return (
              <div>
                <span data-testid="debug">{state.preferences.showDebugInfo.toString()}</span>
                <span data-testid="animations">{state.preferences.animationsEnabled.toString()}</span>
                <span data-testid="reconnect">{state.preferences.autoReconnect.toString()}</span>
                <span data-testid="ready">{ready.toString()}</span>
              </div>
            );
          };
          
          result = render(
            <GlobalProvider>
              <ReadComponent />
            </GlobalProvider>
          );
          
          await waitFor(() => {
            expect(result.getByTestId('ready').textContent).toBe('true');
          }, { timeout: 3000 });
          
          // Wait for state to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Test: Boolean preferences should be restored correctly
          expect(result.getByTestId('debug').textContent).toBe(showDebugInfo.toString());
          expect(result.getByTestId('animations').textContent).toBe(animationsEnabled.toString());
          expect(result.getByTestId('reconnect').textContent).toBe(autoReconnect.toString());
          
          // Unmount
          result.unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  }, 60000);
});
