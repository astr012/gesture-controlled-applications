/**
 * AppShell Component
 *
 * The main application shell that provides consistent layout structure.
 * Uses Tailwind CSS v4 and Global Context.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useGlobalContext } from '../../hooks/useGlobalContext';

export interface AppShellProps {
  children?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { state, actions } = useGlobalContext();
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const toggleMobileSidebar = () => setSidebarMobileOpen(prev => !prev);
  const closeMobileSidebar = () => setSidebarMobileOpen(false);

  // Use global state for sidebar collapse to persist preference
  const sidebarCollapsed = state.sidebarCollapsed;
  const toggleSidebar = actions.toggleSidebar;

  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-black transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onToggle={toggleSidebar}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main content area */}
      <div
        className={`
          flex flex-col flex-1 min-h-screen transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)
          ${sidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[260px]'}
          pl-0 w-full relative z-0
        `}
      >
        <Header
          onMenuClick={toggleMobileSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 p-6 lg:p-8 animate-fade-in relative z-0">
          <div className="max-w-[1600px] mx-auto w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
