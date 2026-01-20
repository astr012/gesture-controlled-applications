import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import RouteErrorBoundary from '@/components/ui/RouteErrorBoundary';
import SuspenseWrapper from '@/components/ui/SuspenseWrapper';
import ProjectLoader from '@/components/ProjectLoader';
import PerformanceMonitor from '@/services/PerformanceMonitor';

// Performance-tracked lazy loading
const createLazyComponent = (importFn: () => Promise<any>, routeName: string) => {
  return lazy(async () => {
    const startTime = performance.now();
    const module = await importFn();

    // Track route load time
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.measureRouteLoad(routeName, startTime);

    return module;
  });
};

// Lazy load page components for code splitting with performance tracking
const Dashboard = createLazyComponent(() => import('@/pages/Dashboard'), 'Dashboard');
const NotFound = createLazyComponent(() => import('@/pages/NotFound'), 'NotFound');

// Route configuration with enhanced code splitting and deep linking
const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <RouteErrorBoundary>
        <MainLayout />
      </RouteErrorBoundary>
    ),
    errorElement: (
      <RouteErrorBoundary>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'white',
          borderRadius: '12px',
          margin: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛣️</div>
          <h2 style={{ color: '#171717', marginBottom: '0.5rem' }}>Route Error</h2>
          <p style={{ color: '#737373', marginBottom: '1.5rem' }}>
            There was an error loading this page. Please try refreshing or go back to the dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#007aff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </RouteErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <Dashboard />
          </SuspenseWrapper>
        ),
      },
      // Project routes with deep linking support
      {
        path: 'project/:projectId',
        element: (
          <SuspenseWrapper>
            <ProjectLoader />
          </SuspenseWrapper>
        ),
      },
      // Friendly URL routes for projects
      {
        path: 'project/finger-count',
        element: (
          <SuspenseWrapper>
            <ProjectLoader />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'project/volume-control',
        element: (
          <SuspenseWrapper>
            <ProjectLoader />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'project/virtual-mouse',
        element: (
          <SuspenseWrapper>
            <ProjectLoader />
          </SuspenseWrapper>
        ),
      },
      // 404 route
      {
        path: '404',
        element: (
          <SuspenseWrapper>
            <NotFound />
          </SuspenseWrapper>
        ),
      },
      // Catch-all route
      {
        path: '*',
        element: (
          <SuspenseWrapper>
            <NotFound />
          </SuspenseWrapper>
        ),
      },
    ],
  },
];

// Create router with enhanced configuration for better performance and SEO
export const router = createBrowserRouter(routes, {
  future: {
    // Enable future flags for better performance and compatibility
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default router;
