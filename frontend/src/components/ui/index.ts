// Apple-Inspired UI Component Library

// Core Components
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Card } from './Card';
export type { CardProps } from './Card';

export { default as StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusType } from './StatusIndicator';

export { default as ErrorBoundary } from './ErrorBoundary';

export { default as LoadingSpinner } from './LoadingSpinner';

export { default as SuspenseWrapper } from './SuspenseWrapper';

// Theme System
export * from './theme';

// Accessibility Utilities
export * from './accessibility';

// Animation Classes (import the CSS file in your app)
// import './animations.css';