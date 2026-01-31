/**
 * MainLayout Component
 *
 * The main layout wrapper that uses the AppShell for consistent navigation.
 * This is the top-level layout used by the router.
 */

import React from 'react';
import AppShell from './AppShell';

const MainLayout: React.FC = () => {
  return <AppShell />;
};

export default MainLayout;
