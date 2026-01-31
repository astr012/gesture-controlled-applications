/**
 * SuspenseWrapper Component
 *
 * A wrapper for React Suspense with a nice loading fallback.
 * Uses Tailwind CSS for all styling.
 */

import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

export interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-[200px] w-full">
    <LoadingSpinner size="lg" />
  </div>
);

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback = <DefaultFallback />,
}) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};

export default SuspenseWrapper;
