/**
 * Performance Testing Suite
 * Tests performance requirements and optimization
 * Requirements: 7.1, 7.2, 7.5 - Performance optimization
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GlobalProvider } from '../context/GlobalContext';
import { ProjectProvider } from '../context/ProjectContext';

// Import components for performance testing
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { AsyncLoadingWrapper } from '../components/ui/AsyncLoadingStates';
import MainLayout from '../components/layout/MainLayout';

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <GlobalProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </GlobalProvider>
  </BrowserRouter>
);

// Performance measurement utilities
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  await act(async () => {
    renderFn();
  });
  const end = performance.now();
  return end - start;
};

const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

describe('Performance Testing', () => {
  describe('Component Render Performance', () => {
    it('should render Button component within performance budget', async () => {
      const renderTime = await measureRenderTime(() => {
        render(
          <TestWrapper>
            <Button>Test Button</Button>
          </TestWrapper>
        );
      });

      // Button should render in less than 16ms (60fps budget)
      expect(renderTime).toBeLessThan(16);
    });

    it('should render multiple buttons efficiently', async () => {
      const renderTime = await measureRenderTime(() => {
        render(
          <TestWrapper>
            <div>
              {Array.from({ length: 50 }, (_, i) => (
                <Button key={i}>Button {i}</Button>
              ))}
            </div>
          </TestWrapper>
        );
      });

      // 50 buttons should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle loading states efficiently', async () => {
      const renderTime = await measureRenderTime(() => {
        render(
          <TestWrapper>
            <div>
              {Array.from({ length: 10 }, (_, i) => (
                <LoadingSpinner key={i} text={`Loading ${i}`} />
              ))}
            </div>
          </TestWrapper>
        );
      });

      // Multiple loading spinners should render quickly
      expect(renderTime).toBeLessThan(50);
    });

    it('should render complex layout efficiently', async () => {
      const renderTime = await measureRenderTime(() => {
        render(
          <TestWrapper>
            <MainLayout>
              <div>
                <h1>Performance Test</h1>
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i}>
                    <Button>Action {i}</Button>
                    <LoadingSpinner text={`Loading ${i}`} />
                  </div>
                ))}
              </div>
            </MainLayout>
          </TestWrapper>
        );
      });

      // Complex layout should render in reasonable time
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('State Update Performance', () => {
    it('should handle rapid state updates efficiently', async () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(c => c + 1);
          }, 10);
          
          setTimeout(() => clearInterval(interval), 100);
          return () => clearInterval(interval);
        }, []);

        return <div data-testid="counter">{count}</div>;
      };

      const start = performance.now();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for updates to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      const end = performance.now();
      const totalTime = end - start;

      // Rapid updates should not cause performance issues
      expect(totalTime).toBeLessThan(300);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with component mounting/unmounting', async () => {
      const initialMemory = measureMemoryUsage();
      
      // Mount and unmount components multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <div>
              <Button>Test Button {i}</Button>
              <LoadingSpinner text={`Loading ${i}`} />
              <AsyncLoadingWrapper isLoading={true}>
                <div>Content {i}</div>
              </AsyncLoadingWrapper>
            </div>
          </TestWrapper>
        );
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
        
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = measureMemoryUsage();
      
      // Memory usage should not increase significantly
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be less than 50%
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });
  });

  describe('Animation Performance', () => {
    it('should handle CSS animations efficiently', async () => {
      const AnimatedComponent = () => {
        const [animate, setAnimate] = React.useState(false);
        
        React.useEffect(() => {
          setAnimate(true);
        }, []);

        return (
          <div 
            style={{
              transition: 'transform 0.3s ease',
              transform: animate ? 'translateX(100px)' : 'translateX(0)',
            }}
            data-testid="animated-element"
          >
            Animated Content
          </div>
        );
      };

      const start = performance.now();
      
      render(
        <TestWrapper>
          <AnimatedComponent />
        </TestWrapper>
      );

      // Wait for animation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      const end = performance.now();
      const totalTime = end - start;

      // Animation should not block the main thread excessively
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should lazy load components efficiently', async () => {
      // Simulate lazy loading
      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => <div data-testid="lazy-content">Lazy Loaded Content</div>
        })
      );

      const start = performance.now();
      
      render(
        <TestWrapper>
          <React.Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <LazyComponent />
          </React.Suspense>
        </TestWrapper>
      );

      // Wait for lazy component to load
      await screen.findByTestId('lazy-content');
      
      const end = performance.now();
      const loadTime = end - start;

      // Lazy loading should be fast
      expect(loadTime).toBeLessThan(100);
    });
  });

  describe('Real-time Data Performance', () => {
    it('should handle frequent data updates efficiently', async () => {
      const DataComponent = () => {
        const [data, setData] = React.useState({ value: 0, timestamp: Date.now() });
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setData({ value: Math.random(), timestamp: Date.now() });
          }, 16); // ~60fps updates
          
          setTimeout(() => clearInterval(interval), 500);
          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="data-display">
            Value: {data.value.toFixed(2)} | Time: {data.timestamp}
          </div>
        );
      };

      const start = performance.now();
      
      render(
        <TestWrapper>
          <DataComponent />
        </TestWrapper>
      );

      // Wait for updates to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const end = performance.now();
      const totalTime = end - start;

      // High-frequency updates should not cause performance issues
      expect(totalTime).toBeLessThan(800);
    });
  });

  describe('Responsive Design Performance', () => {
    it('should handle viewport changes efficiently', async () => {
      const ResponsiveComponent = () => {
        const [width, setWidth] = React.useState(window.innerWidth);
        
        React.useEffect(() => {
          const handleResize = () => setWidth(window.innerWidth);
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
        }, []);

        return (
          <div data-testid="responsive-element">
            Width: {width}px
          </div>
        );
      };

      const start = performance.now();
      
      render(
        <TestWrapper>
          <ResponsiveComponent />
        </TestWrapper>
      );

      // Simulate viewport changes
      await act(async () => {
        // Simulate multiple resize events
        for (let i = 0; i < 5; i++) {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 800 + i * 100,
          });
          window.dispatchEvent(new Event('resize'));
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });

      const end = performance.now();
      const totalTime = end - start;

      // Responsive updates should be fast
      expect(totalTime).toBeLessThan(200);
    });
  });
});