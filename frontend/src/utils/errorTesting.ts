/**
 * Error Testing Utilities
 * Provides tools for testing error scenarios and recovery mechanisms
 * Only available in development mode
 */

import ErrorLoggingService from '@/services/ErrorLoggingService';
import type { ErrorTestScenario } from '@/types/error-testing';

export type { ErrorTestScenario }; // Re-export for convenience if needed, or just rely on the new file

class ErrorTestingService {
  private errorLogger = ErrorLoggingService.getInstance();
  private isEnabled = process.env.NODE_ENV === 'development';

  // Component error scenarios
  private componentErrorScenarios: ErrorTestScenario[] = [
    {
      id: 'render-error',
      name: 'Component Render Error',
      description: 'Simulates a component that throws during render',
      category: 'component',
      severity: 'medium',
      trigger: () => {
        this.triggerComponentError('Simulated render error');
      },
    },
    {
      id: 'hook-error',
      name: 'React Hook Error',
      description: 'Simulates an error in a React hook',
      category: 'component',
      severity: 'medium',
      trigger: () => {
        this.triggerHookError('Simulated hook error');
      },
    },
    {
      id: 'state-error',
      name: 'State Update Error',
      description: 'Simulates an error during state update',
      category: 'component',
      severity: 'low',
      trigger: () => {
        this.triggerStateError('Simulated state update error');
      },
    },
  ];

  // Network error scenarios
  private networkErrorScenarios: ErrorTestScenario[] = [
    {
      id: 'websocket-error',
      name: 'WebSocket Connection Error',
      description: 'Simulates WebSocket connection failure',
      category: 'network',
      severity: 'high',
      trigger: () => {
        this.triggerWebSocketError();
      },
    },
    {
      id: 'api-error',
      name: 'API Request Error',
      description: 'Simulates failed API request',
      category: 'network',
      severity: 'medium',
      trigger: () => {
        this.triggerApiError();
      },
    },
    {
      id: 'timeout-error',
      name: 'Request Timeout',
      description: 'Simulates request timeout',
      category: 'network',
      severity: 'medium',
      trigger: () => {
        this.triggerTimeoutError();
      },
    },
  ];

  // Async operation error scenarios
  private asyncErrorScenarios: ErrorTestScenario[] = [
    {
      id: 'promise-rejection',
      name: 'Unhandled Promise Rejection',
      description: 'Simulates unhandled promise rejection',
      category: 'async',
      severity: 'high',
      trigger: () => {
        this.triggerPromiseRejection();
      },
    },
    {
      id: 'async-function-error',
      name: 'Async Function Error',
      description: 'Simulates error in async function',
      category: 'async',
      severity: 'medium',
      trigger: () => {
        this.triggerAsyncFunctionError();
      },
    },
    {
      id: 'loading-error',
      name: 'Resource Loading Error',
      description: 'Simulates dynamic import failure',
      category: 'async',
      severity: 'high',
      trigger: () => {
        this.triggerLoadingError();
      },
    },
  ];

  // Permission error scenarios
  private permissionErrorScenarios: ErrorTestScenario[] = [
    {
      id: 'camera-denied',
      name: 'Camera Permission Denied',
      description: 'Simulates camera access denial',
      category: 'permission',
      severity: 'high',
      trigger: () => {
        this.triggerCameraError();
      },
    },
    {
      id: 'storage-error',
      name: 'Storage Access Error',
      description: 'Simulates localStorage access error',
      category: 'permission',
      severity: 'low',
      trigger: () => {
        this.triggerStorageError();
      },
    },
  ];

  // Memory error scenarios
  private memoryErrorScenarios: ErrorTestScenario[] = [
    {
      id: 'memory-leak',
      name: 'Memory Leak Simulation',
      description: 'Simulates memory leak by creating large objects',
      category: 'memory',
      severity: 'critical',
      trigger: () => {
        this.triggerMemoryLeak();
      },
    },
    {
      id: 'stack-overflow',
      name: 'Stack Overflow',
      description: 'Simulates stack overflow with infinite recursion',
      category: 'memory',
      severity: 'critical',
      trigger: () => {
        this.triggerStackOverflow();
      },
    },
  ];

  getAllScenarios(): ErrorTestScenario[] {
    if (!this.isEnabled) return [];

    return [
      ...this.componentErrorScenarios,
      ...this.networkErrorScenarios,
      ...this.asyncErrorScenarios,
      ...this.permissionErrorScenarios,
      ...this.memoryErrorScenarios,
    ];
  }

  getScenariosByCategory(category: ErrorTestScenario['category']): ErrorTestScenario[] {
    return this.getAllScenarios().filter(scenario => scenario.category === category);
  }

  getScenarioById(id: string): ErrorTestScenario | undefined {
    return this.getAllScenarios().find(scenario => scenario.id === id);
  }

  triggerScenario(id: string): boolean {
    if (!this.isEnabled) {
      console.warn('Error testing is only available in development mode');
      return false;
    }

    const scenario = this.getScenarioById(id);
    if (!scenario) {
      console.error(`Error scenario not found: ${id}`);
      return false;
    }

    console.warn(`🧪 Triggering error scenario: ${scenario.name}`);
    this.errorLogger.logUserAction('error_test_triggered', {
      scenarioId: id,
      scenarioName: scenario.name,
      category: scenario.category,
      severity: scenario.severity,
    });

    try {
      scenario.trigger();
      return true;
    } catch (error) {
      console.error('Failed to trigger error scenario:', error);
      return false;
    }
  }

