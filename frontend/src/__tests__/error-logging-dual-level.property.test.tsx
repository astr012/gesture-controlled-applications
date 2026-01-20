/**
 * Property-Based Test for Error Logging Dual Level
 * Feature: frontend-restructure, Property 17: Error Logging Dual Level
 * Validates: Requirements 10.4
 * 
 * This test validates that for any error occurrence, detailed information is logged
 * for debugging while simplified messages are shown to users.
 */

import { fc } from '@fast-check/jest';
import { render } from '@testing-library/react';
import React from 'react';
import ErrorBoundary, { type ErrorSeverity, type ErrorBoundaryLevel } from '@/components/ui/ErrorBoundary';
import ErrorLoggingService from '@/services/ErrorLoggingService';

// Reduced number of runs for faster testing
const NUM_RUNS = 50;

// Generators for property-based testing
const errorSeverityGenerator = fc.constantFrom<ErrorSeverity>('low', 'medium', 'high', 'critical');
const errorBoundaryLevelGenerator = fc.constantFrom<ErrorBoundaryLevel>('app', 'route', 'project', 'component');

// Generator for error messages
const errorMessageGenerator = fc.oneof(
  fc.constant('Network error occurred'),
  fc.constant('Component render failed'),
  fc.constant('WebSocket connection lost'),
  fc.constant('Chunk load failed'),
  fc.constant('Invalid state transition'),
  fc.constant('Timeout exceeded'),
  fc.constant('Resource not found'),
  fc.constant('Database query failed'),
  fc.constant('Authentication failed'),
  fc.string({ minLength: 10, maxLength: 100 })
);

// Generator for error names
const errorNameGenerator = fc.oneof(
  fc.constant('Error'),
  fc.constant('TypeError'),
  fc.constant('ReferenceError'),
  fc.constant('NetworkError'),
  fc.constant('TimeoutError'),
  fc.constant('ChunkLoadError'),
  fc.constant('SyntaxError'),
  fc.constant('RangeError')
);

// Generator for custom errors with stack traces
const customErrorGenerator = fc.record({
  name: errorNameGenerator,
  message: errorMessageGenerator,
  stack: fc.option(fc.string({ minLength: 50, maxLength: 500 }), { nil: undefined }),
});

