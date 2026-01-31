/**
 * Input Component
 *
 * A styled form input with variants.
 * Uses Tailwind CSS for all styling.
 */

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputClasses = [
      'w-full px-3 py-2 rounded-lg text-sm',
      'bg-white dark:bg-neutral-900',
      'border border-neutral-300 dark:border-neutral-700',
      'text-neutral-900 dark:text-neutral-100',
      'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
      'transition-all duration-150',
      'hover:border-neutral-400 dark:hover:border-neutral-600',
      'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      error
        ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
        : '',
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <span className="text-xs text-error-600 dark:text-error-400">
            {error}
          </span>
        )}

        {hint && !error && (
          <span className="text-xs text-neutral-500">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
