import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusIndicator from '../StatusIndicator';

// Mock CSS modules
jest.mock('../StatusIndicator.module.css', () => ({
  container: 'container',
  dot: 'dot',
  text: 'text',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  connected: 'connected',
  connecting: 'connecting',
  disconnected: 'disconnected',
  error: 'error',
  idle: 'idle',
  success: 'success',
  warning: 'warning',
  pulse: 'pulse',
}));

describe('StatusIndicator Component', () => {
  it('renders with default props', () => {
    render(<StatusIndicator status="connected" />);
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-label', 'Connection status: Connected');
  });

  it('renders different status types', () => {
    const { rerender } = render(<StatusIndicator status="connected" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Connection status: Connected');

    rerender(<StatusIndicator status="connecting" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Connection status: Connecting');

    rerender(<StatusIndicator status="error" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Connection status: Error');

    rerender(<StatusIndicator status="success" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Success');
  });

  it('shows text when showText is true', () => {
    render(<StatusIndicator status="connected" showText />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('uses custom text when provided', () => {
    render(<StatusIndicator status="connected" showText text="Custom status" />);
    expect(screen.getByText('Custom status')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<StatusIndicator status="connected" size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('sm');

    rerender(<StatusIndicator status="connected" size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('lg');
  });

  it('applies pulse animation when pulse prop is true', () => {
    render(<StatusIndicator status="connecting" pulse />);
    const dot = screen.getByRole('status').querySelector('span');
    expect(dot).toHaveClass('pulse');
  });

  it('applies custom className', () => {
    render(<StatusIndicator status="connected" className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<StatusIndicator status="error" showText />);
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'Connection status: Error');
    
    const dot = indicator.querySelector('span');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });
});