/**
 * Badge Component
 *
 * Small status indicator labels.
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  pulse?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
  primary:
    'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300',
  success:
    'bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-300',
  warning:
    'bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-300',
  danger:
    'bg-error-100 dark:bg-error-500/20 text-error-700 dark:text-error-300',
  info: 'bg-info-100 dark:bg-info-500/20 text-info-700 dark:text-info-300',
  accent:
    'bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-300',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const classes = [
    'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
    variantClasses[variant],
    sizeClasses[size],
    pulse ? 'animate-pulse' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
};

export default Badge;
