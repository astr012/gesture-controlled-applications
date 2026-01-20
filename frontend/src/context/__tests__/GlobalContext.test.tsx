import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GlobalProvider } from '../GlobalContext';
import { useGlobalContext } from '@/hooks/useGlobalContext';

// Test component to access context
function TestComponent() {
  const { state, actions, debug } = useGlobalContext();
  
  return (
    <div>
      <div data-testid="initialized">{state.isInitialized ? 'true' : 'false'}</div>
      <div data-testid="theme">{state.theme}</div>
      <div data-testid="sidebar">{state.sidebarCollapsed ? 'collapsed' : 'expanded'}</div>
      <div data-testid="debug-enabled">{debug.isEnabled ? 'true' : 'false'}</div>
      <button 
        data-testid="toggle-sidebar" 
        onClick={actions.toggleSidebar}
      >
        Toggle Sidebar
      </button>
      <button 
        data-testid="set-theme" 
        onClick={() => actions.setTheme('dark')}
      >
        Set Dark Theme
      </button>
    </div>
  );
}

describe('GlobalContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should provide initial state', () => {
    render(
      <GlobalProvider>
        <TestComponent />
      </GlobalProvider>
    );

    expect(screen.getByTestId('initialized').textContent).toBe('true');
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('sidebar').textContent).toBe('expanded');
    // Debug mode depends on NODE_ENV, so we just check it exists
    const debugEnabled = screen.getByTestId('debug-enabled').textContent;
    expect(debugEnabled).toMatch(/^(true|false)$/);
  });

  it('should toggle sidebar state', async () => {
    render(
      <GlobalProvider>
        <TestComponent />
      </GlobalProvider>
    );

    const toggleButton = screen.getByTestId('toggle-sidebar');
    
    expect(screen.getByTestId('sidebar').textContent).toBe('expanded');
    
    await act(async () => {
      toggleButton.click();
    });
    
    expect(screen.getByTestId('sidebar').textContent).toBe('collapsed');
  });

  it('should change theme', async () => {
    render(
      <GlobalProvider>
        <TestComponent />
      </GlobalProvider>
    );

    const themeButton = screen.getByTestId('set-theme');
    
    expect(screen.getByTestId('theme').textContent).toBe('light');
    
    await act(async () => {
      themeButton.click();
    });
    
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('should persist preferences to localStorage', async () => {
    render(
      <GlobalProvider>
        <TestComponent />
      </GlobalProvider>
    );

    const toggleButton = screen.getByTestId('toggle-sidebar');
    const themeButton = screen.getByTestId('set-theme');
    
    await act(async () => {
      toggleButton.click();
      themeButton.click();
    });

    // Wait for localStorage to be updated
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const savedPreferences = localStorage.getItem('gesture-control-preferences');
    expect(savedPreferences).toBeTruthy();
    
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      expect(preferences.theme).toBe('dark');
      expect(preferences.sidebarCollapsed).toBe(true);
    }
  });

  it('should load preferences from localStorage', () => {
    // Set preferences in localStorage before rendering
    const preferences = {
      theme: 'dark',
      sidebarCollapsed: true,
      defaultProject: null,
      showDebugInfo: true,
      animationsEnabled: true,
      autoReconnect: true,
    };
    localStorage.setItem('gesture-control-preferences', JSON.stringify(preferences));

    render(
      <GlobalProvider>
        <TestComponent />
      </GlobalProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('sidebar').textContent).toBe('collapsed');
  });
});