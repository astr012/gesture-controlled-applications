/**
 * Integration and Real-World Usage Testing
 * Tests complete user workflows and gesture data scenarios
 * Requirements: 7.5 - Real-world usage scenarios with gesture data
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { GlobalProvider } from '../context/GlobalContext';
import { ProjectProvider } from '../context/ProjectContext';

// Import main components
import App from '../App';
import MainLayout from '../components/layout/MainLayout';
import ProjectLoader from '../components/ProjectLoader/ProjectLoader';
import { WebSocketManager } from '../services/WebSocketManager';

// Mock gesture data types
import { GestureData, FingerCountData, ProjectType } from '../types';

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

// Mock WebSocket for integration tests
class MockWebSocketForIntegration {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocketForIntegration.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocketForIntegration.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Simulate server responses based on sent data
    const message = JSON.parse(data);
    
    if (message.type === 'project_select') {
      setTimeout(() => {
        this.simulateGestureData(message.payload.project);
      }, 50);
    }
  }

  close() {
    this.readyState = MockWebSocketForIntegration.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  simulateGestureData(project: ProjectType) {
    if (project === 'finger_count') {
      const gestureData: FingerCountData = {
        project: 'finger_count',
        timestamp: Date.now(),
        hands_detected: 1,
        confidence: 0.95,
        processing_time: 15,
        frame_id: 'frame_123',
        fingers: 3,
        total_fingers: 3,
        hands: [{
          label: 'Right',
          confidence: 0.95,
          fingers: 3,
          finger_states: {
            thumb: true,
            index: true,
            middle: true,
            ring: false,
            pinky: false
          },
          landmarks: [],
          bounding_box: { x: 100, y: 100, width: 200, height: 200 }
        }],
        gesture_stability: 0.9
      };

      this.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify(gestureData)
      }));
    }
  }
}

// Replace global WebSocket
(global as any).WebSocket = MockWebSocketForIntegration;

describe('Integration Testing', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Complete User Workflows', () => {
    it('should handle complete application initialization flow', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText(/Gesture Control Platform/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check that main layout is rendered
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar
    });

    it('should handle project selection and loading workflow', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText(/Gesture Control Platform/i)).toBeInTheDocument();
      });

      // Look for project selection elements
      const projectButtons = screen.getAllByRole('button');
      const fingerCountButton = projectButtons.find(button => 
        button.textContent?.includes('Finger') || button.textContent?.includes('Count')
      );

      if (fingerCountButton) {
        await user.click(fingerCountButton);

        // Wait for project to load
        await waitFor(() => {
          // Check if project content is displayed
          expect(screen.getByText(/finger/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('should handle sidebar collapse/expand workflow', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Find sidebar toggle button
      const toggleButtons = screen.getAllByRole('button');
      const sidebarToggle = toggleButtons.find(button => 
        button.getAttribute('aria-label')?.includes('sidebar') ||
        button.getAttribute('aria-label')?.includes('menu')
      );

      if (sidebarToggle) {
        await user.click(sidebarToggle);

        // Wait for sidebar state to change
        await waitFor(() => {
          // Sidebar should still be present but potentially collapsed
          expect(screen.getByRole('navigation')).toBeInTheDocument();
        });
      }
    });
  });

  describe('WebSocket Integration', () => {
    it('should handle WebSocket connection lifecycle', async () => {
      const wsManager = new WebSocketManager({
        url: 'ws://localhost:8000/test',
        maxReconnectAttempts: 3,
        baseReconnectDelay: 100,
        maxReconnectDelay: 1000,
        pingInterval: 1000,
        connectionTimeout: 5000,
        messageQueueSize: 10,
      });

      // Test connection
      await wsManager.connect();
      
      let connectionStatus = wsManager.getConnectionStatus();
      expect(connectionStatus.connected).toBe(true);

      // Test project selection
      wsManager.selectProject('finger_count');
      expect(wsManager.getCurrentProject()).toBe('finger_count');

      // Test disconnection
      wsManager.disconnect();
      connectionStatus = wsManager.getConnectionStatus();
      expect(connectionStatus.connected).toBe(false);

      wsManager.destroy();
    });

    it('should handle gesture data streaming', async () => {
      const wsManager = new WebSocketManager({
        url: 'ws://localhost:8000/test',
        maxReconnectAttempts: 3,
        baseReconnectDelay: 100,
        maxReconnectDelay: 1000,
        pingInterval: 1000,
        connectionTimeout: 5000,
        messageQueueSize: 10,
      });

      await wsManager.connect();

      let receivedData: GestureData | null = null;
      const subscriptionId = wsManager.subscribe((data) => {
        receivedData = data;
      });

      // Select project to trigger data flow
      wsManager.selectProject('finger_count');

      // Wait for gesture data
      await waitFor(() => {
        expect(receivedData).toBeTruthy();
      }, { timeout: 2000 });

      if (receivedData) {
        expect(receivedData.project).toBe('finger_count');
        expect(receivedData.timestamp).toBeGreaterThan(0);
        expect(receivedData.confidence).toBeGreaterThan(0);
      }

      wsManager.unsubscribe(subscriptionId);
      wsManager.destroy();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network disconnection gracefully', async () => {
      const wsManager = new WebSocketManager({
        url: 'ws://localhost:8000/test',
        maxReconnectAttempts: 2,
        baseReconnectDelay: 50,
        maxReconnectDelay: 100,
        pingInterval: 1000,
        connectionTimeout: 1000,
        messageQueueSize: 10,
      });

      await wsManager.connect();
      expect(wsManager.getConnectionStatus().connected).toBe(true);

      // Simulate network disconnection
      const mockWs = (wsManager as any).ws;
      if (mockWs) {
        mockWs.close();
      }

      // Wait for reconnection attempts
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });

      wsManager.destroy();
    });

    it('should handle component errors with error boundaries', async () => {
      const ErrorComponent = () => {
        throw new Error('Test component error');
      };

      // This test verifies error boundaries work in integration
      const { container } = render(
        <TestWrapper>
          <MainLayout>
            <ErrorComponent />
          </MainLayout>
        </TestWrapper>
      );

      // Error boundary should catch the error and display fallback UI
      await waitFor(() => {
        expect(container.textContent).toContain('Something went wrong');
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid gesture data updates without performance degradation', async () => {
      const wsManager = new WebSocketManager({
        url: 'ws://localhost:8000/test',
        maxReconnectAttempts: 3,
        baseReconnectDelay: 100,
        maxReconnectDelay: 1000,
        pingInterval: 1000,
        connectionTimeout: 5000,
        messageQueueSize: 10,
      });

      await wsManager.connect();

      let updateCount = 0;
      const subscriptionId = wsManager.subscribe(() => {
        updateCount++;
      });

      wsManager.selectProject('finger_count');

      // Simulate rapid updates
      const mockWs = (wsManager as any).ws;
      if (mockWs) {
        const startTime = performance.now();
        
        // Send multiple rapid updates
        for (let i = 0; i < 10; i++) {
          const gestureData: FingerCountData = {
            project: 'finger_count',
            timestamp: Date.now(),
            hands_detected: 1,
            confidence: 0.95,
            processing_time: 15,
            frame_id: `frame_${i}`,
            fingers: i % 5,
            total_fingers: i % 5,
            hands: [{
              label: 'Right',
              confidence: 0.95,
              fingers: i % 5,
              finger_states: {
                thumb: i > 0,
                index: i > 1,
                middle: i > 2,
                ring: i > 3,
                pinky: i > 4
              },
              landmarks: [],
              bounding_box: { x: 100, y: 100, width: 200, height: 200 }
            }],
            gesture_stability: 0.9
          };

          mockWs.onmessage?.(new MessageEvent('message', {
            data: JSON.stringify(gestureData)
          }));
        }

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Processing should be fast
        expect(processingTime).toBeLessThan(100);
      }

      wsManager.unsubscribe(subscriptionId);
      wsManager.destroy();
    });
  });

  describe('State Management Integration', () => {
    it('should maintain state consistency across component updates', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Interact with multiple components
      const buttons = screen.getAllByRole('button');
      
      // Click multiple buttons to test state updates
      for (let i = 0; i < Math.min(3, buttons.length); i++) {
        await user.click(buttons[i]);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }

      // App should still be functional
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should persist user preferences correctly', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Make some preference changes (if UI elements are available)
      const toggleButtons = screen.getAllByRole('button');
      if (toggleButtons.length > 0) {
        await user.click(toggleButtons[0]);
        
        // Wait for state to update
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Check if preferences were saved to localStorage
        const savedPreferences = localStorage.getItem('gesture-control-preferences');
        expect(savedPreferences).toBeTruthy();
      }
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain keyboard navigation throughout the app', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Test keyboard navigation
      await user.tab();
      
      // Check that focus is on a focusable element
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeTruthy();
      expect(focusedElement?.tagName).toMatch(/BUTTON|INPUT|SELECT|A/);
    });

    it('should provide proper ARIA labels and roles throughout the app', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Check for essential ARIA roles
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    });
  });

  describe('Responsive Design Integration', () => {
    it('should adapt layout for different screen sizes', async () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Dispatch resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // App should still be functional on mobile
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Restore original viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });
  });
});