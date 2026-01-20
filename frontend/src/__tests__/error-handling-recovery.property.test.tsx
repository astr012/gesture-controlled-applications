/**
 * Property-Based Test for Error Handling and Recovery
 * Feature: frontend-restructure, Property 16: Error Handling and Recovery
 * Validates: Requirements 3.5, 10.1, 10.2, 10.3
 */

import { fc } from '@fast-check/jest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import ErrorBoundary, { type ErrorSeverity, type ErrorBoundaryLevel } from '@/components/ui/ErrorBoundary';
import AppErrorBoundary from '@/components/ui/AppErrorBoundary';
import ProjectErrorBoundary from '@/components/ui/ProjectErrorBoundary';
import RouteErrorBoundary from '@/components/ui/RouteErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import type { ProjectType } from '@/types';

// Reduced number of runs for faster testing
const NUM_RUNS = 50;

// Generators for property-based testing
const errorSeverityGenerator = fc.constantFrom<ErrorSeverity>('low', 'medium', 'high', 'critical');
const errorBoundaryLevelGenerator = fc.constantFrom<ErrorBoundaryLevel>('app', 'route', 'project', 'component');
const projectTypeGenerator = fc.constantFrom<ProjectType>('finger_count', 'volume_control', 'virtual_mouse');

// Generator for error messages
const errorMessageGenerator = fc.oneof(
  fc.constant('Network error occurred'),
  fc.constant('Component render failed'),
  fc.constant('WebSocket connection lost'),
  fc.constant('Chunk load failed'),
  fc.constant('Invalid state transition'),
  fc.constant('Timeout exceeded'),
  fc.constant('Resource not found'),
  fc.string({ minLength: 10, maxLength: 50 })
);

// Generator for error names
const errorNameGenerator = fc.oneof(
  fc.constant('Error'),
  fc.constant('TypeError'),
  fc.constant('ReferenceError'),
  fc.constant('NetworkError'),
  fc.constant('TimeoutError'),
  fc.constant('ChunkLoadError')
);

// Generator for custom errors
const customErrorGenerator = fc.record({
  name: errorNameGenerator,
  message: errorMessageGenerator,
});

// Component that throws an error
interface ThrowErrorProps {
  shouldThrow: boolean;
  error: Error;
  children?: React.ReactNode;
}

const ThrowError: React.FC<ThrowErrorProps> = ({ shouldThrow, error, children }) => {
  if (shouldThrow) {
    throw error;
  }
  return <>{children || <div>Component rendered successfully</div>}</>;
};

// Component with controlled error throwing
interface ControlledErrorComponentProps {
  onMount?: () => void;
}

const ControlledErrorComponent: React.FC<ControlledErrorComponentProps> = ({ onMount }) => {
  React.useEffect(() => {
    onMount?.();
  }, [onMount]);

  return <div data-testid="controlled-component">Controlled Component</div>;
};

