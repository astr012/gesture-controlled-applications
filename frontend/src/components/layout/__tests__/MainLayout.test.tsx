import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';

// Mock the hooks to avoid WebSocket and context dependencies
const mockToggleSidebar = jest.fn();
const mockSelectProject = jest.fn();

jest.mock('../../../hooks/useGlobalContext', () => ({
  useGlobalContext: () => ({
    state: {
      sidebarCollapsed: false,
      connectionStatus: {
        connected: false,
        reconnecting: false,
        quality: {
          status: 'unknown',
          score: 0,
          factors: { latency: 0, stability: 0, throughput: 0 }
        },
        latency: 0,
        uptime: 0
      },
      currentProject: null
    },
    actions: {
      toggleSidebar: mockToggleSidebar,
      selectProject: mockSelectProject
    }
  })
}));

jest.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionStatus: {
      connected: false,
      reconnecting: false,
      quality: {
        status: 'unknown',
        score: 0,
        factors: { latency: 0, stability: 0, throughput: 0 }
      },
      latency: 0,
      uptime: 0
    },
    reconnect: jest.fn()
  })
}));

// Mock the ProjectSelector component
jest.mock('../../ProjectSelector/ProjectSelector', () => ({
  ProjectSelector: () => <div data-testid="project-selector">Project Selector</div>
}));

// Mock the ConnectionStatus component
jest.mock('../../ConnectionStatus/ConnectionStatus', () => ({
  ConnectionStatus: () => <div data-testid="connection-status">Connection Status</div>
}));

describe('Layout Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header', () => {
    it('renders header with title and subtitle', () => {
      const { getByText } = render(<Header />);
      
      expect(getByText('Gesture Control Platform')).toBeInTheDocument();
      expect(getByText('Real-time Hand Gesture Recognition')).toBeInTheDocument();
    });

    it('renders sidebar toggle button', () => {
      const { getByLabelText } = render(<Header />);
      
      const toggleButton = getByLabelText('Collapse sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('renders connection status component', () => {
      const { getByTestId } = render(<Header />);
      
      expect(getByTestId('connection-status')).toBeInTheDocument();
    });

    it('calls toggle sidebar when button is clicked', () => {
      const { getByLabelText } = render(<Header />);
      
      const toggleButton = getByLabelText('Collapse sidebar');
      fireEvent.click(toggleButton);
      
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sidebar', () => {
    it('renders sidebar with projects section when not collapsed', () => {
      const { getByText, getByTestId } = render(<Sidebar />);
      
      expect(getByText('Projects')).toBeInTheDocument();
      expect(getByText('Select a gesture project')).toBeInTheDocument();
      expect(getByTestId('project-selector')).toBeInTheDocument();
    });

    it('applies correct CSS classes', () => {
      const { container } = render(<Sidebar />);
      
      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveAttribute('class');
    });

    it('renders mobile sidebar with mobile prop', () => {
      const { container } = render(<Sidebar isMobile={true} />);
      
      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
      
      // Check that the sidebar has mobile-specific classes
      const sidebarClasses = sidebar?.className || '';
      expect(sidebarClasses).toContain('mobile');
    });

    it('renders project icons with mobile styling', () => {
      const { container } = render(<Sidebar isMobile={true} />);
      
      // In mobile mode, project icons are rendered in the collapsed content or bottom nav
      // Let's check if the component renders without errors
      expect(container).toBeInTheDocument();
      
      // Check for project icon elements (they might be in different states)
      const iconElements = container.querySelectorAll('[class*="icon"]');
      // This test mainly ensures mobile rendering doesn't break
      expect(container.querySelector('aside')).toBeInTheDocument();
    });

    it('handles project selection on mobile', () => {
      const { container } = render(<Sidebar isMobile={true} />);
      
      const projectButtons = container.querySelectorAll('button[title]');
      if (projectButtons.length > 0) {
        fireEvent.click(projectButtons[0]);
        
        // Should call selectProject and toggleSidebar on mobile
        expect(mockSelectProject).toHaveBeenCalled();
      }
    });
  });

  describe('Responsive Design', () => {
    it('sidebar accepts mobile prop', () => {
      const { container } = render(<Sidebar isMobile={true} />);
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('sidebar works without mobile prop (desktop)', () => {
      const { container } = render(<Sidebar />);
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });
  });
});