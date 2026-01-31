import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import RouteErrorBoundary from '@/components/ui/RouteErrorBoundary';
import SuspenseWrapper from '@/components/ui/SuspenseWrapper';
import ProjectLoader from '@/components/ProjectLoader';
import PerformanceMonitor from '@/services/PerformanceMonitor';
import { AlertTriangle } from 'lucide-react';

// Performance-tracked lazy loading
const createLazyComponent = (
  importFn: () => Promise<any>,
  routeName: string
) => {
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
const Dashboard = createLazyComponent(
  () => import('@/pages/Dashboard'),
  'Dashboard'
);
const NotFound = createLazyComponent(
  () => import('@/pages/NotFound'),
  'NotFound'
);

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
        <div className="flex flex-col items-center justify-center p-8 m-8 bg-white dark:bg-neutral-900 rounded-xl shadow-glass border border-neutral-200 dark:border-neutral-800 text-center">
          <div className="mb-4 text-error-500">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Route Error
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            There was an error loading this page. Please try refreshing or go
            back to the dashboard.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
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