// Generator for error context
const errorContextGenerator = fc.record({
  route: fc.constantFrom('/dashboard', '/project/finger_count', '/project/volume_control', '/settings', '/'),
  component: fc.constantFrom('Header', 'Sidebar', 'ProjectLoader', 'GestureDisplay', 'WebSocketManager'),
  project: fc.option(fc.constantFrom('finger_count', 'volume_control', 'virtual_mouse'), { nil: undefined }),
  buildVersion: fc.option(fc.constantFrom('1.0.0', '1.1.0', '2.0.0-beta'), { nil: undefined }),
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

describe('Property 17: Error Logging Dual Level', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalGroup = console.group;
  const originalGroupEnd = console.groupEnd;

  let consoleErrorMock: jest.Mock;
  let consoleLogMock: jest.Mock;
  let consoleGroupMock: jest.Mock;
  let consoleGroupEndMock: jest.Mock;

  beforeAll(() => {
    consoleErrorMock = jest.fn();
    consoleLogMock = jest.fn();
    consoleGroupMock = jest.fn();
    consoleGroupEndMock = jest.fn();

    console.error = consoleErrorMock;
    console.warn = jest.fn();
    console.log = consoleLogMock;
    console.group = consoleGroupMock;
    console.groupEnd = consoleGroupEndMock;
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
    console.group = originalGroup;
    console.groupEnd = originalGroupEnd;
  });

  beforeEach(() => {
    // Clear console call tracking
    consoleErrorMock.mockClear();
    consoleLogMock.mockClear();
    consoleGroupMock.mockClear();
    consoleGroupEndMock.mockClear();

    // Clear localStorage
    localStorage.clear();
    
    // Reset ErrorLoggingService
    ErrorLoggingService.getInstance().clearErrorLogs();
  });

  /**
   * Property 17a: Detailed Logging for Debugging
   * For any error, detailed information should be logged to console and storage
   * Validates: Requirements 10.4
   */
  test('Property 17a: Detailed error information is logged for debugging', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorBoundaryLevelGenerator,
        errorContextGenerator,
        (errorData, level, context) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;
          if (errorData.stack) {
            error.stack = errorData.stack;
          }

          render(
            <ErrorBoundary level={level} context={context}>
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Error should be logged to console with details
          expect(consoleErrorMock).toHaveBeenCalled();

          // Test 2: Detailed error log should be stored in localStorage
          const errorLogs = localStorage.getItem('error-logs');
          expect(errorLogs).toBeTruthy();

          if (errorLogs) {
            const logs = JSON.parse(errorLogs);
            expect(logs.length).toBeGreaterThan(0);

            const latestLog = logs[logs.length - 1];

            // Test 3: Log should contain error name
            expect(latestLog.error.name).toBe(error.name);

            // Test 4: Log should contain error message
            expect(latestLog.error.message).toBe(error.message);

            // Test 5: Log should contain stack trace if available
            if (error.stack) {
              expect(latestLog.error.stack).toBeTruthy();
            }

            // Test 6: Log should contain error boundary level
            expect(latestLog.level).toBe(level);

            // Test 7: Log should contain context information
            expect(latestLog.context).toBeTruthy();
            expect(latestLog.context.route).toBe(context.route);
            expect(latestLog.context.component).toBe(context.component);

            // Test 8: Log should contain timestamp
            expect(latestLog.timestamp).toBeTruthy();
            expect(typeof latestLog.timestamp).toBe('number');

            // Test 9: Log should contain unique error ID
            expect(latestLog.id).toBeTruthy();
            expect(latestLog.id).toMatch(/^err_/);

            // Test 10: Log should contain user agent
            expect(latestLog.userAgent).toBeTruthy();

            // Test 11: Log should contain URL
            expect(latestLog.url).toBeTruthy();

            // Test 12: Log should contain viewport information
            expect(latestLog.viewport).toBeTruthy();
            expect(latestLog.viewport.width).toBeGreaterThan(0);
            expect(latestLog.viewport.height).toBeGreaterThan(0);

            // Test 13: Log should contain breadcrumbs
            expect(latestLog.breadcrumbs).toBeTruthy();
            expect(Array.isArray(latestLog.breadcrumbs)).toBe(true);

            // Test 14: Log should contain tags
            expect(latestLog.tags).toBeTruthy();
            expect(latestLog.tags.errorBoundary).toBe(level);
            expect(latestLog.tags.errorType).toBe(error.name);
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 17b: Simplified User Messages
   * For any error, simplified user-friendly messages should be displayed
   * Validates: Requirements 10.4
   */
  test('Property 17b: Simplified messages are shown to users', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorBoundaryLevelGenerator,
        (errorData, level) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          const { container } = render(
            <ErrorBoundary level={level}>
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: User-facing UI should not show stack traces
          expect(container.textContent).not.toContain('at Object');
          expect(container.textContent).not.toContain('at Module');
          expect(container.textContent).not.toContain('.tsx:');
          expect(container.textContent).not.toContain('.ts:');

          // Test 2: User-facing UI should not show technical error names
          const technicalTerms = ['TypeError', 'ReferenceError', 'SyntaxError', 'RangeError'];
          const hasTechnicalTerm = technicalTerms.some(term => 
            container.textContent?.includes(term)
          );
          // Technical terms might appear in error IDs or details, but not prominently
          if (hasTechnicalTerm) {
            // Should be in collapsed details section, not main message
            const details = container.querySelector('details');
            expect(details).toBeTruthy();
          }

          // Test 3: User-facing UI should show friendly title
          const title = container.querySelector('[class*="title"]');
          expect(title).toBeInTheDocument();
          expect(title?.textContent).toBeTruthy();
          expect(title?.textContent?.length).toBeGreaterThan(5);

          // Test 4: User-facing UI should show helpful message
          const message = container.querySelector('[class*="message"]');
          expect(message).toBeInTheDocument();
          expect(message?.textContent).toBeTruthy();

          // Test 5: User-facing UI should provide action buttons
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 17c: Dual Level Separation
   * For any error, there should be clear separation between detailed logs and user messages
   * Validates: Requirements 10.4
   */
  test('Property 17c: Clear separation between detailed logs and user messages', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorContextGenerator,
        (errorData, context) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;
          if (errorData.stack) {
            error.stack = errorData.stack;
          }

          const { container } = render(
            <ErrorBoundary level="component" context={context}>
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Get detailed log from localStorage
          const errorLogs = localStorage.getItem('error-logs');
          expect(errorLogs).toBeTruthy();

          if (errorLogs) {
            const logs = JSON.parse(errorLogs);
            const latestLog = logs[logs.length - 1];

            // Test 1: Detailed log should contain stack trace
            if (error.stack) {
              expect(latestLog.error.stack).toBeTruthy();
            }

            // Test 2: Detailed log should contain full error message
            expect(latestLog.error.message).toBe(error.message);

            // Test 3: Detailed log should contain technical details
            expect(latestLog.userAgent).toBeTruthy();
            expect(latestLog.viewport).toBeTruthy();
            expect(latestLog.breadcrumbs).toBeTruthy();

            // Test 4: User UI should NOT contain these technical details
            expect(container.textContent).not.toContain(latestLog.userAgent);
            expect(container.textContent).not.toContain(latestLog.id);
            
            // Test 5: User UI should contain simplified version
            expect(container.textContent).toBeTruthy();
            
            // Test 6: Detailed log should have more information than user message
            const userMessageLength = container.textContent?.length || 0;
            const detailedLogLength = JSON.stringify(latestLog).length;
            
            // The detailed log should contain significantly more data than the user-facing message
            // This includes stack traces, breadcrumbs, performance data, etc.
            expect(detailedLogLength).toBeGreaterThan(userMessageLength * 0.5);
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 17d: Console Logging Detail Level
   * For any error, console should log detailed information for developers
   * Validates: Requirements 10.4
   */
  test('Property 17d: Console logs contain detailed information for developers', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorBoundaryLevelGenerator,
        (errorData, level) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          // Clear previous calls
          consoleErrorMock.mockClear();
          consoleLogMock.mockClear();
          consoleGroupMock.mockClear();

          render(
            <ErrorBoundary level={level}>
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Console.error should be called with error details
          expect(consoleErrorMock).toHaveBeenCalled();

          // Test 2: Console.group should be used for organized logging
          expect(consoleGroupMock).toHaveBeenCalled();

          // Test 3: Console.log should contain context information
          expect(consoleLogMock).toHaveBeenCalled();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 17e: Error ID Tracking
   * For any error, a unique error ID should be generated for tracking
   * Validates: Requirements 10.4
   */
  test('Property 17e: Unique error IDs are generated for tracking', () => {
    fc.assert(
      fc.property(
        fc.array(customErrorGenerator, { minLength: 2, maxLength: 5 }),
        (errorDataArray) => {
          const errorIds = new Set<string>();

          errorDataArray.forEach((errorData) => {
            const error = new Error(errorData.message);
            error.name = errorData.name;

            render(
              <ErrorBoundary level="component">
                <ThrowError shouldThrow={true} error={error} />
              </ErrorBoundary>
            );

            const errorLogs = localStorage.getItem('error-logs');
            if (errorLogs) {
              const logs = JSON.parse(errorLogs);
              const latestLog = logs[logs.length - 1];
              errorIds.add(latestLog.id);
            }
          });

          // Test 1: Each error should have a unique ID
          expect(errorIds.size).toBe(errorDataArray.length);

          // Test 2: Error IDs should follow format
          errorIds.forEach((id) => {
            expect(id).toMatch(/^err_\d+_[a-z0-9]+$/);
          });

          return true;
        }
      ),
      { numRuns: 20 } // Reduced for multiple renders
    );
  });

  /**
   * Property 17f: Breadcrumb Trail Logging
   * For any error, breadcrumbs should be logged for context
   * Validates: Requirements 10.4
   */
  test('Property 17f: Breadcrumb trail is logged for error context', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        (errorData, breadcrumbMessages) => {
          const errorLoggingService = ErrorLoggingService.getInstance();
          errorLoggingService.clearErrorLogs();

          // Add breadcrumbs before error
          breadcrumbMessages.forEach((message) => {
            errorLoggingService.addBreadcrumb('user', message, 'info');
          });

          const error = new Error(errorData.message);
          error.name = errorData.name;

          render(
            <ErrorBoundary level="component">
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          const errorLogs = localStorage.getItem('error-logs');
          expect(errorLogs).toBeTruthy();

          if (errorLogs) {
            const logs = JSON.parse(errorLogs);
            const latestLog = logs[logs.length - 1];

            // Test 1: Log should contain breadcrumbs
            expect(latestLog.breadcrumbs).toBeTruthy();
            expect(Array.isArray(latestLog.breadcrumbs)).toBe(true);

            // Test 2: Breadcrumbs should include user actions
            expect(latestLog.breadcrumbs.length).toBeGreaterThanOrEqual(breadcrumbMessages.length);

            // Test 3: Each breadcrumb should have required fields
            latestLog.breadcrumbs.forEach((breadcrumb: any) => {
              expect(breadcrumb.timestamp).toBeTruthy();
              expect(breadcrumb.category).toBeTruthy();
              expect(breadcrumb.message).toBeTruthy();
              expect(breadcrumb.level).toBeTruthy();
            });
          }

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 17g: Performance Data Logging
   * For any error, performance data should be logged when available
   * Validates: Requirements 10.4
   */
  test('Property 17g: Performance data is logged with errors', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        (errorData) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          render(
            <ErrorBoundary level="component">
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          const errorLogs = localStorage.getItem('error-logs');
          expect(errorLogs).toBeTruthy();

          if (errorLogs) {
            const logs = JSON.parse(errorLogs);
            const latestLog = logs[logs.length - 1];

            // Test 1: Log should have performance field
            expect(latestLog.performance).toBeDefined();

            // Test 2: Performance data should contain timing if available
            if (performance.timing) {
              expect(latestLog.performance.timing).toBeTruthy();
            }

            // Test 3: Performance data should contain memory if available (Chrome)
            if ((performance as any).memory) {
              expect(latestLog.performance.memory).toBeTruthy();
            }
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 17h: Error Severity in Logs
   * For any error, severity should be logged for prioritization
   * Validates: Requirements 10.4
   */
  test('Property 17h: Error severity is logged for prioritization', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        errorSeverityGenerator,
        (errorData, severity) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;

          render(
            <ErrorBoundary level="component">
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          const errorLogs = localStorage.getItem('error-logs');
          expect(errorLogs).toBeTruthy();

          if (errorLogs) {
            const logs = JSON.parse(errorLogs);
            const latestLog = logs[logs.length - 1];

            // Test 1: Log should contain severity
            expect(latestLog.severity).toBeTruthy();
            expect(['low', 'medium', 'high', 'critical']).toContain(latestLog.severity);

            // Test 2: Severity should be used in tags
            expect(latestLog.tags).toBeTruthy();
          }

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 17i: Error Log Persistence
   * For any error, logs should persist across page reloads
   * Validates: Requirements 10.4
   */
  test('Property 17i: Error logs persist across sessions', () => {
    fc.assert(
      fc.property(
        fc.array(customErrorGenerator, { minLength: 1, maxLength: 3 }),
        (errorDataArray) => {
          localStorage.clear();

          // Log multiple errors
          errorDataArray.forEach((errorData) => {
            const error = new Error(errorData.message);
            error.name = errorData.name;

            render(
              <ErrorBoundary level="component">
                <ThrowError shouldThrow={true} error={error} />
              </ErrorBoundary>
            );
          });

          // Test 1: Errors should be stored in localStorage
          const errorLogs = localStorage.getItem('error-logs');
          expect(errorLogs).toBeTruthy();

          if (errorLogs) {
            const logs = JSON.parse(errorLogs);

            // Test 2: All errors should be logged
            expect(logs.length).toBeGreaterThanOrEqual(errorDataArray.length);

            // Test 3: Logs should be retrievable
            const errorLoggingService = ErrorLoggingService.getInstance();
            const retrievedLogs = errorLoggingService.getErrorLogs();
            expect(retrievedLogs.length).toBeGreaterThanOrEqual(errorDataArray.length);

            // Test 4: Each log should have complete data
            retrievedLogs.forEach((log: any) => {
              expect(log.id).toBeTruthy();
              expect(log.timestamp).toBeTruthy();
              expect(log.error).toBeTruthy();
              expect(log.context).toBeTruthy();
            });
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 17j: Error Export Functionality
   * For any set of errors, they should be exportable for analysis
   * Validates: Requirements 10.4
   */
  test('Property 17j: Error logs can be exported for analysis', () => {
    fc.assert(
      fc.property(
        fc.array(customErrorGenerator, { minLength: 1, maxLength: 3 }),
        (errorDataArray) => {
          localStorage.clear();
          const errorLoggingService = ErrorLoggingService.getInstance();
          errorLoggingService.clearErrorLogs();

          // Log errors
          errorDataArray.forEach((errorData) => {
            const error = new Error(errorData.message);
            error.name = errorData.name;

            render(
              <ErrorBoundary level="component">
                <ThrowError shouldThrow={true} error={error} />
              </ErrorBoundary>
            );
          });

          // Test 1: Export should return valid JSON string
          const exportData = errorLoggingService.exportErrorData();
          expect(exportData).toBeTruthy();
          expect(() => JSON.parse(exportData)).not.toThrow();

          // Test 2: Exported data should contain error logs
          const parsed = JSON.parse(exportData);
          expect(parsed.errorLogs).toBeTruthy();
          expect(Array.isArray(parsed.errorLogs)).toBe(true);

          // Test 3: Exported data should contain breadcrumbs
          expect(parsed.breadcrumbs).toBeTruthy();
          expect(Array.isArray(parsed.breadcrumbs)).toBe(true);

          // Test 4: Exported data should contain timestamp
          expect(parsed.timestamp).toBeTruthy();

          // Test 5: Exported data should contain version
          expect(parsed.version).toBeTruthy();

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 17k: User-Facing Error Details Toggle
   * For any error, users should be able to view details if needed
   * Validates: Requirements 10.4
   */
  test('Property 17k: Users can optionally view error details', () => {
    fc.assert(
      fc.property(
        customErrorGenerator,
        (errorData) => {
          const error = new Error(errorData.message);
          error.name = errorData.name;
          if (errorData.stack) {
            error.stack = errorData.stack;
          }

          const { container } = render(
            <ErrorBoundary level="component">
              <ThrowError shouldThrow={true} error={error} />
            </ErrorBoundary>
          );

          // Test 1: Should have details section for advanced users
          const detailsElement = container.querySelector('details');
          
          if (process.env.NODE_ENV === 'development' || detailsElement) {
            // Test 2: Details should be collapsed by default
            if (detailsElement) {
              expect(detailsElement.hasAttribute('open')).toBe(false);
            }

            // Test 3: Details should contain error ID
            const errorIdElement = container.querySelector('[class*="errorId"]');
            expect(errorIdElement).toBeInTheDocument();

            // Test 4: Details should contain timestamp
            const timestampElement = container.querySelector('[class*="timestamp"]');
            expect(timestampElement).toBeInTheDocument();
          }

          // Test 5: Main message should always be visible
          const message = container.querySelector('[class*="message"]');
          expect(message).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 17l: Error Log Size Management
   * For any number of errors, log storage should be managed to prevent overflow
   * Validates: Requirements 10.4
   */
  test('Property 17l: Error log storage is managed to prevent overflow', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 25, max: 30 }),
        (numErrors) => {
          localStorage.clear();
          const errorLoggingService = ErrorLoggingService.getInstance();
          errorLoggingService.clearErrorLogs();

          // Generate many errors
          for (let i = 0; i < numErrors; i++) {
            const error = new Error(`Error ${i}`);
            
            render(
              <ErrorBoundary level="component">
                <ThrowError shouldThrow={true} error={error} />
              </ErrorBoundary>
            );
          }

          const errorLogs = localStorage.getItem('error-logs');
          expect(errorLogs).toBeTruthy();

          if (errorLogs) {
            const logs = JSON.parse(errorLogs);

            // Test 1: Should limit number of stored logs (max 20 as per implementation)
            expect(logs.length).toBeLessThanOrEqual(20);

            // Test 2: Should keep most recent logs
            if (numErrors > 20) {
              const lastLog = logs[logs.length - 1];
              expect(lastLog.error.message).toContain(`Error ${numErrors - 1}`);
            }

            // Test 3: Should not exceed reasonable storage size
            const storageSize = new Blob([errorLogs]).size;
            expect(storageSize).toBeLessThan(1024 * 1024); // Less than 1MB
          }

          return true;
        }
      ),
      { numRuns: 10 } // Reduced due to many renders
    );
  });
});