  // Component error triggers
  private triggerComponentError(message: string) {
    // Create a component that will throw during render
    const ErrorComponent = () => {
      throw new Error(message);
    };

    // This would need to be integrated with React to actually trigger
    // For now, we'll just throw the error
    setTimeout(() => {
      throw new Error(message);
    }, 100);
  }

  private triggerHookError(message: string) {
    // Simulate hook error
    setTimeout(() => {
      const error = new Error(message);
      error.name = 'HookError';
      throw error;
    }, 100);
  }

  private triggerStateError(message: string) {
    // Simulate state update error
    setTimeout(() => {
      const error = new Error(message);
      error.name = 'StateError';
      throw error;
    }, 100);
  }

  // Network error triggers
  private triggerWebSocketError() {
    // Simulate WebSocket error
    const mockWebSocket = {
      readyState: WebSocket.CONNECTING,
      close: () => { },
      send: () => {
        throw new Error('WebSocket connection failed');
      },
    };

    setTimeout(() => {
      const error = new Error('WebSocket connection failed');
      error.name = 'WebSocketError';
      throw error;
    }, 100);
  }

  private triggerApiError() {
    // Simulate API error
    fetch('/api/nonexistent-endpoint')
      .catch(error => {
        console.error('Simulated API error:', error);
      });
  }

  private triggerTimeoutError() {
    // Simulate timeout error
    setTimeout(() => {
      const error = new Error('Request timeout');
      error.name = 'TimeoutError';
      throw error;
    }, 100);
  }

  // Async error triggers
  private triggerPromiseRejection() {
    // Create unhandled promise rejection
    Promise.reject(new Error('Simulated unhandled promise rejection'));
  }

  private async triggerAsyncFunctionError() {
    // Simulate async function error
    await new Promise(resolve => setTimeout(resolve, 50));
    throw new Error('Simulated async function error');
  }

  private triggerLoadingError() {
    // Simulate dynamic import failure
    const fakeImport = () => Promise.reject(new Error('Failed to load module'));
    fakeImport().catch(error => {
      console.error('Simulated loading error:', error);
      throw new Error('Failed to load module');
    });
  }

  // Permission error triggers
  private triggerCameraError() {
    // Simulate camera access error
    navigator.mediaDevices?.getUserMedia({ video: true })
      .catch(error => {
        console.error('Simulated camera error:', error);
        throw new Error('Camera access denied');
      });
  }

  private triggerStorageError() {
    // Simulate storage error
    try {
      // Try to exceed localStorage quota
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string
      localStorage.setItem('test-large-data', largeData);
    } catch (error) {
      console.error('Simulated storage error:', error);
      throw new Error('Storage quota exceeded');
    }
  }

  // Memory error triggers
  private triggerMemoryLeak() {
    // Simulate memory leak
    const leakyArray: any[] = [];
    const interval = setInterval(() => {
      // Create large objects
      for (let i = 0; i < 1000; i++) {
        leakyArray.push(new Array(10000).fill('memory-leak-data'));
      }

      if (leakyArray.length > 100000) {
        clearInterval(interval);
        throw new Error('Simulated memory leak');
      }
    }, 10);
  }

  private triggerStackOverflow() {
    // Simulate stack overflow
    const recursiveFunction = (depth: number = 0): number => {
      if (depth > 10000) {
        throw new Error('Simulated stack overflow');
      }
      return recursiveFunction(depth + 1);
    };

    setTimeout(() => {
      recursiveFunction();
    }, 100);
  }

  // Recovery testing
  testRecoveryMechanisms() {
    if (!this.isEnabled) return;

    console.group('🔧 Testing Recovery Mechanisms');

    // Test error boundary recovery
    console.log('Testing error boundary recovery...');
    this.triggerScenario('render-error');

    setTimeout(() => {
      console.log('Testing retry mechanism...');
      // Simulate retry action
      this.errorLogger.logUserAction('recovery_test_retry', { mechanism: 'retry' });
    }, 2000);

    setTimeout(() => {
      console.log('Testing refresh mechanism...');
      // Simulate refresh action
      this.errorLogger.logUserAction('recovery_test_refresh', { mechanism: 'refresh' });
    }, 4000);

    console.groupEnd();
  }

  // Performance impact testing
  testPerformanceImpact() {
    if (!this.isEnabled) return;

    console.group('⚡ Testing Performance Impact');

    const startTime = performance.now();

    // Trigger multiple errors to test performance impact
    this.triggerScenario('render-error');
    this.triggerScenario('api-error');
    this.triggerScenario('promise-rejection');

    setTimeout(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Error handling performance impact: ${duration.toFixed(2)}ms`);
      this.errorLogger.logUserAction('performance_test_complete', {
        duration,
        errorCount: 3
      });
    }, 1000);

    console.groupEnd();
  }

  // Export error logs for analysis
  exportErrorLogs(): string {
    const errorData = {
      errorLogs: this.errorLogger.getErrorLogs(),
      breadcrumbs: this.errorLogger.getBreadcrumbs(),
      userActions: this.errorLogger.getUserActions(),
      testScenarios: this.getAllScenarios().map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        severity: s.severity,
      })),
      timestamp: new Date().toISOString(),
      environment: 'development',
    };

    return JSON.stringify(errorData, null, 2);
  }

  // Clear all error data
  clearErrorData() {
    this.errorLogger.clearErrorLogs();
    console.log('🧹 Error testing data cleared');
  }
}

// Singleton instance
const errorTestingService = new ErrorTestingService();

// Global access for debugging (development only)
if (process.env.NODE_ENV === 'development') {
  (window as any).errorTesting = errorTestingService;
}

export default errorTestingService;