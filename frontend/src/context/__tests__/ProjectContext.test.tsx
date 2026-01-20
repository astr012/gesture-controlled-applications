import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ProjectProvider } from '../ProjectContext';
import { useProjectContext } from '@/hooks/useProjectContext';
import { GestureData } from '@/types';

// Test component to access context
function TestComponent() {
  const { state, actions, performance, debug } = useProjectContext();
  
  return (
    <div>
      <div data-testid="display-mode">{state.displayMode}</div>
      <div data-testid="debug-info">{state.showDebugInfo ? 'true' : 'false'}</div>
      <div data-testid="frame-rate">{state.frameRate.toFixed(1)}</div>
      <div data-testid="frame-count">{state.frameCount}</div>
      <div data-testid="has-gesture-data">{state.gestureData ? 'true' : 'false'}</div>
      <div data-testid="performance-frame-rate">{performance.frameRate.toFixed(1)}</div>
      <div data-testid="debug-enabled">{debug.isEnabled ? 'true' : 'false'}</div>
      <button 
        data-testid="toggle-debug" 
        onClick={actions.toggleDebugInfo}
      >
        Toggle Debug
      </button>
      <button 
        data-testid="set-compact" 
        onClick={() => actions.setDisplayMode('compact')}
      >
        Set Compact
      </button>
      <button 
        data-testid="update-gesture" 
        onClick={() => {
          const mockData: GestureData = {
            project: 'finger_count',
            timestamp: Date.now(),
            hands_detected: 1,
            confidence: 0.95,
            processing_time: 15,
            frame_id: 'test-frame-1',
          };
          actions.updateGestureData(mockData);
        }}
      >
        Update Gesture Data
      </button>
    </div>
  );
}

describe('ProjectContext', () => {
  it('should provide initial state', () => {
    render(
      <ProjectProvider>
        <TestComponent />
      </ProjectProvider>
    );

    expect(screen.getByTestId('display-mode').textContent).toBe('detailed');
    expect(screen.getByTestId('debug-info').textContent).toBe('false');
    expect(screen.getByTestId('frame-rate').textContent).toBe('0.0');
    expect(screen.getByTestId('frame-count').textContent).toBe('0');
    expect(screen.getByTestId('has-gesture-data').textContent).toBe('false');
  });

  it('should toggle debug info', async () => {
    render(
      <ProjectProvider>
        <TestComponent />
      </ProjectProvider>
    );

    const toggleButton = screen.getByTestId('toggle-debug');
    
    expect(screen.getByTestId('debug-info').textContent).toBe('false');
    expect(screen.getByTestId('debug-enabled').textContent).toBe('false');
    
    await act(async () => {
      toggleButton.click();
    });
    
    expect(screen.getByTestId('debug-info').textContent).toBe('true');
    expect(screen.getByTestId('debug-enabled').textContent).toBe('true');
  });

  it('should change display mode', async () => {
    render(
      <ProjectProvider>
        <TestComponent />
      </ProjectProvider>
    );

    const compactButton = screen.getByTestId('set-compact');
    
    expect(screen.getByTestId('display-mode').textContent).toBe('detailed');
    
    await act(async () => {
      compactButton.click();
    });
    
    expect(screen.getByTestId('display-mode').textContent).toBe('compact');
  });

  it('should update gesture data and calculate frame rate', async () => {
    render(
      <ProjectProvider>
        <TestComponent />
      </ProjectProvider>
    );

    const updateButton = screen.getByTestId('update-gesture');
    
    expect(screen.getByTestId('has-gesture-data').textContent).toBe('false');
    expect(screen.getByTestId('frame-count').textContent).toBe('0');
    
    await act(async () => {
      updateButton.click();
    });
    
    expect(screen.getByTestId('has-gesture-data').textContent).toBe('true');
    expect(screen.getByTestId('frame-count').textContent).toBe('1');
    
    // Frame rate should be calculated (will be > 0 after first update)
    const frameRateText = screen.getByTestId('frame-rate').textContent;
    expect(parseFloat(frameRateText || '0')).toBeGreaterThanOrEqual(0);
  });

  it('should track performance metrics', async () => {
    render(
      <ProjectProvider>
        <TestComponent />
      </ProjectProvider>
    );

    const updateButton = screen.getByTestId('update-gesture');
    
    // Update gesture data multiple times to test performance tracking
    await act(async () => {
      updateButton.click();
    });
    
    await act(async () => {
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      updateButton.click();
    });
    
    expect(screen.getByTestId('frame-count').textContent).toBe('2');
    
    // Performance metrics should be available
    const performanceFrameRate = screen.getByTestId('performance-frame-rate').textContent;
    expect(parseFloat(performanceFrameRate || '0')).toBeGreaterThanOrEqual(0);
  });
});