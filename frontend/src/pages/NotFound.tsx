/**
 * NotFound Page
 *
 * 404 error page when a route doesn't exist.
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* 404 Icon */}
      <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800">
        <span className="text-4xl font-bold text-neutral-400 dark:text-neutral-500">
          404
        </span>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
        Page Not Found
      </h1>

      <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link to="/">
        <Button variant="primary" size="lg">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
