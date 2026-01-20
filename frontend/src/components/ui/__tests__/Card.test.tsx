import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '../Card';

// Mock CSS modules
jest.mock('../Card.module.css', () => ({
  card: 'card',
  default: 'default',
  elevated: 'elevated',
  outlined: 'outlined',
  ghost: 'ghost',
  'padding-none': 'padding-none',
  'padding-sm': 'padding-sm',
  'padding-md': 'padding-md',
  'padding-lg': 'padding-lg',
  hoverable: 'hoverable',
}));

describe('Card Component', () => {
  it('renders with default props', () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('card', 'default', 'padding-md');
  });

  it('renders different variants', () => {
    const { rerender } = render(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByText('Elevated')).toHaveClass('elevated');

    rerender(<Card variant="outlined">Outlined</Card>);
    expect(screen.getByText('Outlined')).toHaveClass('outlined');

    rerender(<Card variant="ghost">Ghost</Card>);
    expect(screen.getByText('Ghost')).toHaveClass('ghost');
  });

  it('renders different padding sizes', () => {
    const { rerender } = render(<Card padding="sm">Small padding</Card>);
    expect(screen.getByText('Small padding')).toHaveClass('padding-sm');

    rerender(<Card padding="lg">Large padding</Card>);
    expect(screen.getByText('Large padding')).toHaveClass('padding-lg');

    rerender(<Card padding="none">No padding</Card>);
    expect(screen.getByText('No padding')).toHaveClass('padding-none');
  });

  it('applies hoverable class when hoverable prop is true', () => {
    render(<Card hoverable>Hoverable card</Card>);
    expect(screen.getByText('Hoverable card')).toHaveClass('hoverable');
  });

  it('renders as different HTML elements', () => {
    render(<Card as="section">Section card</Card>);
    const card = screen.getByText('Section card');
    expect(card.tagName).toBe('SECTION');
  });

  it('forwards additional props', () => {
    render(<Card data-testid="custom-card">Custom card</Card>);
    expect(screen.getByTestId('custom-card')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Custom class</Card>);
    expect(screen.getByText('Custom class')).toHaveClass('custom-class');
  });
});