/**
 * UI Components
 *
 * Barrel export for all UI primitive components.
 * All components use Tailwind CSS for styling.
 */

// Button
export { default as Button } from './Button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button/Button';

// Card
export { default as Card } from './Card/Card';
export type { CardProps, CardVariant } from './Card/Card';

// Badge
export { default as Badge } from './Badge/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge/Badge';

// Input
export { default as Input } from './Input/Input';
export type { InputProps } from './Input/Input';

// Modal
export { default as Modal } from './Modal/Modal';
export type { ModalProps } from './Modal/Modal';

// Tabs
export { default as Tabs } from './Tabs/Tabs';
export type { TabsProps, Tab } from './Tabs/Tabs';

// Error Boundaries
export { default as AppErrorBoundary } from './AppErrorBoundary';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ProjectErrorBoundary } from './ProjectErrorBoundary';
export { default as RouteErrorBoundary } from './RouteErrorBoundary';

// Loading
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as SuspenseWrapper } from './SuspenseWrapper';
export { default as StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusType } from './StatusIndicator';
