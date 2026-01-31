/**
 * LoadingSpinner Component
 *
 * A simple loading spinner with size variants.
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin text-primary-600 dark:text-primary-400 ${sizeClasses[size]}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-75"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;
