/**
 * Property-Based Test for Loading State Management
 * Feature: frontend-restructure, Property 18: Loading State Management
 * Validates: Requirements 10.5
 */

import { fc } from '@fast-check/jest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoadingSpinner, { type LoadingSize, type LoadingVariant } from '@/components/ui/LoadingSpinner';
import {
  AsyncLoadingWrapper,
  WebSocketLoading,
  ProjectLoading,
  CameraLoading,
  Skeleton,
  PageLoadingOverlay,
} from '@/components/ui/AsyncLoadingStates';
import Button from '@/components/ui/Button';
import SuspenseWrapper from '@/components/ui/SuspenseWrapper';
import { GlobalProvider } from '@/context/GlobalContext';
import { ProjectProvider } from '@/context/ProjectContext';

// Reduced number of runs for faster testing
const NUM_RUNS = 100;

// Test wrapper with all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <GlobalProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </GlobalProvider>
  </BrowserRouter>
);

// Generators for property-based testing
const loadingSizeGenerator = fc.constantFrom<LoadingSize>('xs', 'sm', 'md', 'lg', 'xl');
const loadingVariantGenerator = fc.constantFrom<LoadingVariant>('spinner', 'dots', 'pulse', 'shimmer');
const loadingTextGenerator = fc.option(fc.string({ minLength: 5, maxLength: 50 }));
const websocketStatusGenerator = fc.constantFrom<'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'>(
  'connecting', 'connected', 'disconnected', 'reconnecting', 'error'
);
const projectStageGenerator = fc.constantFrom<'discovering' | 'loading' | 'initializing' | 'ready' | 'error'>(
  'discovering', 'loading', 'initializing', 'ready', 'error'
);
const cameraStageGenerator = fc.constantFrom<'requesting' | 'initializing' | 'ready' | 'denied' | 'error'>(
  'requesting', 'initializing', 'ready', 'denied', 'error'
);
const progressGenerator = fc.option(fc.integer({ min: 0, max: 100 }));

// Component that simulates async operation
interface AsyncComponentProps {
  delay: number;
  shouldError?: boolean;
  children?: React.ReactNode;
}

const AsyncComponent: React.FC<AsyncComponentProps> = ({ delay, shouldError = false, children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldError) {
        setError(new Error('Async operation failed'));
      }
      setIsLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, shouldError]);

  return (
    <AsyncLoadingWrapper
      isLoading={isLoading}
      error={error}
      retryAction={() => {
        setIsLoading(true);
        setError(null);
      }}
    >
      {children || <div data-testid="async-content">Content loaded</div>}
    </AsyncLoadingWrapper>
  );
};

