/**
 * AsyncLoadingStates Component Tests
 * Tests the async loading state components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  AsyncLoadingWrapper, 
  WebSocketLoading, 
  ProjectLoading, 
  CameraLoading,
  Skeleton 
} from '../AsyncLoadingStates';

describe('AsyncLoadingWrapper', () => {
  it('renders children when not loading and no error', () => {
    render(
      <AsyncLoadingWrapper isLoading={false}>
        <div>Content loaded</div>
      </AsyncLoadingWrapper>
    );

    expect(screen.getByText('Content loaded')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(
      <AsyncLoadingWrapper isLoading={true} loadingText="Loading data...">
        <div>Content</div>
      </AsyncLoadingWrapper>
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows error state when error is present', () => {
    const error = new Error('Something went wrong');
    const retryAction = jest.fn();

    render(
      <AsyncLoadingWrapper 
        isLoading={false} 
        error={error} 
        retryAction={retryAction}
      >
        <div>Content</div>
      </AsyncLoadingWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));
    expect(retryAction).toHaveBeenCalledTimes(1);
  });

  it('uses custom loading component when provided', () => {
    const customLoading = <div>Custom loading...</div>;

    render(
      <AsyncLoadingWrapper 
        isLoading={true} 
        loadingComponent={customLoading}
      >
        <div>Content</div>
      </AsyncLoadingWrapper>
    );

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('uses custom error component when provided', () => {
    const error = new Error('Test error');
    const customError = <div>Custom error display</div>;

    render(
      <AsyncLoadingWrapper 
        isLoading={false} 
        error={error} 
        errorComponent={customError}
      >
        <div>Content</div>
      </AsyncLoadingWrapper>
    );

    expect(screen.getByText('Custom error display')).toBeInTheDocument();
  });
});

describe('WebSocketLoading', () => {
  it('shows connecting state', () => {
    render(<WebSocketLoading connectionStatus="connecting" />);

    expect(screen.getByText('Connecting to Server')).toBeInTheDocument();
    expect(screen.getByText('Establishing WebSocket connection...')).toBeInTheDocument();
  });

  it('shows reconnecting state with retry button', () => {
    const onRetry = jest.fn();

    render(
      <WebSocketLoading 
        connectionStatus="reconnecting" 
        onRetry={onRetry} 
      />
    );

    expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    expect(screen.getByText('Retry Connection')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Retry Connection'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows error state', () => {
    render(<WebSocketLoading connectionStatus="error" />);

    expect(screen.getByText('Connection Failed')).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to the gesture control server.')).toBeInTheDocument();
  });

  it('shows connection details when enabled', () => {
    render(
      <WebSocketLoading 
        connectionStatus="connecting" 
        showDetails={true} 
      />
    );

    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Server:')).toBeInTheDocument();
    expect(screen.getByText('ws://localhost:8000/ws/gestures')).toBeInTheDocument();
  });

  it('returns null for connected status', () => {
    const { container } = render(
      <WebSocketLoading connectionStatus="connected" />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('ProjectLoading', () => {
  it('shows discovering stage', () => {
    render(<ProjectLoading stage="discovering" />);

    expect(screen.getByText('Discovering Projects')).toBeInTheDocument();
    expect(screen.getByText('Scanning for available gesture projects...')).toBeInTheDocument();
  });

  it('shows loading stage with project name', () => {
    render(
      <ProjectLoading 
        stage="loading" 
        projectName="Finger Count" 
      />
    );

    expect(screen.getByText('Loading Finger Count')).toBeInTheDocument();
    expect(screen.getByText('Downloading project components...')).toBeInTheDocument();
  });

  it('shows error stage with retry button', () => {
    const onRetry = jest.fn();

    render(
      <ProjectLoading 
        stage="error" 
        error="Failed to load project" 
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Loading Failed')).toBeInTheDocument();
    expect(screen.getByText('Failed to load project')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows progress bar when progress is provided', () => {
    render(
      <ProjectLoading 
        stage="loading" 
        progress={50} 
      />
    );

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();
  });

  it('returns null for ready stage', () => {
    const { container } = render(
      <ProjectLoading stage="ready" />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('CameraLoading', () => {
  it('shows requesting stage', () => {
    const onRequestPermission = jest.fn();

    render(
      <CameraLoading 
        stage="requesting" 
        onRequestPermission={onRequestPermission}
      />
    );

    expect(screen.getByText('Camera Access Required')).toBeInTheDocument();
    expect(screen.getByText('Grant Permission')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Grant Permission'));
    expect(onRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('shows initializing stage', () => {
    render(<CameraLoading stage="initializing" />);

    expect(screen.getByText('Initializing Camera')).toBeInTheDocument();
    expect(screen.getByText('Setting up camera for gesture detection...')).toBeInTheDocument();
  });

  it('shows denied stage with retry', () => {
    const onRetry = jest.fn();

    render(
      <CameraLoading 
        stage="denied" 
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Camera Access Denied')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows error stage', () => {
    render(<CameraLoading stage="error" />);

    expect(screen.getByText('Camera Error')).toBeInTheDocument();
    expect(screen.getByText('Unable to access camera. Please check your camera connection.')).toBeInTheDocument();
  });

  it('returns null for ready stage', () => {
    const { container } = render(
      <CameraLoading stage="ready" />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('Skeleton', () => {
  it('renders single skeleton line by default', () => {
    const { container } = render(<Skeleton />);

    const skeletonLines = container.querySelectorAll('.skeletonLine');
    expect(skeletonLines).toHaveLength(1);
  });

  it('renders multiple skeleton lines when specified', () => {
    const { container } = render(<Skeleton lines={3} />);

    const skeletonLines = container.querySelectorAll('.skeletonLine');
    expect(skeletonLines).toHaveLength(3);
  });

  it('applies custom width and height', () => {
    const { container } = render(
      <Skeleton width="200px" height="20px" />
    );

    const skeletonLine = container.querySelector('.skeletonLine');
    expect(skeletonLine).toHaveStyle({
      width: '200px',
      height: '20px',
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <Skeleton className="custom-skeleton" />
    );

    expect(container.firstChild).toHaveClass('custom-skeleton');
  });
});