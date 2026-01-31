/**
 * Card Component
 *
 * A versatile container component with multiple variants.
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm',
  elevated:
    'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md',
  outlined:
    'bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700',
  glass:
    'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-white/20 dark:border-neutral-700/50',
};

const paddingClasses: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const classes = [
    'rounded-xl transition-all duration-200',
    variantClasses[variant],
    paddingClasses[padding],
    hoverable
      ? 'cursor-pointer hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 active:scale-[0.995]'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
