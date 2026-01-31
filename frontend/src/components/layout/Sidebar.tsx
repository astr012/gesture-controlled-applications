/**
 * Sidebar Component
 *
 * Professional navigation sidebar with project tabs and connection status.
 * Uses Tailwind CSS v4, Lucide Icons, and Glassmorphism.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Hand,
  Volume2,
  MousePointer2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// Project definitions
const projects = [
  {
    id: 'finger-count',
    name: 'Finger Count',
    icon: Hand,
    path: '/project/finger-count',
    description: 'Real-time hand tracking',
    color: 'text-primary-500',
  },
  {
    id: 'volume-control',
    name: 'Volume Control',
    icon: Volume2,
    path: '/project/volume-control',
    description: 'Gesture-based volume',
    color: 'text-accent-500',
  },
  {
    id: 'virtual-mouse',
    name: 'Virtual Mouse',
    icon: MousePointer2,
    path: '/project/virtual-mouse',
    description: 'Air mouse control',
    color: 'text-success-500',
  },
];

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-[100]
          flex flex-col
          bg-white/90 dark:bg-neutral-900/90
          backdrop-blur-xl border-r border-neutral-200/50 dark:border-white/10
          transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)
          shadow-2xl shadow-black/5 dark:shadow-black/20
          ${collapsed ? 'w-[80px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div
          className={`
          flex items-center h-[72px] flex-shrink-0
          ${collapsed ? 'justify-center px-0 w-full' : 'px-6'}
          border-b border-neutral-200/50 dark:border-white/5
        `}
        >
          <div
            className={`flex items-center gap-3 overflow-hidden cursor-pointer ${collapsed ? 'justify-center w-full' : ''}`}
            onClick={onToggle}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 0 0-18Z" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>

            {!collapsed && (
              <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                G-Control
              </span>
            )}
          </div>

          {/* Mobile close button */}
          <button
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {/* Dashboard link */}
          <NavLink
            to="/"
            end
            onClick={onMobileClose}
            title={collapsed ? 'Dashboard' : undefined}
            className={({ isActive }) => `
              relative flex items-center gap-3 px-3 py-3 rounded-lg font-medium w-full
              ${
                isActive
                  ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50/80 dark:hover:bg-white/5 hover:backdrop-blur-sm hover:text-neutral-900 dark:hover:text-neutral-200'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard
                  size={22}
                  strokeWidth={2}
                  className="flex-shrink-0"
                />
                {!collapsed && <span className="text-base">Dashboard</span>}
              </>
            )}
          </NavLink>

          {/* Projects section */}
          {!collapsed && (
            <div className="px-3 pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Control Modules
            </div>
          )}

          {collapsed && (
            <div className="my-4 border-t border-neutral-200 dark:border-white/5 mx-2" />
          )}

          <div className="space-y-1">
            {projects.map(project => (
              <NavLink
                key={project.id}
                to={project.path}
                onClick={onMobileClose}
                title={collapsed ? project.name : undefined}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-3 py-3 rounded-lg font-medium w-full
                  ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50/80 dark:hover:bg-white/5 hover:backdrop-blur-sm hover:text-neutral-900 dark:hover:text-neutral-200'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {({ isActive }) => (
                  <>
                    <project.icon
                      size={22}
                      strokeWidth={2}
                      className="flex-shrink-0"
                    />
                    {!collapsed && (
                      <span className="text-base truncate">{project.name}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-neutral-200/50 dark:border-white/5 bg-neutral-50/50 dark:bg-black/20 backdrop-blur-md flex justify-center">
          <button
            className={`
                flex items-center justify-center w-8 h-8 rounded-lg
                text-neutral-400 hover:text-neutral-900 dark:hover:text-white
                hover:bg-white dark:hover:bg-white/10 transition-colors duration-200
              `}
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
