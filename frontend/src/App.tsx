import { RouterProvider } from 'react-router-dom';
import { GlobalProvider } from '@/context/GlobalContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import router from '@/routes';
import AppErrorBoundary from '@/components/ui/AppErrorBoundary';
import DebugToggle from '@/components/debug/DebugToggle';
import ErrorLoggingService from '@/services/ErrorLoggingService';
import PerformanceMonitor from '@/services/PerformanceMonitor';
import { browserCompatibility } from '@/utils/browserCompatibility';
import { integrationValidator } from '@/utils/integrationValidator';
import { bundleAnalyzer } from '@/utils/bundleAnalyzer';
import '@/styles/globals.css';
import { useEffect, Suspense } from 'react';

// Initialize services
const errorLogger = ErrorLoggingService.getInstance();
const performanceMonitor = PerformanceMonitor.getInstance();

// Enhanced loading component with performance tracking
const AppLoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '3px solid rgba(255,255,255,0.3)',
      borderTop: '3px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }} />
    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '600' }}>
      Gesture Control Platform
    </h2>
    <p style={{ margin: 0, opacity: 0.8, fontSize: '16px' }}>
      Initializing performance monitoring...
    </p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);


function App() {
  useEffect(() => {
    const initializeApp = async () => {
      const startTime = performance.now();

      try {
        // Initialize performance monitoring
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Initializing Gesture Control Platform...');

          // Log initial metrics after app loads
          setTimeout(() => {
            const metrics = performanceMonitor.getMetrics();
            console.log('📊 Initial Performance Metrics:', metrics);
          }, 2000);
        }

        // Initialize browser compatibility checking
        const compatibilityIssues = browserCompatibility.getCompatibilityIssues();
        const criticalIssues = compatibilityIssues.filter(issue => issue.severity === 'error');

        if (criticalIssues.length > 0) {
          console.error('🚨 Critical browser compatibility issues detected:', criticalIssues);
          errorLogger.logError(
            new Error(`Browser compatibility issues: ${criticalIssues.map(i => i.feature).join(', ')}`),
            'browser-compatibility'
          );

          // Show compatibility warning to user
          if (window.confirm(
            `Your browser has compatibility issues that may affect the application. ` +
            `Critical issues: ${criticalIssues.map(i => i.feature).join(', ')}. ` +
            `Would you like to continue anyway?`
          )) {
            console.warn('User chose to continue despite compatibility issues');
          }
        }

        // Load polyfills if needed
        await browserCompatibility.loadPolyfills();

        // Run integration tests in development
        if (process.env.NODE_ENV === 'development') {
          setTimeout(async () => {
            console.log('🔧 Running integration tests...');
            const report = await integrationValidator.runIntegrationTests();
            integrationValidator.logIntegrationReport(report);

            if (report.overallStatus === 'fail') {
              console.error('❌ Integration tests failed. Some features may not work correctly.');
            } else if (report.overallStatus === 'warning') {
              console.warn('⚠️ Integration tests completed with warnings.');
            } else {
              console.log('✅ All integration tests passed.');
            }
          }, 3000);

          // Run bundle analysis
          setTimeout(() => {
            console.log('📦 Analyzing bundle performance...');
            bundleAnalyzer.logBundleAnalysis();
          }, 4000);
        }

        // Track app initialization time
        const initTime = performance.now() - startTime;
        performanceMonitor.recordInteractionLatency(initTime);

        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ App initialized in ${initTime.toFixed(2)}ms`);
        }

        // Set up performance monitoring intervals
        if (process.env.NODE_ENV === 'development') {
          // Log performance metrics every 30 seconds
          setInterval(() => {
            const metrics = performanceMonitor.getMetrics();
            const score = performanceMonitor.calculatePerformanceScore();

            if (score < 70) {
              console.warn(`⚠️ Performance score dropped to ${score}/100`);
            }
          }, 30000);
        }

        // Set up memory monitoring
        if ((performance as any).memory) {
          setInterval(() => {
            const memory = (performance as any).memory;
            const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

            if (usagePercent > 80) {
              console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(1)}%`);
              errorLogger.logError(
                new Error(`High memory usage: ${usagePercent.toFixed(1)}%`),
                'memory-warning'
              );
            }
          }, 60000); // Check every minute
        }

        // Set up error tracking for unhandled errors
        window.addEventListener('error', (event) => {
          errorLogger.logError(event.error, 'unhandled-error', {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
          performanceMonitor.recordError();
        });

        window.addEventListener('unhandledrejection', (event) => {
          errorLogger.logError(
            new Error(`Unhandled promise rejection: ${event.reason}`),
            'unhandled-promise-rejection'
          );
          performanceMonitor.recordError();
        });

      } catch (error) {
        console.error('❌ App initialization failed:', error);
        errorLogger.logError(error as Error, 'app-initialization');
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      performanceMonitor.destroy();
    };
  }, []);

  // Track app render performance
  useEffect(() => {
    const timerId = performanceMonitor.startComponentRender('App');
    return () => {
      performanceMonitor.endComponentRender(timerId, 'App');
    };
  });

  return (
    <AppErrorBoundary>
      <Suspense fallback={<AppLoadingFallback />}>
        <WebSocketProvider>
          <GlobalProvider>
            <ProjectProvider>
              <RouterProvider router={router} />
              <DebugToggle />
            </ProjectProvider>
          </GlobalProvider>
        </WebSocketProvider>
      </Suspense>
    </AppErrorBoundary>
  );
}

export default App;
