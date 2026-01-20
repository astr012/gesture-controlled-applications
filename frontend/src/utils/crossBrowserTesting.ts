/**
 * Cross-Browser Testing Utilities
 * Comprehensive testing for browser compatibility and feature support
 */

import React from 'react';
import { browserCompatibility } from '@/utils/browserCompatibility';
import type { BrowserInfo, CompatibilityIssue } from '@/types/browser';
import PerformanceMonitor from '@/services/PerformanceMonitor';
import ErrorLoggingService from '@/services/ErrorLoggingService';

export interface CrossBrowserTestResult {
  testName: string;
  browser: string;
  version: string;
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
}

export interface CrossBrowserReport {
  timestamp: string;
  overallScore: number;
  browserInfo: BrowserInfo;
  testResults: CrossBrowserTestResult[];
  criticalIssues: CompatibilityIssue[];
  recommendations: string[];
  supportLevel: 'full' | 'partial' | 'limited' | 'unsupported';
}

class CrossBrowserTester {
  private static instance: CrossBrowserTester;
  private performanceMonitor: PerformanceMonitor;
  private errorLogger: ErrorLoggingService;
  private testResults: CrossBrowserTestResult[] = [];

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.errorLogger = ErrorLoggingService.getInstance();
  }

  static getInstance(): CrossBrowserTester {
    if (!CrossBrowserTester.instance) {
      CrossBrowserTester.instance = new CrossBrowserTester();
    }
    return CrossBrowserTester.instance;
  }

  // Core browser feature tests
  private async testWebSocketSupport(): Promise<CrossBrowserTestResult> {
    const startTime = performance.now();
    const browserInfo = browserCompatibility.getBrowserInfo();

    const result: CrossBrowserTestResult = {
      testName: 'WebSocket Support',
      browser: browserInfo?.name || 'Unknown',
      version: browserInfo?.version || 'Unknown',
      passed: false,
      score: 0,
      issues: [],
      recommendations: [],
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
      },
    };

    try {
      // Test WebSocket availability
      if (!('WebSocket' in window)) {
        result.issues.push('WebSocket not supported');
        result.recommendations.push('Use a modern browser that supports WebSocket');
        result.score = 0;
        return result;
      }

      // Test WebSocket connection (mock test)
      const testWs = new WebSocket('wss://echo.websocket.org/');

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          testWs.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close();
          resolve(true);
        };

        testWs.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

      result.passed = true;
      result.score = 100;
      result.performance.loadTime = performance.now() - startTime;

    } catch (error) {
      result.issues.push(`WebSocket connection failed: ${error}`);
      result.recommendations.push('Check network connectivity and firewall settings');
      result.score = 50; // Partial support
    }

    return result;
  }

  private async testPerformanceAPIs(): Promise<CrossBrowserTestResult> {
    const startTime = performance.now();
    const browserInfo = browserCompatibility.getBrowserInfo();

    const result: CrossBrowserTestResult = {
      testName: 'Performance APIs',
      browser: browserInfo?.name || 'Unknown',
      version: browserInfo?.version || 'Unknown',
      passed: false,
      score: 0,
      issues: [],
      recommendations: [],
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
      },
    };

    let score = 0;
    const maxScore = 100;
    const apiTests = [
      { name: 'Performance.now()', test: () => typeof performance.now === 'function', weight: 20 },
      { name: 'PerformanceObserver', test: () => 'PerformanceObserver' in window, weight: 25 },
      { name: 'Performance.memory', test: () => !!(performance as any).memory, weight: 15 },
      { name: 'Performance.timing', test: () => !!performance.timing, weight: 20 },
      { name: 'Performance.getEntries()', test: () => typeof performance.getEntries === 'function', weight: 20 },
    ];

    apiTests.forEach(apiTest => {
      try {
        if (apiTest.test()) {
          score += apiTest.weight;
        } else {
          result.issues.push(`${apiTest.name} not supported`);
        }
      } catch (error) {
        result.issues.push(`${apiTest.name} test failed: ${error}`);
      }
    });

    result.score = score;
    result.passed = score >= 70; // Require 70% of APIs to pass
    result.performance.loadTime = performance.now() - startTime;

    if (!result.passed) {
      result.recommendations.push('Update browser for better performance monitoring support');
    }

    return result;
  }

  private async testStorageAPIs(): Promise<CrossBrowserTestResult> {
    const startTime = performance.now();
    const browserInfo = browserCompatibility.getBrowserInfo();

    const result: CrossBrowserTestResult = {
      testName: 'Storage APIs',
      browser: browserInfo?.name || 'Unknown',
      version: browserInfo?.version || 'Unknown',
      passed: false,
      score: 0,
      issues: [],
      recommendations: [],
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
      },
    };

    let score = 0;
    const storageTests = [
      {
        name: 'localStorage',
        test: () => {
          const testKey = 'cross-browser-test';
          localStorage.setItem(testKey, 'test');
          const value = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          return value === 'test';
        },
        weight: 40,
      },
      {
        name: 'sessionStorage',
        test: () => {
          const testKey = 'cross-browser-test';
          sessionStorage.setItem(testKey, 'test');
          const value = sessionStorage.getItem(testKey);
          sessionStorage.removeItem(testKey);
          return value === 'test';
        },
        weight: 30,
      },
      {
        name: 'IndexedDB',
        test: () => 'indexedDB' in window,
        weight: 30,
      },
    ];

    for (const storageTest of storageTests) {
      try {
        if (storageTest.test()) {
          score += storageTest.weight;
        } else {
          result.issues.push(`${storageTest.name} not working`);
        }
      } catch (error) {
        result.issues.push(`${storageTest.name} test failed: ${error}`);
      }
    }

    result.score = score;
    result.passed = score >= 70; // Require localStorage + one other
    result.performance.loadTime = performance.now() - startTime;

    if (!result.passed) {
      result.recommendations.push('Enable cookies and storage in browser settings');
    }

    return result;
  }

  private async testCSSFeatures(): Promise<CrossBrowserTestResult> {
    const startTime = performance.now();
    const browserInfo = browserCompatibility.getBrowserInfo();

    const result: CrossBrowserTestResult = {
      testName: 'CSS Features',
      browser: browserInfo?.name || 'Unknown',
      version: browserInfo?.version || 'Unknown',
      passed: false,
      score: 0,
      issues: [],
      recommendations: [],
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
      },
    };

    let score = 0;
    const testElement = document.createElement('div');
    document.body.appendChild(testElement);

    const cssTests = [
      {
        name: 'CSS Grid',
        test: () => {
          testElement.style.display = 'grid';
          return testElement.style.display === 'grid';
        },
        weight: 25,
      },
      {
        name: 'CSS Flexbox',
        test: () => {
          testElement.style.display = 'flex';
          return testElement.style.display === 'flex';
        },
        weight: 25,
      },
      {
        name: 'CSS Custom Properties',
        test: () => {
          testElement.style.setProperty('--test-var', 'test');
          return testElement.style.getPropertyValue('--test-var') === 'test';
        },
        weight: 20,
      },
      {
        name: 'CSS Transforms',
        test: () => {
          testElement.style.transform = 'translateX(10px)';
          return testElement.style.transform.includes('translateX');
        },
        weight: 15,
      },
      {
        name: 'CSS Transitions',
        test: () => {
          testElement.style.transition = 'opacity 0.3s';
          return testElement.style.transition.includes('opacity');
        },
        weight: 15,
      },
    ];

    cssTests.forEach(cssTest => {
      try {
        if (cssTest.test()) {
          score += cssTest.weight;
        } else {
          result.issues.push(`${cssTest.name} not supported`);
        }
      } catch (error) {
        result.issues.push(`${cssTest.name} test failed: ${error}`);
      }
    });

    document.body.removeChild(testElement);

    result.score = score;
    result.passed = score >= 60; // Require basic CSS support
    result.performance.loadTime = performance.now() - startTime;

    if (!result.passed) {
      result.recommendations.push('Update browser for better CSS support');
    }

    return result;
  }

  private async testJavaScriptFeatures(): Promise<CrossBrowserTestResult> {
    const startTime = performance.now();
    const browserInfo = browserCompatibility.getBrowserInfo();

    const result: CrossBrowserTestResult = {
      testName: 'JavaScript Features',
      browser: browserInfo?.name || 'Unknown',
      version: browserInfo?.version || 'Unknown',
      passed: false,
      score: 0,
      issues: [],
      recommendations: [],
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
      },
    };

    let score = 0;
    const jsTests = [
      {
        name: 'ES6 Classes',
        test: () => {
          try {
            eval('class TestClass {}');
            return true;
          } catch {
            return false;
          }
        },
        weight: 20,
      },
      {
        name: 'Arrow Functions',
        test: () => {
          try {
            eval('const test = () => true');
            return true;
          } catch {
            return false;
          }
        },
        weight: 15,
      },
      {
        name: 'Promises',
        test: () => typeof Promise !== 'undefined',
        weight: 25,
      },
      {
        name: 'Async/Await',
        test: () => {
          try {
            eval('async function test() { await Promise.resolve(); }');
            return true;
          } catch {
            return false;
          }
        },
        weight: 20,
      },
      {
        name: 'Modules',
        test: () => typeof Symbol !== 'undefined',
        weight: 10,
      },
      {
        name: 'Map/Set',
        test: () => typeof Map !== 'undefined' && typeof Set !== 'undefined',
        weight: 10,
      },
    ];

    jsTests.forEach(jsTest => {
      try {
        if (jsTest.test()) {
          score += jsTest.weight;
        } else {
          result.issues.push(`${jsTest.name} not supported`);
        }
      } catch (error) {
        result.issues.push(`${jsTest.name} test failed: ${error}`);
      }
    });

    result.score = score;
    result.passed = score >= 80; // Require modern JS features
    result.performance.loadTime = performance.now() - startTime;

    if (!result.passed) {
      result.recommendations.push('Update browser for modern JavaScript support');
    }

    return result;
  }

  private async testMediaAPIs(): Promise<CrossBrowserTestResult> {
    const startTime = performance.now();
    const browserInfo = browserCompatibility.getBrowserInfo();

    const result: CrossBrowserTestResult = {
      testName: 'Media APIs',
      browser: browserInfo?.name || 'Unknown',
      version: browserInfo?.version || 'Unknown',
      passed: false,
      score: 0,
      issues: [],
      recommendations: [],
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
      },
    };

    let score = 0;
    const mediaTests = [
      {
        name: 'getUserMedia',
        test: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        weight: 40,
      },
      {
        name: 'WebRTC',
        test: () => 'RTCPeerConnection' in window,
        weight: 30,
      },
      {
        name: 'Web Audio API',
        test: () => 'AudioContext' in window || 'webkitAudioContext' in window,
        weight: 20,
      },
      {
        name: 'Canvas',
        test: () => {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext && canvas.getContext('2d'));
        },
        weight: 10,
      },
    ];

    mediaTests.forEach(mediaTest => {
      try {
        if (mediaTest.test()) {
          score += mediaTest.weight;
        } else {
          result.issues.push(`${mediaTest.name} not supported`);
        }
      } catch (error) {
        result.issues.push(`${mediaTest.name} test failed: ${error}`);
      }
    });

    result.score = score;
    result.passed = score >= 40; // At least getUserMedia for gesture control
    result.performance.loadTime = performance.now() - startTime;

    if (!result.passed) {
      result.recommendations.push('Enable camera permissions for gesture control');
    }

    return result;
  }

  // Public API
  async runCrossBrowserTests(): Promise<CrossBrowserReport> {
    const startTime = performance.now();

    try {
      // Run all tests
      const testResults = await Promise.all([
        this.testWebSocketSupport(),
        this.testPerformanceAPIs(),
        this.testStorageAPIs(),
        this.testCSSFeatures(),
        this.testJavaScriptFeatures(),
        this.testMediaAPIs(),
      ]);

      this.testResults = testResults;

      // Calculate overall score
      const overallScore = testResults.reduce((sum, result) => sum + result.score, 0) / testResults.length;

      // Get browser info and compatibility issues
      const browserInfo = browserCompatibility.getBrowserInfo()!;
      const criticalIssues = browserCompatibility.getCompatibilityIssues()
        .filter(issue => issue.severity === 'error');

      // Determine support level
      let supportLevel: CrossBrowserReport['supportLevel'] = 'full';
      if (overallScore < 50 || criticalIssues.length > 0) {
        supportLevel = 'unsupported';
      } else if (overallScore < 70) {
        supportLevel = 'limited';
      } else if (overallScore < 90) {
        supportLevel = 'partial';
      }

      // Generate recommendations
      const recommendations = this.generateCrossBrowserRecommendations(testResults, criticalIssues);

      const report: CrossBrowserReport = {
        timestamp: new Date().toISOString(),
        overallScore,
        browserInfo,
        testResults,
        criticalIssues,
        recommendations,
        supportLevel,
      };

      // Log performance
      const totalTime = performance.now() - startTime;
      this.performanceMonitor.recordInteractionLatency(totalTime);

      return report;

    } catch (error) {
      this.errorLogger.logError(error as Error, 'cross-browser-testing');
      throw error;
    }
  }

  private generateCrossBrowserRecommendations(
    testResults: CrossBrowserTestResult[],
    criticalIssues: CompatibilityIssue[]
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical compatibility issues`);
    }

    // Test-specific recommendations
    testResults.forEach(result => {
      if (!result.passed) {
        recommendations.push(...result.recommendations);
      }
    });

    // Browser-specific recommendations
    const browserInfo = browserCompatibility.getBrowserInfo();
    if (browserInfo) {
      const { name, version } = browserInfo;
      const versionNum = parseInt(version);

      if (name === 'Chrome' && versionNum < 90) {
        recommendations.push('Update Chrome to version 90+ for optimal performance');
      }
      if (name === 'Firefox' && versionNum < 85) {
        recommendations.push('Update Firefox to version 85+ for optimal performance');
      }
      if (name === 'Safari' && versionNum < 14) {
        recommendations.push('Update Safari to version 14+ for optimal performance');
      }
      if (name === 'Edge' && versionNum < 90) {
        recommendations.push('Update Edge to version 90+ for optimal performance');
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Your browser is fully compatible with the Gesture Control Platform');
    } else {
      recommendations.push('Contact support if issues persist after following recommendations');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Utility methods
  getTestResults(): CrossBrowserTestResult[] {
    return [...this.testResults];
  }

  logCrossBrowserReport(report: CrossBrowserReport): void {
    console.group('🌐 Cross-Browser Compatibility Report');
    console.log(`Overall Score: ${report.overallScore.toFixed(1)}/100`);
    console.log(`Support Level: ${report.supportLevel.toUpperCase()}`);
    console.log(`Browser: ${report.browserInfo.name} ${report.browserInfo.version}`);
    console.log(`Platform: ${report.browserInfo.platform}`);

    console.group('Test Results');
    report.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.score}/100`);
      if (result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.join(', ')}`);
      }
    });
    console.groupEnd();

    if (report.criticalIssues.length > 0) {
      console.group('Critical Issues');
      report.criticalIssues.forEach(issue => {
        console.log(`🚨 ${issue.feature}: ${issue.message}`);
      });
      console.groupEnd();
    }

    if (report.recommendations.length > 0) {
      console.group('Recommendations');
      report.recommendations.forEach(rec => console.log(`💡 ${rec}`));
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const crossBrowserTester = CrossBrowserTester.getInstance();

// React hook for cross-browser testing
export function useCrossBrowserTesting() {
  const [report, setReport] = React.useState<CrossBrowserReport | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  const runTests = React.useCallback(async () => {
    setIsRunning(true);
    try {
      const testReport = await crossBrowserTester.runCrossBrowserTests();
      setReport(testReport);

      // Log report in development
      if (import.meta.env.MODE === 'development') {
        crossBrowserTester.logCrossBrowserReport(testReport);
      }
    } catch (error) {
      console.error('Cross-browser tests failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  React.useEffect(() => {
    // Run tests on mount with delay
    const timer = setTimeout(runTests, 1000);
    return () => clearTimeout(timer);
  }, [runTests]);

  return {
    report,
    isRunning,
    runTests,
    isSupported: report?.supportLevel !== 'unsupported',
    supportLevel: report?.supportLevel || 'unknown',
  };
}

export default crossBrowserTester;