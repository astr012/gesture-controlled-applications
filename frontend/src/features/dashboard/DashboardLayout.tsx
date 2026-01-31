/**
 * DashboardLayout Component
 *
 * Layout wrapper for dashboard content.
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return <div className="max-w-7xl mx-auto">{children}</div>;
};

export default DashboardLayout;
