/**
 * Property-Based Test for Connection Status Feedback
 * Feature: frontend-restructure, Property 12: Connection Status Feedback
 * Validates: Requirements 6.2, 6.4
 */

import { fc } from '@fast-check/jest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConnectionStatus } from '@/components/ConnectionStatus/ConnectionStatus';
import type { ConnectionStatus as ConnectionStatusType, ConnectionQuality } from '@/types/websocket';

// Reduced number of runs for faster testing
const NUM_RUNS = 50;

// Generators for property-based testing

// Generator for connection quality status
const qualityStatusGenerator = fc.constantFrom<ConnectionQuality['status']>(
  'excellent',
  'good',
  'poor',
  'unknown'
);

// Generator for connection quality
const connectionQualityGenerator = fc.record({
  status: qualityStatusGenerator,
  score: fc.integer({ min: 0, max: 100 }),
  factors: fc.record({
    latency: fc.integer({ min: 0, max: 1000 }),
    stability: fc.integer({ min: 0, max: 100 }),
    throughput: fc.integer({ min: 0, max: 100 }),
  }),
});

// Generator for connection status
const connectionStatusGenerator = fc.record({
  connected: fc.boolean(),
  reconnecting: fc.boolean(),
  error: fc.option(fc.string(), { nil: undefined }),
  quality: connectionQualityGenerator,
  latency: fc.integer({ min: 0, max: 1000 }),
  uptime: fc.integer({ min: 0, max: 3600000 }), // Up to 1 hour
});

// Generator for connection state transitions
const connectionStateTransitionGenerator = fc.array(
  connectionStatusGenerator,
  { minLength: 2, maxLength: 5 }
);