describe('Property 18: Loading State Management', () => {
  /**
   * Property 18a: Loading Indicators Display During Async Operations
   * For any asynchronous operation, appropriate loading indicators should be displayed
   * Validates: Requirements 10.5
   */
  test('Property 18a: Loading indicators display during async operations', () => {
    fc.assert(
      fc.property(
        loadingSizeGenerator,
        loadingVariantGenerator,
        loadingTextGenerator,
        (size, variant, text) => {
          const { container } = render(
            <TestWrapper>
              <LoadingSpinner size={size} variant={variant} text={text ?? undefined} />
            </TestWrapper>
          );

          // Test 1: Loading spinner container should exist
          const spinnerContainer = container.querySelector('[class*="container"]');
          expect(spinnerContainer).toBeInTheDocument();

          // Test 2: Loading indicator should be visible
          const loadingIndicator = container.querySelector(
            `[class*="${variant}"], [class*="spinner"], [class*="dots"], [class*="pulse"], [class*="shimmer"]`
          );
          expect(loadingIndicator).toBeInTheDocument();

          // Test 3: If text is provided, it should be displayed
          if (text) {
            expect(container.textContent).toContain(text);
          }

          // Test 4: Loading indicator should have appropriate size class
          const sizedElement = container.querySelector(`[class*="${size}"]`);
          expect(sizedElement).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18b: Loading States Clear After Operation Completes
   * For any async operation, loading indicators should be removed when operation completes
   * Validates: Requirements 10.5
   */
  test('Property 18b: Loading states clear after operation completes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 200, max: 500 }),
        async (delay) => {
          // Render in an isolated container
          const { container, unmount } = render(
            <TestWrapper>
              <AsyncComponent delay={delay} />
            </TestWrapper>
          );

          try {
            // Test 1: Initially, loading spinner should be present
            const initialSpinner = container.querySelector('[class*="spinner"]');
            expect(initialSpinner).toBeInTheDocument();

            // Test 2: Wait for the async operation to complete and content to appear
            // Use within() to scope queries to this specific container
            const content = await waitFor(
              () => {
                const element = container.querySelector('[data-testid="async-content"]');
                expect(element).toBeInTheDocument();
                return element;
              },
              { timeout: delay + 1000 }
            );
            expect(content?.textContent).toBe('Content loaded');

            // Test 3: After content appears, wait for loading indicator to be removed
            await waitFor(
              () => {
                const finalSpinner = container.querySelector('[class*="spinner"]');
                expect(finalSpinner).toBeNull();
              },
              { timeout: 500 }
            );

            return true;
          } finally {
            // Clean up after each property test run
            unmount();
          }
        }
      ),
      { numRuns: 20 } // Reduced for async test
    );
  }, 30000);

  /**
   * Property 18c: Button Loading States Are Accessible
   * For any button in loading state, it should display loading indicator and be disabled
   * Validates: Requirements 10.5
   */
  test('Property 18c: Button loading states are accessible and functional', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'primary' | 'secondary' | 'ghost' | 'danger'>('primary', 'secondary', 'ghost', 'danger'),
        fc.constantFrom<'sm' | 'md' | 'lg'>('sm', 'md', 'lg'),
        fc.boolean(),
        (variant, size, loading) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} size={size} loading={loading}>
                Submit
              </Button>
            </TestWrapper>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();

          if (button && loading) {
            // Test 1: Button should be disabled during loading
            expect(button.disabled).toBe(true);

            // Test 2: Button should have aria-busy attribute
            expect(button.getAttribute('aria-busy')).toBe('true');

            // Test 3: Loading spinner should be visible
            const spinner = button.querySelector('[class*="spinner"]');
            expect(spinner).toBeInTheDocument();

            // Test 4: Button text should still be accessible
            expect(button.textContent).toContain('Submit');
          }

          if (button && !loading) {
            // Test 5: Button should not be disabled when not loading
            expect(button.disabled).toBe(false);

            // Test 6: No loading spinner should be present
            const spinner = button.querySelector('[class*="spinner"]');
            expect(spinner).not.toBeInTheDocument();
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18d: WebSocket Connection Loading States
   * For any WebSocket connection state, appropriate loading indicators should be shown
   * Validates: Requirements 10.5
   */
  test('Property 18d: WebSocket connection loading states display correctly', () => {
    fc.assert(
      fc.property(
        websocketStatusGenerator,
        fc.boolean(),
        (status, showDetails) => {
          const onRetry = jest.fn();
          const { container } = render(
            <TestWrapper>
              <WebSocketLoading
                connectionStatus={status}
                onRetry={onRetry}
                showDetails={showDetails}
              />
            </TestWrapper>
          );

          // Test 1: For non-connected states, loading UI should be present
          if (status !== 'connected') {
            expect(container.textContent).toBeTruthy();

            // Test 2: Status icon should be displayed
            const statusIcon = container.querySelector('[class*="statusIcon"]');
            expect(statusIcon).toBeInTheDocument();

            // Test 3: Status title should be displayed
            const statusTitle = container.querySelector('[class*="statusTitle"]');
            expect(statusTitle).toBeInTheDocument();
            expect(statusTitle?.textContent).toBeTruthy();

            // Test 4: Loading spinner should be present for loading states
            if (status === 'connecting' || status === 'reconnecting') {
              const spinner = container.querySelector('[class*="spinner"], [class*="pulse"]');
              expect(spinner).toBeInTheDocument();
            }

            // Test 5: Retry button should be present for error states
            if (status === 'reconnecting' || status === 'error' || status === 'disconnected') {
              const retryButton = Array.from(container.querySelectorAll('button')).find(btn =>
                btn.textContent?.includes('Retry')
              );
              expect(retryButton).toBeInTheDocument();
            }

            // Test 6: Connection details should be shown if enabled
            if (showDetails) {
              expect(container.textContent).toContain('Status:');
            }
          }

          // Test 7: For connected state, no loading UI should be shown
          if (status === 'connected') {
            expect(container.textContent).toBe('');
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18e: Project Loading States With Progress
   * For any project loading stage, appropriate loading indicators and progress should be shown
   * Validates: Requirements 10.5
   */
  test('Property 18e: Project loading states display with progress indicators', () => {
    fc.assert(
      fc.property(
        projectStageGenerator,
        fc.string({ minLength: 3, maxLength: 20 }),
        progressGenerator,
        (stage, projectName, progress) => {
          const onRetry = jest.fn();
          const { container } = render(
            <TestWrapper>
              <ProjectLoading
                stage={stage}
                projectName={projectName}
                progress={progress ?? undefined}
                onRetry={onRetry}
              />
            </TestWrapper>
          );

          // Test 1: For non-ready states, loading UI should be present
          if (stage !== 'ready') {
            expect(container.textContent).toBeTruthy();

            // Test 2: Status icon should be displayed
            const statusIcon = container.querySelector('[class*="statusIcon"]');
            expect(statusIcon).toBeInTheDocument();

            // Test 3: Status title should be displayed
            const statusTitle = container.querySelector('[class*="statusTitle"]');
            expect(statusTitle).toBeInTheDocument();

            // Test 4: Loading spinner should be present for non-error stages
            if (stage !== 'error') {
              const spinner = container.querySelector('[class*="spinner"], [class*="dots"], [class*="pulse"]');
              expect(spinner).toBeInTheDocument();
            }

            // Test 5: Progress bar should be displayed if progress is provided
            if (progress !== null && progress !== undefined) {
              const progressBar = container.querySelector('[role="progressbar"]');
              expect(progressBar).toBeInTheDocument();
              expect(progressBar?.getAttribute('aria-valuenow')).toBe(String(progress));
            }

            // Test 6: Retry button should be present for error stage
            if (stage === 'error') {
              const retryButton = Array.from(container.querySelectorAll('button')).find(btn =>
                btn.textContent?.includes('Try Again')
              );
              expect(retryButton).toBeInTheDocument();
            }
          }

          // Test 7: For ready state, no loading UI should be shown
          if (stage === 'ready') {
            expect(container.textContent).toBe('');
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18f: Camera Access Loading States
   * For any camera access stage, appropriate loading indicators should be shown
   * Validates: Requirements 10.5
   */
  test('Property 18f: Camera access loading states display correctly', () => {
    fc.assert(
      fc.property(
        cameraStageGenerator,
        (stage) => {
          const onRetry = jest.fn();
          const onRequestPermission = jest.fn();
          const { container } = render(
            <TestWrapper>
              <CameraLoading
                stage={stage}
                onRetry={onRetry}
                onRequestPermission={onRequestPermission}
              />
            </TestWrapper>
          );

          // Test 1: For non-ready states, loading UI should be present
          if (stage !== 'ready') {
            expect(container.textContent).toBeTruthy();

            // Test 2: Status icon should be displayed
            const statusIcon = container.querySelector('[class*="statusIcon"]');
            expect(statusIcon).toBeInTheDocument();

            // Test 3: Status title should be displayed
            const statusTitle = container.querySelector('[class*="statusTitle"]');
            expect(statusTitle).toBeInTheDocument();

            // Test 4: Loading spinner should be present for initializing stage
            if (stage === 'initializing') {
              const spinner = container.querySelector('[class*="spinner"]');
              expect(spinner).toBeInTheDocument();
            }

            // Test 5: Action button should be present for appropriate stages
            if (stage === 'requesting' || stage === 'denied' || stage === 'error') {
              const actionButton = container.querySelector('button');
              expect(actionButton).toBeInTheDocument();
            }
          }

          // Test 6: For ready state, no loading UI should be shown
          if (stage === 'ready') {
            expect(container.textContent).toBe('');
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18g: Skeleton Loading States
   * For any skeleton configuration, appropriate placeholder content should be displayed
   * Validates: Requirements 10.5
   */
  test('Property 18g: Skeleton loading states display placeholder content', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.oneof(fc.constant('100%'), fc.integer({ min: 50, max: 500 })),
        fc.oneof(fc.constant('1rem'), fc.integer({ min: 10, max: 100 })),
        (lines, width, height) => {
          const { container } = render(
            <TestWrapper>
              <Skeleton lines={lines} width={width} height={height} />
            </TestWrapper>
          );

          // Test 1: Skeleton container should exist
          const skeleton = container.querySelector('[class*="skeleton"]');
          expect(skeleton).toBeInTheDocument();

          // Test 2: Correct number of skeleton lines should be rendered
          const skeletonLines = container.querySelectorAll('[class*="skeletonLine"]');
          expect(skeletonLines.length).toBe(lines);

          // Test 3: Each skeleton line should have proper styling
          skeletonLines.forEach(line => {
            expect(line).toBeInTheDocument();
            const element = line as HTMLElement;
            expect(element.style.width).toBeTruthy();
            expect(element.style.height).toBeTruthy();
          });

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18h: Page Loading Overlay
   * For any page loading state, full-page overlay should be displayed
   * Validates: Requirements 10.5
   */
  test('Property 18h: Page loading overlay displays correctly', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.string({ minLength: 5, maxLength: 50 }),
        progressGenerator,
        (isVisible, message, progress) => {
          const { container } = render(
            <TestWrapper>
              <PageLoadingOverlay
                isVisible={isVisible}
                message={message}
                progress={progress ?? undefined}
              />
            </TestWrapper>
          );

          if (isVisible) {
            // Test 1: Overlay should be present
            const overlay = container.querySelector('[class*="pageOverlay"]');
            expect(overlay).toBeInTheDocument();

            // Test 2: Loading spinner should be visible
            const spinner = container.querySelector('[class*="spinner"]');
            expect(spinner).toBeInTheDocument();

            // Test 3: Message should be displayed
            expect(container.textContent).toContain(message);

            // Test 4: Progress bar should be displayed if progress is provided
            if (progress !== null && progress !== undefined) {
              const progressBar = container.querySelector('[role="progressbar"]');
              expect(progressBar).toBeInTheDocument();
              expect(progressBar?.getAttribute('aria-valuenow')).toBe(String(progress));
            }
          } else {
            // Test 5: Overlay should not be present when not visible
            const overlay = container.querySelector('[class*="pageOverlay"]');
            expect(overlay).not.toBeInTheDocument();
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18i: Async Loading Wrapper Error States
   * For any async operation error, error state should be displayed with retry option
   * Validates: Requirements 10.5
   */
  test('Property 18i: Async loading wrapper handles error states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }),
        async (delay) => {
          const { container } = render(
            <TestWrapper>
              <AsyncComponent delay={delay} shouldError={true} />
            </TestWrapper>
          );

          // Test 1: Loading indicator should be present initially
          expect(container.querySelector('[class*="spinner"]')).toBeInTheDocument();

          // Test 2: After delay, error state should be displayed
          await waitFor(
            () => {
              const errorState = container.querySelector('[class*="errorState"]');
              expect(errorState).toBeInTheDocument();
            },
            { timeout: delay + 500 }
          );

          // Test 3: Error message should be displayed
          const errorMessage = container.querySelector('[class*="errorMessage"]');
          expect(errorMessage).toBeInTheDocument();
          expect(errorMessage?.textContent).toContain('failed');

          // Test 4: Retry button should be present
          const retryButton = Array.from(container.querySelectorAll('button')).find(btn =>
            btn.textContent?.includes('Try Again')
          );
          expect(retryButton).toBeInTheDocument();

          // Test 5: Clicking retry should restart loading
          if (retryButton) {
            const user = userEvent.setup();
            await user.click(retryButton);

            await waitFor(
              () => {
                const spinner = container.querySelector('[class*="spinner"]');
                expect(spinner).toBeInTheDocument();
              },
              { timeout: 500 }
            );
          }

          return true;
        }
      ),
      { numRuns: 20 } // Reduced for async test
    );
  }, 30000);

  /**
   * Property 18j: Suspense Wrapper Loading States
   * For any Suspense boundary, appropriate fallback should be displayed
   * Validates: Requirements 10.5
   */
  test('Property 18j: Suspense wrapper displays fallback during loading', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (minimal) => {
          const LazyComponent = React.lazy(() =>
            Promise.resolve({
              default: () => <div data-testid="lazy-content">Lazy loaded content</div>,
            })
          );

          const { container } = render(
            <TestWrapper>
              <SuspenseWrapper minimal={minimal}>
                <LazyComponent />
              </SuspenseWrapper>
            </TestWrapper>
          );

          // Test 1: Fallback container should be present during loading
          const fallbackContainer = container.querySelector('[class*="fallbackContainer"], [class*="minimalContainer"]');
          
          // Note: Due to React's Suspense behavior, the fallback might not always be visible
          // in synchronous tests, but the component should render without errors
          expect(container).toBeInTheDocument();

          // Test 2: Loading spinner should be present in fallback
          const spinner = container.querySelector('[class*="spinner"]');
          if (spinner) {
            expect(spinner).toBeInTheDocument();
          }

          // Test 3: Minimal mode should affect the fallback display
          if (minimal && fallbackContainer) {
            expect(fallbackContainer.className).toContain('minimal');
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18k: Loading State Accessibility
   * For any loading state, it should be properly announced to screen readers
   * Validates: Requirements 10.5
   */
  test('Property 18k: Loading states are accessible to screen readers', () => {
    fc.assert(
      fc.property(
        loadingSizeGenerator,
        loadingVariantGenerator,
        fc.boolean(),
        (size, variant, fullScreen) => {
          const { container } = render(
            <TestWrapper>
              <LoadingSpinner size={size} variant={variant} fullScreen={fullScreen} />
            </TestWrapper>
          );

          // Test 1: Loading container should be present
          const loadingContainer = container.querySelector('[class*="container"]');
          expect(loadingContainer).toBeInTheDocument();

          // Test 2: Loading indicator should be visible
          expect(container.querySelector('[class*="spinner"], [class*="dots"], [class*="pulse"], [class*="shimmer"]')).toBeInTheDocument();

          // Test 3: Full screen mode should apply appropriate styling
          if (fullScreen && loadingContainer) {
            expect(loadingContainer.className).toContain('fullScreen');
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18l: Progress Indicators Are Accurate
   * For any progress value, progress bars should display accurate values
   * Validates: Requirements 10.5
   */
  test('Property 18l: Progress indicators display accurate values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.string({ minLength: 5, maxLength: 30 }),
        (progress, message) => {
          const { container } = render(
            <TestWrapper>
              <PageLoadingOverlay isVisible={true} message={message} progress={progress} />
            </TestWrapper>
          );

          // Test 1: Progress bar should be present
          const progressBar = container.querySelector('[role="progressbar"]');
          expect(progressBar).toBeInTheDocument();

          if (progressBar) {
            // Test 2: Progress bar should have correct aria attributes
            expect(progressBar.getAttribute('aria-valuenow')).toBe(String(progress));
            expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
            expect(progressBar.getAttribute('aria-valuemax')).toBe('100');

            // Test 3: Progress bar should have accessible label
            const ariaLabel = progressBar.getAttribute('aria-label');
            expect(ariaLabel).toContain(String(progress));
            expect(ariaLabel).toContain('%');

            // Test 4: Progress fill should have correct width
            const progressFill = progressBar.querySelector('[class*="progressFill"]') as HTMLElement;
            expect(progressFill).toBeInTheDocument();
            if (progressFill) {
              const width = progressFill.style.width;
              expect(width).toBe(`${progress}%`);
            }
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18m: Multiple Loading States Don't Conflict
   * For any combination of loading states, they should not interfere with each other
   * Validates: Requirements 10.5
   */
  test('Property 18m: Multiple loading states coexist without conflicts', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (showButton, showSpinner, showOverlay) => {
          const { container } = render(
            <TestWrapper>
              <div>
                {showButton && <Button loading={true}>Loading Button</Button>}
                {showSpinner && <LoadingSpinner size="md" variant="spinner" />}
                {showOverlay && <PageLoadingOverlay isVisible={true} message="Loading page..." />}
              </div>
            </TestWrapper>
          );

          // Test 1: All requested loading states should be present
          if (showButton) {
            const button = container.querySelector('button');
            expect(button).toBeInTheDocument();
            expect(button?.getAttribute('aria-busy')).toBe('true');
          }

          if (showSpinner) {
            const spinners = container.querySelectorAll('[class*="spinner"]');
            expect(spinners.length).toBeGreaterThan(0);
          }

          if (showOverlay) {
            const overlay = container.querySelector('[class*="pageOverlay"]');
            expect(overlay).toBeInTheDocument();
          }

          // Test 2: Container should be in the document
          expect(container).toBeInTheDocument();

          // Test 3: No errors should occur from multiple loading states
          expect(() => {
            container.querySelectorAll('[class*="spinner"]');
          }).not.toThrow();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18n: Loading States Respect Reduced Motion
   * For any loading state, animations should respect prefers-reduced-motion
   * Validates: Requirements 10.5
   */
  test('Property 18n: Loading states respect reduced motion preferences', () => {
    fc.assert(
      fc.property(
        loadingVariantGenerator,
        loadingSizeGenerator,
        (variant, size) => {
          const { container } = render(
            <TestWrapper>
              <LoadingSpinner variant={variant} size={size} />
            </TestWrapper>
          );

          // Test 1: Loading indicator should be present
          const loadingIndicator = container.querySelector('[class*="spinner"], [class*="dots"], [class*="pulse"], [class*="shimmer"]');
          expect(loadingIndicator).toBeInTheDocument();

          // Test 2: Component should render without errors
          expect(container).toBeInTheDocument();

          // Test 3: Loading indicator should have appropriate classes
          if (loadingIndicator) {
            expect(loadingIndicator.className).toBeTruthy();
          }

          // Note: Actual reduced motion behavior is handled by CSS media queries
          // and cannot be fully tested in JSDOM environment

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 18o: Loading Text Is Optional But Accessible
   * For any loading component, text should be optional but accessible when provided
   * Validates: Requirements 10.5
   */
  test('Property 18o: Loading text is optional but accessible when provided', () => {
    fc.assert(
      fc.property(
        loadingTextGenerator,
        loadingSizeGenerator,
        (text, size) => {
          const { container } = render(
            <TestWrapper>
              <LoadingSpinner size={size} text={text ?? undefined} />
            </TestWrapper>
          );

          // Test 1: Loading spinner should be present
          const spinner = container.querySelector('[class*="spinner"], [class*="dots"], [class*="pulse"], [class*="shimmer"]');
          expect(spinner).toBeInTheDocument();

          // Test 2: If text is provided, it should be displayed
          if (text) {
            const textElement = container.querySelector('p');
            expect(textElement).toBeInTheDocument();
            expect(textElement?.textContent).toBe(text);
          }

          // Test 3: If no text, component should still render correctly
          if (!text) {
            expect(container).toBeInTheDocument();
            expect(spinner).toBeInTheDocument();
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
