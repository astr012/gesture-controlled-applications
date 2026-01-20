/**
 * Tests for the enhanced ConnectionStatus component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionStatus } from '../ConnectionStatus';
import { ConnectionStatus as ConnectionStatusType } from '../../../types/websocket';

describe('ConnectionStatus', () => {
  const mockOnReconnect = jest.fn();

  beforeEach(() => {
    mockOnReconnect.mockClear();
  });

  const createMockStatus = (overrides: Partial<ConnectionStatusType> = {}): ConnectionStatusType => ({
    connected: false,
    reconnecting: false,
    quality: {
      status: 'unknown',
      score: 0,
      factors: {
        latency: 0,
        stability: 0,
        throughput: 0,
      },
    },
    latency: 0,
    uptime: 0,
    ...overrides,
  });

  test('should render disconnected state correctly', () => {
    const status = createMockStatus();
    render(<ConnectionStatus status={status} onReconnect={mockOnReconnect} />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
  });

  test('should render connected state correctly', () => {
    const status = createMockStatus({
      connected: true,
      quality: {
        status: 'good',
        score: 85,
        factors: {
          latency: 50,
          stability: 95,
          throughput: 100,
        },
      },
      latency: 50,
      uptime: 30000,
    });

    render(<ConnectionStatus status={status} onReconnect={mockOnReconnect} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument(); // Quality score
    expect(screen.queryByRole('button', { name: 'Reconnect' })).not.toBeInTheDocument();
  });

  test('should render reconnecting state correctly', () => {
    const status = createMockStatus({
      reconnecting: true,
    });

    render(<ConnectionStatus status={status} onReconnect={mockOnReconnect} />);

    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reconnect' })).not.toBeInTheDocument();
  });

  test('should render error state correctly', () => {
    const status = createMockStatus({
      error: 'Connection failed',
    });

    render(<ConnectionStatus status={status} onReconnect={mockOnReconnect} />);

    expect(screen.getByText('Error: Connection failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
  });

  test('should show detailed information when showDetails is true', () => {
    const status = createMockStatus({
      connected: true,
      quality: {
        status: 'excellent',
        score: 95,
        factors: {
          latency: 25,
          stability: 100,
          throughput: 100,
        },
      },
      latency: 25,
      uptime: 120000, // 2 minutes
    });

    render(<ConnectionStatus status={status} onReconnect={mockOnReconnect} showDetails={true} />);

    expect(screen.getByText('Quality:')).toBeInTheDocument();
    expect(screen.getByText('excellent')).toBeInTheDocument();
    expect(screen.getByText('Latency:')).toBeInTheDocument();
    expect(screen.getByText('25ms')).toBeInTheDocument();
    expect(screen.getByText('Uptime:')).toBeInTheDocument();
    expect(screen.getByText('2m 0s')).toBeInTheDocument();
  });

  test('should not show detailed information when showDetails is false', () => {
    const status = createMockStatus({
      connected: true,
      quality: {
        status: 'good',
        score: 80,
        factors: {
          latency: 50,
          stability: 90,
          throughput: 100,
        },
      },
      latency: 50,
      uptime: 60000,
    });

    render(<ConnectionStatus status={status} onReconnect={mockOnReconnect} showDetails={false} />);

    expect(screen.queryByText('Quality:')).not.toBeInTheDocument();
    expect(screen.queryByText('Latency:')).not.toBeInTheDocument();
    expect(screen.queryByText('Uptime:')).not.toBeInTheDocument();
  });

  test('should call onReconnect when reconnect button is clicked', () => {
    const status = createMockStatus();
    render(<ConnectionStatus status={status} onReconnect={mockOnReconnect} />);

    const reconnectButton = screen.getByRole('button', { name: 'Reconnect' });
    fireEvent.click(reconnectButton);

    expect(mockOnReconnect).toHaveBeenCalledTimes(1);
  });

  test('should format uptime correctly', () => {
    const testCases = [
      { uptime: 500, expected: '< 1s' },
      { uptime: 5000, expected: '5s' },
      { uptime: 65000, expected: '1m 5s' },
      { uptime: 3665000, expected: '1h 1m' },
    ];

    testCases.forEach(({ uptime, expected }) => {
      const status = createMockStatus({
        connected: true,
        uptime,
        quality: {
          status: 'good',
          score: 80,
          factors: { latency: 0, stability: 0, throughput: 0 },
        },
      });

      const { rerender } = render(
        <ConnectionStatus status={status} onReconnect={mockOnReconnect} showDetails={true} />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });
  });

  test('should format latency correctly', () => {
    const testCases = [
      { latency: 0, expected: 'N/A' },
      { latency: 25, expected: '25ms' },
      { latency: 150, expected: '150ms' },
    ];

    testCases.forEach(({ latency, expected }) => {
      const status = createMockStatus({
        connected: true,
        latency,
        quality: {
          status: 'good',
          score: 80,
          factors: { latency, stability: 0, throughput: 0 },
        },
      });

      const { rerender } = render(
        <ConnectionStatus status={status} onReconnect={mockOnReconnect} showDetails={true} />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();

      // Clean up for next iteration
      rerender(<div />);
    });
  });
});