describe('Property 12: Connection Status Feedback', () => {
  /**
   * Property 12a: Status Indicator Display
   * For any connection state, the system should display appropriate status indicators
   * Validates: Requirements 6.2
   */
  test('Property 12a: Appropriate status indicators are displayed for any connection state', () => {
    fc.assert(
      fc.property(
        connectionStatusGenerator,
        (status) => {
          const mockReconnect = jest.fn();
          const { container } = render(
            <ConnectionStatus status={status} onReconnect={mockReconnect} />
          );

          // Test 1: Status indicator should be present
          const indicator = container.querySelector('[class*="indicator"]');
          expect(indicator).toBeInTheDocument();

          // Test 2: Status text should be displayed
          const statusText = container.querySelector('[class*="text"]');
          expect(statusText).toBeInTheDocument();
          expect(statusText?.textContent).toBeTruthy();

          // Test 3: Status dot should be present
          const dot = container.querySelector('[class*="dot"]');
          expect(dot).toBeInTheDocument();

          // Test 4: Status should reflect connection state
          if (status.connected) {
            expect(statusText?.textContent).toContain('Connected');
          } else if (status.reconnecting) {
            expect(statusText?.textContent).toContain('Reconnecting');
          } else if (status.error) {
            expect(statusText?.textContent).toContain('Error');
          } else {
            expect(statusText?.textContent).toContain('Disconnected');
          }

          // Test 5: Quality indicator should be shown when connected
          const qualityIndicator = container.querySelector('[class*="qualityIndicator"]');
          if (status.connected) {
            expect(qualityIndicator).toBeInTheDocument();
          }

          // Test 6: Reconnect button should be shown when disconnected and not reconnecting
          const reconnectButton = container.querySelector('[class*="reconnectButton"]');
          if (!status.connected && !status.reconnecting) {
            expect(reconnectButton).toBeInTheDocument();
          } else {
            expect(reconnectButton).not.toBeInTheDocument();
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12b: Quality Metrics Display
   * For any connection state with quality metrics, the system should display them correctly
   * Validates: Requirements 6.4
   */
  test('Property 12b: Quality metrics are displayed correctly when available', () => {
    fc.assert(
      fc.property(
        connectionStatusGenerator,
        (status) => {
          const mockReconnect = jest.fn();
          const { container, unmount } = render(
            <ConnectionStatus 
              status={status} 
              onReconnect={mockReconnect} 
              showDetails={true}
            />
          );

          // Test 1: Quality score should be displayed when connected
          if (status.connected) {
            const qualityScore = container.querySelector('[class*="qualityScore"]');
            expect(qualityScore).toBeInTheDocument();
            expect(qualityScore?.textContent).toBe(status.quality.score.toString());
          }

          // Test 2: Quality status should have appropriate styling
          if (status.connected) {
            const qualityIndicator = container.querySelector('[class*="qualityIndicator"]');
            expect(qualityIndicator).toBeInTheDocument();
            
            // Check that quality class is applied
            const classList = qualityIndicator?.className || '';
            const hasQualityClass = 
              classList.includes('qualityExcellent') ||
              classList.includes('qualityGood') ||
              classList.includes('qualityPoor') ||
              classList.includes('qualityUnknown');
            expect(hasQualityClass).toBe(true);
          }

          // Test 3: Detailed metrics should be shown when showDetails is true and connected
          if (status.connected) {
            const details = container.querySelector('[class*="details"]');
            expect(details).toBeInTheDocument();

            // Test 4: Quality metric should be displayed
            const labels = container.querySelectorAll('[class*="metricLabel"]');
            const qualityLabel = Array.from(labels).find(el => el.textContent?.includes('Quality:'));
            expect(qualityLabel).toBeInTheDocument();
            
            const metricValues = container.querySelectorAll('[class*="metricValue"]');
            const qualityValue = Array.from(metricValues).find(el => 
              el.textContent === status.quality.status
            );
            expect(qualityValue).toBeInTheDocument();

            // Test 5: Latency metric should be displayed
            const latencyLabel = Array.from(labels).find(el => el.textContent?.includes('Latency:'));
            expect(latencyLabel).toBeInTheDocument();

            // Test 6: Uptime metric should be displayed
            const uptimeLabel = Array.from(labels).find(el => el.textContent?.includes('Uptime:'));
            expect(uptimeLabel).toBeInTheDocument();
          }

          unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12c: Quality Status Mapping
   * For any quality score, the status should be mapped correctly
   * Validates: Requirements 6.4
   */
  test('Property 12c: Quality status is correctly mapped to visual indicators', () => {
    fc.assert(
      fc.property(
        qualityStatusGenerator,
        fc.integer({ min: 0, max: 100 }),
        (qualityStatus, score) => {
          const status: ConnectionStatusType = {
            connected: true,
            reconnecting: false,
            quality: {
              status: qualityStatus,
              score: score,
              factors: {
                latency: 50,
                stability: 80,
                throughput: 90,
              },
            },
            latency: 50,
            uptime: 10000,
          };

          const mockReconnect = jest.fn();
          const { container } = render(
            <ConnectionStatus status={status} onReconnect={mockReconnect} />
          );

          // Test 1: Quality indicator should reflect the quality status
          const qualityIndicator = container.querySelector('[class*="qualityIndicator"]');
          expect(qualityIndicator).toBeInTheDocument();

          const classList = qualityIndicator?.className || '';

          // Test 2: Correct quality class should be applied
          switch (qualityStatus) {
            case 'excellent':
              expect(classList).toContain('qualityExcellent');
              break;
            case 'good':
              expect(classList).toContain('qualityGood');
              break;
            case 'poor':
              expect(classList).toContain('qualityPoor');
              break;
            case 'unknown':
              expect(classList).toContain('qualityUnknown');
              break;
          }

          // Test 3: Quality score should be displayed
          const qualityScore = container.querySelector('[class*="qualityScore"]');
          expect(qualityScore?.textContent).toBe(score.toString());

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12d: Connection State Transitions
   * For any sequence of connection state changes, indicators should update correctly
   * Validates: Requirements 6.2
   */
  test('Property 12d: Status indicators update correctly through state transitions', () => {
    fc.assert(
      fc.property(
        connectionStateTransitionGenerator,
        (statusSequence) => {
          const mockReconnect = jest.fn();
          const { container, rerender } = render(
            <ConnectionStatus status={statusSequence[0]} onReconnect={mockReconnect} />
          );

          // Test each state transition
          for (let i = 1; i < statusSequence.length; i++) {
            const previousStatus = statusSequence[i - 1];
            const currentStatus = statusSequence[i];

            rerender(
              <ConnectionStatus status={currentStatus} onReconnect={mockReconnect} />
            );

            // Test 1: Status text should update
            const statusText = container.querySelector('[class*="text"]');
            expect(statusText).toBeInTheDocument();

            // Test 2: Status should reflect current state
            if (currentStatus.connected) {
              expect(statusText?.textContent).toContain('Connected');
            } else if (currentStatus.reconnecting) {
              expect(statusText?.textContent).toContain('Reconnecting');
            } else if (currentStatus.error) {
              expect(statusText?.textContent).toContain('Error');
            } else {
              expect(statusText?.textContent).toContain('Disconnected');
            }

            // Test 3: Quality indicator visibility should match connection state
            const qualityIndicator = container.querySelector('[class*="qualityIndicator"]');
            if (currentStatus.connected) {
              expect(qualityIndicator).toBeInTheDocument();
            } else {
              expect(qualityIndicator).not.toBeInTheDocument();
            }

            // Test 4: Reconnect button visibility should match state
            const reconnectButton = container.querySelector('[class*="reconnectButton"]');
            if (!currentStatus.connected && !currentStatus.reconnecting) {
              expect(reconnectButton).toBeInTheDocument();
            } else {
              expect(reconnectButton).not.toBeInTheDocument();
            }
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12e: Latency Display Formatting
   * For any latency value, it should be formatted and displayed correctly
   * Validates: Requirements 6.4
   */
  test('Property 12e: Latency values are formatted and displayed correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }),
        (latency) => {
          const status: ConnectionStatusType = {
            connected: true,
            reconnecting: false,
            quality: {
              status: 'good',
              score: 75,
              factors: {
                latency: latency,
                stability: 80,
                throughput: 90,
              },
            },
            latency: latency,
            uptime: 10000,
          };

          const mockReconnect = jest.fn();
          const { container, unmount } = render(
            <ConnectionStatus 
              status={status} 
              onReconnect={mockReconnect} 
              showDetails={true}
            />
          );

          // Test 1: Latency label should be present
          const labels = container.querySelectorAll('[class*="metricLabel"]');
          const latencyLabel = Array.from(labels).find(el => el.textContent?.includes('Latency:'));
          expect(latencyLabel).toBeInTheDocument();

          // Test 2: Latency value should be displayed
          const metricValues = container.querySelectorAll('[class*="metricValue"]');
          const latencyValue = Array.from(metricValues).find(el => 
            el.textContent?.includes('ms') || el.textContent === 'N/A'
          );
          
          if (latency === 0) {
            expect(latencyValue?.textContent).toBe('N/A');
          } else {
            expect(latencyValue?.textContent).toBe(`${latency}ms`);
          }

          unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12f: Uptime Display Formatting
   * For any uptime value, it should be formatted and displayed correctly
   * Validates: Requirements 6.4
   */
  test('Property 12f: Uptime values are formatted and displayed correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7200000 }), // Up to 2 hours
        (uptime) => {
          const status: ConnectionStatusType = {
            connected: true,
            reconnecting: false,
            quality: {
              status: 'good',
              score: 75,
              factors: {
                latency: 50,
                stability: 80,
                throughput: 90,
              },
            },
            latency: 50,
            uptime: uptime,
          };

          const mockReconnect = jest.fn();
          const { container, unmount } = render(
            <ConnectionStatus 
              status={status} 
              onReconnect={mockReconnect} 
              showDetails={true}
            />
          );

          // Test 1: Uptime label should be present
          const labels = container.querySelectorAll('[class*="metricLabel"]');
          const uptimeLabel = Array.from(labels).find(el => el.textContent?.includes('Uptime:'));
          expect(uptimeLabel).toBeInTheDocument();

          // Test 2: Uptime value should be formatted correctly
          const metricValues = container.querySelectorAll('[class*="metricValue"]');
          expect(metricValues.length).toBeGreaterThan(0);

          // Test 3: Uptime format should be appropriate for the duration
          const seconds = Math.floor(uptime / 1000);
          let expectedFormat: string;
          
          if (uptime < 1000) {
            expectedFormat = '< 1s';
          } else if (seconds < 60) {
            expectedFormat = `${seconds}s`;
          } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            expectedFormat = `${minutes}m ${remainingSeconds}s`;
          } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            expectedFormat = `${hours}h ${minutes}m`;
          }

          const uptimeValue = Array.from(metricValues).find(el => 
            el.textContent === expectedFormat
          );
          expect(uptimeValue).toBeInTheDocument();

          unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12g: Error Message Display
   * For any error state, the error message should be displayed correctly
   * Validates: Requirements 6.2
   */
  test('Property 12g: Error messages are displayed correctly when present', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage) => {
          const status: ConnectionStatusType = {
            connected: false,
            reconnecting: false,
            error: errorMessage,
            quality: {
              status: 'unknown',
              score: 0,
              factors: {
                latency: 0,
                stability: 0,
                throughput: 0,
              },
            },
            latency: 0,
            uptime: 0,
          };

          const mockReconnect = jest.fn();
          const { container } = render(
            <ConnectionStatus status={status} onReconnect={mockReconnect} />
          );

          // Test 1: Error message should be displayed in status text
          const statusText = container.querySelector('[class*="text"]');
          expect(statusText).toBeInTheDocument();
          expect(statusText?.textContent).toContain('Error');
          expect(statusText?.textContent).toContain(errorMessage);

          // Test 2: Error styling should be applied
          const indicator = container.querySelector('[class*="indicator"]');
          expect(indicator?.className).toContain('error');

          // Test 3: Reconnect button should be available
          const reconnectButton = container.querySelector('[class*="reconnectButton"]');
          expect(reconnectButton).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12h: Quality Factors Consistency
   * For any connection quality, the factors should be consistent with the overall score
   * Validates: Requirements 6.4
   */
  test('Property 12h: Quality factors are displayed consistently with overall quality', () => {
    fc.assert(
      fc.property(
        connectionQualityGenerator,
        (quality) => {
          const status: ConnectionStatusType = {
            connected: true,
            reconnecting: false,
            quality: quality,
            latency: quality.factors.latency,
            uptime: 10000,
          };

          const mockReconnect = jest.fn();
          const { container, unmount } = render(
            <ConnectionStatus 
              status={status} 
              onReconnect={mockReconnect} 
              showDetails={true}
            />
          );

          // Test 1: Quality status should be displayed
          const metricValues = container.querySelectorAll('[class*="metricValue"]');
          const qualityValue = Array.from(metricValues).find(el => 
            el.textContent === quality.status
          );
          expect(qualityValue).toBeInTheDocument();

          // Test 2: Quality score should match
          const qualityScore = container.querySelector('[class*="qualityScore"]');
          expect(qualityScore?.textContent).toBe(quality.score.toString());

          // Test 3: Latency should match quality factors
          const latencyValue = Array.from(metricValues).find(el => 
            el.textContent === `${quality.factors.latency}ms` || 
            (quality.factors.latency === 0 && el.textContent === 'N/A')
          );
          expect(latencyValue).toBeInTheDocument();

          // Test 4: Quality indicator styling should match status
          const qualityIndicator = container.querySelector('[class*="qualityIndicator"]');
          const classList = qualityIndicator?.className || '';
          
          switch (quality.status) {
            case 'excellent':
              expect(classList).toContain('qualityExcellent');
              break;
            case 'good':
              expect(classList).toContain('qualityGood');
              break;
            case 'poor':
              expect(classList).toContain('qualityPoor');
              break;
            case 'unknown':
              expect(classList).toContain('qualityUnknown');
              break;
          }

          unmount();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12i: Reconnect Button Functionality
   * For any disconnected state, the reconnect button should be functional
   * Validates: Requirements 6.2
   */
  test('Property 12i: Reconnect button is functional when displayed', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: undefined }),
        (errorMessage) => {
          const status: ConnectionStatusType = {
            connected: false,
            reconnecting: false,
            error: errorMessage,
            quality: {
              status: 'unknown',
              score: 0,
              factors: {
                latency: 0,
                stability: 0,
                throughput: 0,
              },
            },
            latency: 0,
            uptime: 0,
          };

          const mockReconnect = jest.fn();
          const { container } = render(
            <ConnectionStatus status={status} onReconnect={mockReconnect} />
          );

          // Test 1: Reconnect button should be present
          const reconnectButton = container.querySelector('[class*="reconnectButton"]');
          expect(reconnectButton).toBeInTheDocument();

          // Test 2: Clicking reconnect button should call the callback
          reconnectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          expect(mockReconnect).toHaveBeenCalledTimes(1);

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 12j: Status Indicator Accessibility
   * For any connection state, status indicators should be accessible
   * Validates: Requirements 6.2
   */
  test('Property 12j: Status indicators maintain accessibility standards', () => {
    fc.assert(
      fc.property(
        connectionStatusGenerator,
        (status) => {
          const mockReconnect = jest.fn();
          const { container } = render(
            <ConnectionStatus status={status} onReconnect={mockReconnect} />
          );

          // Test 1: Status text should be readable
          const statusText = container.querySelector('[class*="text"]');
          expect(statusText).toBeInTheDocument();
          expect(statusText?.textContent).toBeTruthy();
          expect(statusText?.textContent?.length).toBeGreaterThan(0);

          // Test 2: Reconnect button should be accessible when present
          const reconnectButton = container.querySelector('[class*="reconnectButton"]');
          if (reconnectButton) {
            expect(reconnectButton.tagName).toBe('BUTTON');
            expect(reconnectButton.textContent).toBeTruthy();
          }

          // Test 3: Visual indicators should have semantic meaning
          const indicator = container.querySelector('[class*="indicator"]');
          expect(indicator).toBeInTheDocument();

          // Test 4: Status should be conveyed through text, not just color
          expect(statusText?.textContent).toMatch(/Connected|Disconnected|Reconnecting|Error/);

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
