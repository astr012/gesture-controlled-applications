/**
 * Comprehensive Accessibility Testing
 * Tests WCAG 2.1 AA compliance across all components
 * Requirements: 5.3 - Accessibility compliance
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { GlobalProvider } from '../context/GlobalContext';
import { ProjectProvider } from '../context/ProjectContext';

// Import components to test
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatusIndicator from '../components/ui/StatusIndicator';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MainLayout from '../components/layout/MainLayout';
import ConnectionStatus from '../components/ConnectionStatus/ConnectionStatus';
import { AsyncLoadingWrapper, WebSocketLoading, ProjectLoading, CameraLoading } from '../components/ui/AsyncLoadingStates';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

describe('Accessibility Testing', () => {
  describe('UI Components', () => {
    it('Button component should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="danger" disabled>Disabled Button</Button>
            <Button loading>Loading Button</Button>
            <Button icon="🚀">Button with Icon</Button>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Card component should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <Card>
              <h2>Card Title</h2>
              <p>Card content with proper heading hierarchy</p>
            </Card>
            <Card variant="elevated" hoverable>
              <h3>Elevated Card</h3>
              <p>This card has hover effects</p>
            </Card>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('StatusIndicator component should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <StatusIndicator status="connected" showText />
            <StatusIndicator status="connecting" pulse />
            <StatusIndicator status="error" showText />
            <StatusIndicator status="success" size="lg" showText />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('LoadingSpinner component should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <LoadingSpinner text="Loading content..." />
            <LoadingSpinner variant="dots" size="lg" />
            <LoadingSpinner variant="pulse" />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ErrorBoundary component should have no accessibility violations', async () => {
      // Test the error state UI
      const { container } = render(
        <TestWrapper>
          <ErrorBoundary fallback={
            <div role="alert">
              <h2>Something went wrong</h2>
              <p>An error occurred while loading this component.</p>
              <button>Try Again</button>
            </div>
          }>
            <div>Normal content</div>
          </ErrorBoundary>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Layout Components', () => {
    it('Header component should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <Header 
            connectionStatus={{
              connected: true,
              reconnecting: false,
              quality: { status: 'excellent', score: 95, factors: { latency: 10, stability: 98, throughput: 100 } },
              latency: 10,
              uptime: 3600
            }}
            onToggleSidebar={() => {}}
            sidebarCollapsed={false}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Sidebar component should have no accessibility violations', async () => {
      const mockProjects = [
        {
          id: 'finger_count' as const,
          name: 'Finger Count',
          description: 'Count fingers in real-time',
          icon: '✋',
          category: 'basic' as const,
          loader: () => Promise.resolve({} as any),
          enabled: true,
          version: '1.0.0'
        }
      ];

      const { container } = render(
        <TestWrapper>
          <Sidebar
            collapsed={false}
            currentProject="finger_count"
            onProjectSelect={() => {}}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('MainLayout component should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <MainLayout>
            <main>
              <h1>Main Content</h1>
              <p>This is the main content area</p>
            </main>
          </MainLayout>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Connection Components', () => {
    it('ConnectionStatus component should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <ConnectionStatus
            status={{
              connected: true,
              reconnecting: false,
              quality: { status: 'excellent', score: 95, factors: { latency: 10, stability: 98, throughput: 100 } },
              latency: 10,
              uptime: 3600
            }}
            showDetails={true}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Async Loading Components', () => {
    it('AsyncLoadingWrapper should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <AsyncLoadingWrapper isLoading={true} loadingText="Loading data...">
              <div>Content</div>
            </AsyncLoadingWrapper>
            <AsyncLoadingWrapper isLoading={false} error={new Error('Test error')} retryAction={() => {}}>
              <div>Content</div>
            </AsyncLoadingWrapper>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('WebSocketLoading should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <WebSocketLoading connectionStatus="connecting" />
            <WebSocketLoading connectionStatus="reconnecting" onRetry={() => {}} />
            <WebSocketLoading connectionStatus="error" onRetry={() => {}} />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ProjectLoading should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <ProjectLoading stage="discovering" />
            <ProjectLoading stage="loading" projectName="Test Project" progress={50} />
            <ProjectLoading stage="error" error="Failed to load" onRetry={() => {}} />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('CameraLoading should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <CameraLoading stage="requesting" onRequestPermission={() => {}} />
            <CameraLoading stage="initializing" />
            <CameraLoading stage="denied" onRetry={() => {}} />
            <CameraLoading stage="error" onRetry={() => {}} />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for interactive elements', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <Button disabled>Disabled Button</Button>
            <input type="text" placeholder="Text input" />
            <select>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </TestWrapper>
      );

      // Check that interactive elements are focusable
      const buttons = container.querySelectorAll('button:not([disabled])');
      const inputs = container.querySelectorAll('input, select');
      
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });

      inputs.forEach(input => {
        expect(input).not.toHaveAttribute('tabindex', '-1');
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG AA color contrast requirements', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="danger">Danger Button</Button>
            <StatusIndicator status="connected" showText />
            <StatusIndicator status="error" showText />
            <StatusIndicator status="warning" showText />
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper ARIA labels and roles', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <StatusIndicator status="connected" showText />
            <LoadingSpinner text="Loading..." />
            <div role="alert">Error message</div>
            <nav aria-label="Main navigation">
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#projects">Projects</a></li>
              </ul>
            </nav>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'aria-roles': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-required-attr': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });
});