/**
 * Integration Validator
 * Validates that all components are properly integrated and working together
 */

import React from 'react';
import PerformanceMonitor from '@/services/PerformanceMonitor';
import { browserCompatibility } from '@/utils/browserCompatibility';
import ErrorLoggingService from '@/services/ErrorLoggingService';

export interface IntegrationTestResult {
  passed: boolean;
  testName: string;
  message: string;
  details?: any;
}

export interface IntegrationReport {
  overallStatus: 'pass' | 'fail' | 'warning';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  results: IntegrationTestResult[];
  recommendations: string[];
}

class IntegrationValidator {
  private static instance: IntegrationValidator;
  private performanceMonitor: PerformanceMonitor;
  private errorLogger: ErrorLoggingService;

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.errorLogger = ErrorLoggingService.getInstance();
  }

  static getInstance(): IntegrationValidator {
    if (!IntegrationValidator.instance) {
      IntegrationValidator.instance = new IntegrationValidator();
    }
    return IntegrationValidator.instance;
  }

  // Core integration tests
  async runIntegrationTests(): Promise<IntegrationReport> {
    const results: IntegrationTestResult[] = [];

    // Test 1: Browser Compatibility
    results.push(await this.testBrowserCompatibility());

    // Test 2: Performance Monitoring
    results.push(await this.testPerformanceMonitoring());

    // Test 3: Error Logging
    results.push(await this.testErrorLogging());

    // Test 4: Local Storage
    results.push(await this.testLocalStorage());

    // Test 5: WebSocket Readiness
    results.push(await this.testWebSocketReadiness());

    // Test 6: Component Loading
    results.push(await this.testComponentLoading());

    // Test 7: Route Navigation
    results.push(await this.testRouteNavigation());

    // Test 8: Bundle Loading
    results.push(await this.testBundleLoading());

    // Test 9: Memory Management
    results.push(await this.testMemoryManagement());

    // Test 10: CSS and Styling
    results.push(await this.testStyling());

    // Calculate overall status
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed && r.message.includes('Error')).length;
    const warningTests = results.filter(r => !r.passed && !r.message.includes('Error')).length;

    let overallStatus: 'pass' | 'fail' | 'warning' = 'pass';
    if (failedTests > 0) {
      overallStatus = 'fail';
    } else if (warningTests > 0) {
      overallStatus = 'warning';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(results);

    return {
      overallStatus,
      totalTests: results.length,
      passedTests,
      failedTests,
      warningTests,
      results,
      recommendations,
    };
  }

  private async testBrowserCompatibility(): Promise<IntegrationTestResult> {
    try {
      const browserInfo = browserCompatibility.getBrowserInfo();
      const issues = browserCompatibility.getCompatibilityIssues();
      const isSupported = browserCompatibility.isBrowserSupported();

      if (!browserInfo) {
        return {
          passed: false,
          testName: 'Browser Compatibility',
          message: 'Error: Could not detect browser information',
        };
      }

      const criticalIssues = issues.filter(issue => issue.severity === 'error');
      
      if (criticalIssues.length > 0) {
        return {
          passed: false,
          testName: 'Browser Compatibility',
          message: `Error: ${criticalIssues.length} critical compatibility issues found`,
          details: { browserInfo, issues: criticalIssues },
        };
      }

      const warningIssues = issues.filter(issue => issue.severity === 'warning');
      if (warningIssues.length > 0) {
        return {
          passed: false,
          testName: 'Browser Compatibility',
          message: `Warning: ${warningIssues.length} compatibility warnings found`,
          details: { browserInfo, issues: warningIssues },
        };
      }

      return {
        passed: true,
        testName: 'Browser Compatibility',
        message: `Browser fully supported: ${browserInfo.name} ${browserInfo.version}`,
        details: { browserInfo, issues },
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Browser Compatibility',
        message: `Error: Browser compatibility check failed - ${error}`,
      };
    }
  }

  private async testPerformanceMonitoring(): Promise<IntegrationTestResult> {
    try {
      const metrics = this.performanceMonitor.getMetrics();
      
      if (!metrics) {
        return {
          passed: false,
          testName: 'Performance Monitoring',
          message: 'Error: Performance monitoring not initialized',
        };
      }

      // Check if performance monitoring is collecting data
      const hasMetrics = metrics.componentRenderTime.size > 0 || 
                        metrics.routeLoadTime.size > 0 ||
                        metrics.webSocketLatency.length > 0;

      if (!hasMetrics) {
        return {
          passed: false,
          testName: 'Performance Monitoring',
          message: 'Warning: Performance monitoring not collecting data yet',
          details: metrics,
        };
      }

      // Check performance score
      const score = metrics.performanceScore;
      if (score < 60) {
        return {
          passed: false,
          testName: 'Performance Monitoring',
          message: `Warning: Low performance score (${score}/100)`,
          details: metrics,
        };
      }

      return {
        passed: true,
        testName: 'Performance Monitoring',
        message: `Performance monitoring active (Score: ${score}/100)`,
        details: metrics,
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Performance Monitoring',
        message: `Error: Performance monitoring test failed - ${error}`,
      };
    }
  }

  private async testErrorLogging(): Promise<IntegrationTestResult> {
    try {
      // Test error logging functionality
      const testError = new Error('Integration test error');
      this.errorLogger.logError(testError, 'integration-test');

      // Check if error logging is working
      const canLog = typeof this.errorLogger.logError === 'function' &&
                    typeof this.errorLogger.logUserAction === 'function';

      if (!canLog) {
        return {
          passed: false,
          testName: 'Error Logging',
          message: 'Error: Error logging service not properly initialized',
        };
      }

      return {
        passed: true,
        testName: 'Error Logging',
        message: 'Error logging service is functional',
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Error Logging',
        message: `Error: Error logging test failed - ${error}`,
      };
    }
  }

  private async testLocalStorage(): Promise<IntegrationTestResult> {
    try {
      const testKey = 'integration-test-key';
      const testValue = 'integration-test-value';

      // Test localStorage functionality
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        return {
          passed: false,
          testName: 'Local Storage',
          message: 'Error: Local storage read/write test failed',
        };
      }

      // Check for existing app data
      const hasPreferences = localStorage.getItem('gesture-control-preferences') !== null;

      return {
        passed: true,
        testName: 'Local Storage',
        message: hasPreferences 
          ? 'Local storage functional with existing preferences'
          : 'Local storage functional (no existing preferences)',
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Local Storage',
        message: `Error: Local storage test failed - ${error}`,
      };
    }
  }

  private async testWebSocketReadiness(): Promise<IntegrationTestResult> {
    try {
      // Check if WebSocket is supported
      if (!('WebSocket' in window)) {
        return {
          passed: false,
          testName: 'WebSocket Readiness',
          message: 'Error: WebSocket not supported in this browser',
        };
      }

      // Check if WebSocket manager is available
      const hasWebSocketManager = document.querySelector('[data-websocket-manager]') !== null ||
                                  window.location.pathname.includes('project');

      return {
        passed: true,
        testName: 'WebSocket Readiness',
        message: hasWebSocketManager 
          ? 'WebSocket supported and manager detected'
          : 'WebSocket supported (manager not yet initialized)',
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'WebSocket Readiness',
        message: `Error: WebSocket readiness test failed - ${error}`,
      };
    }
  }

  private async testComponentLoading(): Promise<IntegrationTestResult> {
    try {
      // Check if React is loaded
      if (typeof React === 'undefined') {
        return {
          passed: false,
          testName: 'Component Loading',
          message: 'Error: React not loaded',
        };
      }

      // Check if main app components are in DOM
      const hasAppRoot = document.getElementById('root') !== null;
      const hasMainLayout = document.querySelector('[data-testid="main-layout"]') !== null ||
                           document.querySelector('.main-layout') !== null ||
                           document.querySelector('main') !== null;

      if (!hasAppRoot) {
        return {
          passed: false,
          testName: 'Component Loading',
          message: 'Error: App root element not found',
        };
      }

      return {
        passed: true,
        testName: 'Component Loading',
        message: hasMainLayout 
          ? 'Components loaded successfully'
          : 'React loaded (main layout not yet rendered)',
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Component Loading',
        message: `Error: Component loading test failed - ${error}`,
      };
    }
  }

  private async testRouteNavigation(): Promise<IntegrationTestResult> {
    try {
      // Check if router is working
      const currentPath = window.location.pathname;
      const hasRouter = typeof window.history.pushState === 'function';

      if (!hasRouter) {
        return {
          passed: false,
          testName: 'Route Navigation',
          message: 'Error: Browser does not support History API',
        };
      }

      // Check if we're on a valid route
      const validRoutes = ['/', '/project/finger-count', '/project/volume-control', '/project/virtual-mouse', '/404'];
      const isValidRoute = validRoutes.includes(currentPath) || currentPath.startsWith('/project/');

      return {
        passed: true,
        testName: 'Route Navigation',
        message: isValidRoute 
          ? `Router functional (current: ${currentPath})`
          : `Router functional (unknown route: ${currentPath})`,
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Route Navigation',
        message: `Error: Route navigation test failed - ${error}`,
      };
    }
  }

  private async testBundleLoading(): Promise<IntegrationTestResult> {
    try {
      // Check if main bundles are loaded
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

      const hasMainScript = scripts.some(script => 
        script.getAttribute('src')?.includes('main') || 
        script.getAttribute('src')?.includes('index')
      );

      const hasStyles = stylesheets.length > 0 || 
                       document.querySelector('style') !== null;

      if (!hasMainScript) {
        return {
          passed: false,
          testName: 'Bundle Loading',
          message: 'Warning: Main JavaScript bundle not detected',
          details: { scripts: scripts.length, stylesheets: stylesheets.length },
        };
      }

      return {
        passed: true,
        testName: 'Bundle Loading',
        message: `Bundles loaded (${scripts.length} scripts, ${stylesheets.length} stylesheets)`,
        details: { scripts: scripts.length, stylesheets: stylesheets.length, hasStyles },
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Bundle Loading',
        message: `Error: Bundle loading test failed - ${error}`,
      };
    }
  }

  private async testMemoryManagement(): Promise<IntegrationTestResult> {
    try {
      // Check if performance.memory is available
      const memory = (performance as any).memory;
      
      if (!memory) {
        return {
          passed: false,
          testName: 'Memory Management',
          message: 'Warning: Memory monitoring not available in this browser',
        };
      }

      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

      // Check for memory issues
      const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (memoryUsagePercent > 80) {
        return {
          passed: false,
          testName: 'Memory Management',
          message: `Warning: High memory usage (${memoryUsagePercent.toFixed(1)}%)`,
          details: { usedMB, totalMB, limitMB, usagePercent: memoryUsagePercent },
        };
      }

      return {
        passed: true,
        testName: 'Memory Management',
        message: `Memory usage normal (${usedMB}MB/${limitMB}MB, ${memoryUsagePercent.toFixed(1)}%)`,
        details: { usedMB, totalMB, limitMB, usagePercent: memoryUsagePercent },
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'Memory Management',
        message: `Error: Memory management test failed - ${error}`,
      };
    }
  }

  private async testStyling(): Promise<IntegrationTestResult> {
    try {
      // Check if CSS custom properties are working
      const testElement = document.createElement('div');
      testElement.style.setProperty('--test-var', 'test-value');
      const supportsCustomProps = testElement.style.getPropertyValue('--test-var') === 'test-value';

      // Check if CSS Grid is working
      testElement.style.display = 'grid';
      const supportsGrid = testElement.style.display === 'grid';

      // Check if Flexbox is working
      testElement.style.display = 'flex';
      const supportsFlex = testElement.style.display === 'flex';

      const issues = [];
      if (!supportsCustomProps) issues.push('CSS Custom Properties');
      if (!supportsGrid) issues.push('CSS Grid');
      if (!supportsFlex) issues.push('CSS Flexbox');

      if (issues.length > 0) {
        return {
          passed: false,
          testName: 'CSS and Styling',
          message: `Warning: Unsupported CSS features: ${issues.join(', ')}`,
          details: { supportsCustomProps, supportsGrid, supportsFlex },
        };
      }

      return {
        passed: true,
        testName: 'CSS and Styling',
        message: 'All CSS features supported',
        details: { supportsCustomProps, supportsGrid, supportsFlex },
      };
    } catch (error) {
      return {
        passed: false,
        testName: 'CSS and Styling',
        message: `Error: CSS styling test failed - ${error}`,
      };
    }
  }

  private generateRecommendations(results: IntegrationTestResult[]): string[] {
    const recommendations: string[] = [];
    
    results.forEach(result => {
      if (!result.passed) {
        if (result.message.includes('Browser Compatibility')) {
          recommendations.push('Update your browser to the latest version for the best experience.');
        }
        if (result.message.includes('Performance')) {
          recommendations.push('Consider closing other browser tabs to improve performance.');
        }
        if (result.message.includes('Local Storage')) {
          recommendations.push('Enable cookies and local storage in your browser settings.');
        }
        if (result.message.includes('WebSocket')) {
          recommendations.push('Ensure your network allows WebSocket connections.');
        }
        if (result.message.includes('Memory')) {
          recommendations.push('Refresh the page if you experience performance issues.');
        }
        if (result.message.includes('CSS')) {
          recommendations.push('Update your browser for better CSS support.');
        }
      }
    });

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Your system is fully compatible with the Gesture Control Platform.');
    } else {
      recommendations.push('Contact support if issues persist after following these recommendations.');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Public API for running specific tests
  async testBrowserSupport(): Promise<boolean> {
    const result = await this.testBrowserCompatibility();
    return result.passed;
  }

  async testPerformance(): Promise<boolean> {
    const result = await this.testPerformanceMonitoring();
    return result.passed;
  }

  // Utility method to log integration report
  logIntegrationReport(report: IntegrationReport): void {
    console.group('🔧 Integration Test Report');
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`Tests: ${report.passedTests}/${report.totalTests} passed`);
    
    if (report.failedTests > 0) {
      console.log(`Failed: ${report.failedTests}`);
    }
    if (report.warningTests > 0) {
      console.log(`Warnings: ${report.warningTests}`);
    }

    console.group('Test Results');
    report.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.message}`);
      if (result.details && process.env.NODE_ENV === 'development') {
        console.log('   Details:', result.details);
      }
    });
    console.groupEnd();

    if (report.recommendations.length > 0) {
      console.group('Recommendations');
      report.recommendations.forEach(rec => console.log(`💡 ${rec}`));
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const integrationValidator = IntegrationValidator.getInstance();

// React hook for integration testing
export function useIntegrationValidator() {
  const [report, setReport] = React.useState<IntegrationReport | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  const runTests = React.useCallback(async () => {
    setIsRunning(true);
    try {
      const testReport = await integrationValidator.runIntegrationTests();
      setReport(testReport);
      
      // Log report in development
      if (process.env.NODE_ENV === 'development') {
        integrationValidator.logIntegrationReport(testReport);
      }
    } catch (error) {
      console.error('Integration tests failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  React.useEffect(() => {
    // Run tests on mount
    runTests();
  }, [runTests]);

  return {
    report,
    isRunning,
    runTests,
    isSupported: report?.overallStatus !== 'fail',
  };
}

export default integrationValidator;