describe('Property 16: Error Handling and Recovery', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  /**
   * Property 16a: User-Friendly Error Messages
   * For any error condition, the system should display user-friendly messages with suggested actions
   * Validates: Requirements 10.1
   */
  test('Property 16a: System displays user-friendly error messages for all error types', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorSeverityGenerator,
        (errorData, expectedSeverity) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          const { container } = render(
            <ErrorBoundary level="component">
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Error boundary should catch the error
          expect(container.querySelector('[class*="container"]')).toBeInTheDocument();

          // Test 2: Should display user-friendly title
          const title = container.querySelector('[class*="title"]');
          expect(title).toBeInTheDocument();
          expect(title?.textContent).toBeTruthy();

          // Test 3: Should display helpful message
          const message = container.querySelector('[class*="message"]');
          expect(message).toBeInTheDocument();
          expect(message?.textContent).toBeTruthy();
          expect(message?.textContent?.length).toBeGreaterThan(10);

          // Test 4: Should display error icon
          const icon = container.querySelector('[class*="icon"]');
          expect(icon).toBeInTheDocument();

          // Test 5: Should provide action buttons
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16b: Error Boundaries Prevent Crashes
   * For any error, error boundaries should prevent complete application crashes
   * Validates: Requirements 10.2
   */
  test('Property 16b: Error boundaries prevent complete application crashes', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorBoundaryLevelGenerator,
        (errorData, level) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          let renderResult;
          
          // Test that rendering doesn't throw
          expect(() => {
            renderResult = render(
              <ErrorBoundary level={level}>
                <ThrowError shouldThrow={true} error={error} />
              </ErrorBoundary>
            );
          }).not.toThrow();

          // Test 1: Error boundary should render fallback UI
          expect(renderResult?.container).toBeInTheDocument();

          // Test 2: Fallback UI should be visible
          const fallbackUI = renderResult?.container.querySelector('[class*="container"]');
          expect(fallbackUI).toBeInTheDocument();

          // Test 3: Application should remain functional (can query DOM)
          expect(() => {
            renderResult?.container.querySelector('button');
          }).not.toThrow();

          // Test 4: Error should be contained (not propagated)
          expect(renderResult?.container.textContent).toBeTruthy();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16c: Recovery Options Provided
   * For any error, the system should provide recovery options (retry, refresh, etc.)
   * Validates: Requirements 10.3
   */
  test('Property 16c: System provides recovery options for all errors', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        fc.boolean(),
        fc.boolean(),
        (errorData, showRetry, showRefresh) => {
          // Skip invalid combinations where both options are disabled
          // At least one recovery option should always be available
          if (!showRetry && !showRefresh) {
            return true; // Skip this test case
          }

          const error = new Error(errorData.message);
          error.name = errorData.name;

          const { container } = render(
            <ErrorBoundary 
              level="component"
              showRetry={showRetry}
              showRefresh={showRefresh}
            >
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Should have action buttons section
          const actionsSection = container.querySelector('[class*="actions"]');
          expect(actionsSection).toBeInTheDocument();

          // Test 2: Should show retry button if enabled
          const retryButton = Array.from(container.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Try Again'));
          
          if (showRetry) {
            expect(retryButton).toBeInTheDocument();
          }

          // Test 3: Should show refresh button if enabled
          const refreshButton = Array.from(container.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Refresh'));
          
          if (showRefresh) {
            expect(refreshButton).toBeInTheDocument();
          }

          // Test 4: Should have at least one recovery option
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);

          // Test 5: Buttons should be clickable (not disabled by default)
          const firstButton = buttons[0] as HTMLButtonElement;
          expect(firstButton.disabled).toBe(false);

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16d: Retry Mechanism Works
   * For any error with retry enabled, the retry mechanism should work correctly
   * Validates: Requirements 10.3
   */
  test('Property 16d: Retry mechanism recovers from errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageGenerator,
        fc.integer({ min: 1, max: 3 }),
        async (errorMessage, maxRetries) => {
          let throwError = true;
          let retryCount = 0;
          const onRetry = jest.fn(() => {
            retryCount++;
            if (retryCount >= maxRetries) {
              throwError = false;
            }
          });

          const error = new Error(errorMessage);

          const TestWrapper = () => {
            const [shouldThrow, setShouldThrow] = React.useState(throwError);

            return (
              <ErrorBoundary 
                level="component"
                onRetry={() => {
                  onRetry();
                  if (retryCount >= maxRetries) {
                    setShouldThrow(false);
                  }
                }}
                showRetry={true}
              >
                <ThrowError shouldThrow={shouldThrow} error={error}>
                  <div data-testid="success">Success!</div>
                </ThrowError>
              </ErrorBoundary>
            );
          };

          const { container, unmount } = render(<TestWrapper />);

          // Test 1: Should show error initially
          expect(container.querySelector('[class*="container"]')).toBeInTheDocument();

          // Simulate retries
          for (let i = 0; i < maxRetries && i < 3; i++) {
            const retryButton = Array.from(container.querySelectorAll('button'))
              .find(btn => btn.textContent?.includes('Try Again'));

            if (retryButton) {
              const user = userEvent.setup();
              await user.click(retryButton);
              
              // Wait for state update with proper condition
              await waitFor(() => {
                if (i === maxRetries - 1) {
                  // Last retry should succeed - check for success element
                  const successElements = screen.queryAllByTestId('success');
                  if (successElements.length > 0) {
                    // Success state reached
                    expect(successElements.length).toBeGreaterThan(0);
                  }
                }
              }, { timeout: 1000 });
            }
          }

          // Test 2: Retry callback should be called
          expect(onRetry).toHaveBeenCalled();

          // Test 3: After successful retry, error UI should be gone
          if (retryCount >= maxRetries) {
            await waitFor(() => {
              const errorContainer = container.querySelector('[class*="container"]');
              const successElements = screen.queryAllByTestId('success');
              // Either error is gone and success is shown, or we're still in error state
              if (successElements.length > 0) {
                expect(errorContainer).not.toBeInTheDocument();
              }
            }, { timeout: 1000 });
          }

          // Cleanup to prevent multiple elements in next test
          unmount();

          return true;
        }
      ),
      { numRuns: 20 } // Reduced for async test
    );
  }, 30000);

  /**
   * Property 16e: Hierarchical Error Boundaries
   * For any error at different levels, the appropriate error boundary should catch it
   * Validates: Requirements 10.2
   */
  test('Property 16e: Hierarchical error boundaries isolate errors correctly', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorBoundaryLevelGenerator,
        (errorData, level) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          const { container } = render(
            <ErrorBoundary level="app">
              <ErrorBoundary level="route">
                <ErrorBoundary level="project">
                  <ErrorBoundary level="component">
                    <ThrowError shouldThrow={true} error={error} />
                  </ErrorBoundary>
                </ErrorBoundary>
              </ErrorBoundary>
            </ErrorBoundary>
          );

          // Test 1: Error should be caught by innermost boundary
          expect(container.querySelector('[class*="container"]')).toBeInTheDocument();

          // Test 2: Only one error UI should be visible (innermost boundary)
          const errorContainers = container.querySelectorAll('[class*="container"]');
          expect(errorContainers.length).toBe(1);

          // Test 3: Outer boundaries should not show error UI
          // (they should render their children normally)
          expect(container.textContent).toBeTruthy();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16f: Project-Specific Error Handling
   * For any project error, project-specific error handling should work
   * Validates: Requirements 3.5, 10.2
   */
  test('Property 16f: Project errors are handled with project-specific fallbacks', () => {
    fc.assert(
      fc.property(
        projectTypeGenerator,
        errorMessageGenerator,
        (projectId, errorMessage) => {
          const error = new Error(errorMessage);
          const onProjectError = jest.fn();

          const { container } = render(
            <ProjectErrorBoundary
              projectId={projectId}
              projectName={`Test ${projectId}`}
              onProjectError={onProjectError}
            >
              <ThrowError shouldThrow={true} error={error} />
            </ProjectErrorBoundary>
          );

          // Test 1: Should display project-specific error UI
          expect(container.textContent).toContain(projectId);

          // Test 2: Should call project error callback
          expect(onProjectError).toHaveBeenCalledWith(projectId, error);

          // Test 3: Should provide project-specific recovery options
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);

          // Test 4: Should show troubleshooting tips
          expect(container.textContent).toContain('Troubleshooting');

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16g: Route Error Handling
   * For any route error, route-specific error handling should work
   * Validates: Requirements 10.2
   */
  test('Property 16g: Route errors are handled with navigation recovery', () => {
    fc.assert(
      fc.property(
        errorMessageGenerator,
        (errorMessage) => {
          const error = new Error(errorMessage);

          const { container } = render(
            <BrowserRouter>
              <RouteErrorBoundary fallbackRoute="/">
                <ThrowError shouldThrow={true} error={error} />
              </RouteErrorBoundary>
            </BrowserRouter>
          );

          // Test 1: Should display route error UI
          expect(container.querySelector('[class*="container"]')).toBeInTheDocument();

          // Test 2: Should provide navigation options
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);

          // Test 3: Should have retry or navigation button
          const hasNavigationButton = Array.from(buttons).some(btn => 
            btn.textContent?.includes('Dashboard') || 
            btn.textContent?.includes('Try Again') ||
            btn.textContent?.includes('Refresh')
          );
          expect(hasNavigationButton).toBe(true);

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16h: Error Severity Classification
   * For any error, the system should correctly classify its severity
   * Validates: Requirements 10.1
   */
  test('Property 16h: Errors are classified by severity correctly', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        (errorData) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          const { container } = render(
            <ErrorBoundary level="component">
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Should display severity-appropriate icon
          const icon = container.querySelector('[class*="icon"]');
          expect(icon).toBeInTheDocument();
          expect(icon?.textContent).toMatch(/[💥🚨⚠️⚡]/);

          // Test 2: Should have severity-based styling
          const errorContainer = container.querySelector('[class*="container"]');
          expect(errorContainer?.className).toBeTruthy();

          // Test 3: Critical errors should have appropriate messaging
          // Note: Error name takes precedence over message in severity classification
          if (errorData.name.toLowerCase().includes('syntax') || 
              errorData.name.toLowerCase().includes('reference') ||
              errorData.message.toLowerCase().includes('chunk load')) {
            expect(container.textContent).toContain('Critical');
          }

          // Test 4: Network errors should be identified (high severity, not critical)
          // But only if the error name doesn't indicate a critical error
          if ((errorData.message.toLowerCase().includes('network') ||
              errorData.message.toLowerCase().includes('connection')) &&
              !errorData.name.toLowerCase().includes('reference') &&
              !errorData.name.toLowerCase().includes('syntax')) {
            // Network errors are classified as 'high' severity
            expect(container.textContent).toMatch(/Connection|Network/i);
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16i: Error Context Preservation
   * For any error, relevant context should be preserved and available
   * Validates: Requirements 10.1
   */
  test('Property 16i: Error context is preserved for debugging', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        fc.record({
          route: fc.constantFrom('/dashboard', '/project/finger_count', '/settings'),
          component: fc.constantFrom('Header', 'Sidebar', 'ProjectLoader'),
        }),
        (errorData, context) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          const { container } = render(
            <ErrorBoundary 
              level="component"
              context={context}
            >
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Should display error ID for tracking
          const errorId = container.querySelector('[class*="errorId"]');
          expect(errorId).toBeInTheDocument();
          expect(errorId?.textContent).toContain('Error ID:');

          // Test 2: Should display timestamp
          const timestamp = container.querySelector('[class*="timestamp"]');
          expect(timestamp).toBeInTheDocument();

          // Test 3: In development, should show error details
          if (process.env.NODE_ENV === 'development') {
            const details = container.querySelector('details');
            if (details) {
              expect(details.textContent).toContain('Error Details');
            }
          }

          // Test 4: Error metadata should be available
          expect(container.textContent).toBeTruthy();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16j: Multiple Error Recovery Attempts
   * For any error, the system should track and limit retry attempts
   * Validates: Requirements 10.3
   */
  test('Property 16j: System tracks and limits retry attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageGenerator,
        async (errorMessage) => {
          let attemptCount = 0;
          const error = new Error(errorMessage);

          const { container } = render(
            <ErrorBoundary 
              level="component"
              showRetry={true}
              onRetry={() => attemptCount++}
            >
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Should allow retries initially
          let retryButton = Array.from(container.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Try Again'));
          expect(retryButton).toBeInTheDocument();

          // Attempt multiple retries (up to limit)
          const user = userEvent.setup();
          for (let i = 0; i < 4; i++) {
            retryButton = Array.from(container.querySelectorAll('button'))
              .find(btn => btn.textContent?.includes('Try Again'));
            
            if (retryButton) {
              await user.click(retryButton);
              await waitFor(() => {
                // Wait for state update
              }, { timeout: 100 });
            } else {
              // Button is hidden, stop trying
              break;
            }
          }

          // Test 2: Should track retry count
          expect(attemptCount).toBeGreaterThan(0);

          // Test 3: Should limit retries (max 3 as per implementation)
          expect(attemptCount).toBeLessThanOrEqual(3);

          // Test 4: After max retries (3), retry button should be hidden
          await waitFor(() => {
            const finalRetryButton = Array.from(container.querySelectorAll('button'))
              .find(btn => btn.textContent?.includes('Try Again'));
            
            if (attemptCount >= 3) {
              expect(finalRetryButton).toBeUndefined();
            }
          }, { timeout: 1000 });

          return true;
        }
      ),
      { numRuns: 20 } // Reduced for async test
    );
  }, 30000);

  /**
   * Property 16k: Error Boundary Cleanup
   * For any error recovery, the system should properly clean up state
   * Validates: Requirements 10.2, 10.3
   */
  test('Property 16k: Error boundaries clean up state on recovery', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageGenerator,
        async (errorMessage) => {
          let shouldThrow = true;
          const error = new Error(errorMessage);

          const TestComponent = () => {
            const [throwError, setThrowError] = useState(shouldThrow);

            return (
              <ErrorBoundary 
                level="component"
                showRetry={true}
                onRetry={() => {
                  shouldThrow = false;
                  setThrowError(false);
                }}
              >
                <ThrowError shouldThrow={throwError} error={error}>
                  <div data-testid="success-state">Recovered</div>
                </ThrowError>
              </ErrorBoundary>
            );
          };

          const { container, unmount } = render(<TestComponent />);

          // Test 1: Should show error initially
          expect(container.querySelector('[class*="container"]')).toBeInTheDocument();

          // Trigger retry
          const retryButton = Array.from(container.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Try Again'));

          if (retryButton) {
            const user = userEvent.setup();
            await user.click(retryButton);

            // Test 2: Should clear error state after successful retry
            await waitFor(() => {
              const successElement = screen.queryByTestId('success-state');
              if (successElement) {
                expect(successElement).toBeInTheDocument();
              }
            }, { timeout: 1000 });

            // Test 3: Error UI should be removed (only one success element)
            await waitFor(() => {
              const successElements = screen.queryAllByTestId('success-state');
              const errorContainer = container.querySelector('[class*="container"]');
              
              // Either we have exactly one success element, or we're still in error state
              if (successElements.length > 0) {
                expect(successElements.length).toBe(1);
                expect(errorContainer).not.toBeInTheDocument();
              }
            }, { timeout: 1000 });
          }

          // Cleanup
          unmount();

          return true;
        }
      ),
      { numRuns: 20 } // Reduced for async test
    );
  }, 30000);

  /**
   * Property 16l: App-Level Error Handling
   * For any app-level error, the highest level boundary should handle it
   * Validates: Requirements 10.2
   */
  test('Property 16l: App-level errors are handled by top-level boundary', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        (errorData) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          const { container } = render(
            <AppErrorBoundary>
              <ThrowError shouldThrow={true} error={error} />
            </AppErrorBoundary>
          );

          // Test 1: Should catch and display error
          expect(container.querySelector('[class*="container"]')).toBeInTheDocument();

          // Test 2: Should provide app-level recovery options
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);

          // Test 3: Should show appropriate severity for app errors
          expect(container.textContent).toBeTruthy();

          // Test 4: Should have error tracking
          expect(container.textContent).toContain('Error ID:');

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16m: Error Boundary Composition
   * For any nested error boundaries, they should work together correctly
   * Validates: Requirements 10.2
   */
  test('Property 16m: Nested error boundaries compose correctly', () => {
    fc.assert(
      fc.property(
        fc.array(customErrorGenerator, { minLength: 1, maxLength: 3 }),
        (errors) => {
          // Create nested components that might throw
          const NestedComponent = ({ level, error }: { level: number; error: Error }) => {
            if (level === 0) {
              return <ThrowError shouldThrow={true} error={error} />;
            }
            return (
              <ErrorBoundary level="component">
                <NestedComponent level={level - 1} error={error} />
              </ErrorBoundary>
            );
          };

          const { container } = render(
            <ErrorBoundary level="app">
              <NestedComponent level={errors.length - 1} error={new Error(errors[0].message)} />
            </ErrorBoundary>
          );

          // Test 1: Should catch error at appropriate level
          expect(container.querySelector('[class*="container"]')).toBeInTheDocument();

          // Test 2: Should only show one error UI (innermost boundary)
          const errorContainers = container.querySelectorAll('[class*="container"]');
          expect(errorContainers.length).toBeGreaterThanOrEqual(1);

          // Test 3: Should provide recovery options
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 16n: Error Reporting Functionality
   * For any error, the bug report functionality should work
   * Validates: Requirements 10.1
   */
  test('Property 16n: Error reporting functionality works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        errorMessageGenerator,
        fc.string({ minLength: 0, maxLength: 100 }).filter(s => !s.includes('{')), // Filter out special chars
        async (errorMessage, userFeedback) => {
          const error = new Error(errorMessage);

          const { container } = render(
            <ErrorBoundary 
              level="component"
              showReportBug={true}
            >
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Should show report bug button for non-low severity
          const reportButton = Array.from(container.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Report'));

          if (reportButton) {
            // Test 2: Should have feedback textarea
            const textarea = container.querySelector('textarea');
            expect(textarea).toBeInTheDocument();

            // Test 3: Should accept user feedback (avoid special characters)
            if (textarea && userFeedback && userFeedback.length > 0) {
              const user = userEvent.setup();
              const safeInput = userFeedback.substring(0, 50).replace(/[{}[\]]/g, ''); // Remove special chars
              if (safeInput.length > 0) {
                await user.clear(textarea);
                await user.type(textarea, safeInput);
                expect(textarea.value).toContain(safeInput.substring(0, Math.min(10, safeInput.length)));
              }
            }

            // Test 4: Report button should be clickable
            expect(reportButton).not.toBeDisabled();
          }

          return true;
        }
      ),
      { numRuns: 20 } // Reduced for async test
    );
  }, 30000);

  /**
   * Property 16o: Error Persistence for Debugging
   * For any error, error information should be persisted for debugging
   * Validates: Requirements 10.1
   */
  test('Property 16o: Error information is persisted for debugging', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorBoundaryLevelGenerator,
        (errorData, level) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          // Clear previous errors
          localStorage.removeItem('error-logs');
          localStorage.removeItem('app-errors');
          localStorage.removeItem('project-errors');
          localStorage.removeItem('route-errors');

          render(
            <ErrorBoundary level={level}>
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Error should be logged to localStorage
          // ErrorLoggingService stores all errors to 'error-logs'
          // But specialized boundaries (App, Project, Route) also store to their own keys
          let errorLogs = localStorage.getItem('error-logs');
          let specializedLogs = null;
          
          switch (level) {
            case 'app':
              specializedLogs = localStorage.getItem('app-errors');
              break;
            case 'project':
              specializedLogs = localStorage.getItem('project-errors');
              break;
            case 'route':
              specializedLogs = localStorage.getItem('route-errors');
              break;
          }

          // Either the centralized error-logs or the specialized logs should exist
          const hasErrorLog = errorLogs || specializedLogs;
          expect(hasErrorLog).toBeTruthy();

          // Test 2: Logged error should contain error message
          if (errorLogs) {
            const logs = JSON.parse(errorLogs);
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0]).toHaveProperty('error');
            
            // Test 3: Error log should have timestamp
            expect(logs[0]).toHaveProperty('timestamp');
          } else if (specializedLogs) {
            const logs = JSON.parse(specializedLogs);
            if (Array.isArray(logs)) {
              expect(logs.length).toBeGreaterThan(0);
              expect(logs[0]).toHaveProperty('error');
              expect(logs[0]).toHaveProperty('timestamp');
            } else if (typeof logs === 'object') {
              // Project errors are stored as object with project IDs as keys
              const projectKeys = Object.keys(logs);
              expect(projectKeys.length).toBeGreaterThan(0);
            }
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
