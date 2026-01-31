/**
 * Header Component
 *
 * Professional enterprise header with breadcrumbs, streamlined actions, and no redundancy.
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Home,
  User,
} from 'lucide-react';
// import { useGlobalContext } from '../../hooks/useGlobalContext';

export interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

// Get page info from path
const getPageInfo = (pathname: string): { breadcrumbs: string[] } => {
  if (pathname === '/') {
    return { breadcrumbs: ['Overview'] };
  }

  if (pathname.startsWith('/project/')) {
    const projectId = pathname.replace('/project/', '');
    const projectNames: Record<string, string> = {
      'finger-count': 'Finger Count',
      'volume-control': 'Volume Control',
      'virtual-mouse': 'Virtual Mouse',
    };
    const projectName = projectNames[projectId] || 'Project';
    return {
      breadcrumbs: ['Modules', projectName],
    };
  }

  return { breadcrumbs: ['Page'] };
};

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  // const { state, actions } = useGlobalContext(); // Unused
  // const { theme } = state; // Unused

  const { breadcrumbs } = getPageInfo(location.pathname);

  // Local state for theme to match Global Context
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full flex items-center justify-between h-[72px] px-6 py-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-white/5 transition-all duration-300">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        <nav
          className="hidden md:flex items-center gap-2 text-sm font-medium"
          aria-label="Breadcrumb"
        >
          <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
            <Home size={14} />
          </div>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              <ChevronRight
                size={14}
                className="text-neutral-300 dark:text-neutral-600"
              />
              <span
                className={`
                    ${
                      index === breadcrumbs.length - 1
                        ? 'text-neutral-900 dark:text-white font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }
                  `}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Search (Visual only) */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 transition-all w-64 group mr-2">
          <Search
            size={14}
            className="text-neutral-400 group-focus-within:text-neutral-600 dark:group-focus-within:text-neutral-300 transition-colors"
          />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 ml-2 w-full"
          />
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[10px] text-neutral-400 dark:text-neutral-300 font-mono">
            <span>/</span>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors"
          onClick={toggleTheme}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
        </button>

        {/* Settings */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        {/* User Profile (Simple) */}
        <div className="ml-2 pl-2 flex items-center">
          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
