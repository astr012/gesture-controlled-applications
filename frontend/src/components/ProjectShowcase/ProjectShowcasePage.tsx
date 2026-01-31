/**
 * ProjectShowcasePage - Enterprise-grade project page template
 *
 * This is the canonical template for all project showcase pages.
 * It provides consistent layout, connection status, and controls
 * while allowing each project to render its own visualization.
 */

import React, { type ReactNode } from 'react';
import {
  ArrowLeft,
  Settings,
  Maximize2,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export interface ProjectShowcaseProps {
  /** Project identifier */
  projectId: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Category badge */
  category: 'basic' | 'advanced';
  /** Icon component */
  icon: React.ReactNode;
  /** Connection status */
  isConnected: boolean;
  /** Whether data is streaming */
  isStreaming: boolean;
  /** Main visualization content */
  children: ReactNode;
  /** Optional settings panel */
  settingsPanel?: ReactNode;
  /** Optional metrics/stats panel */
  metricsPanel?: ReactNode;
  /** Callback for refresh action */
  onRefresh?: () => void;
  /** Callback for fullscreen action */
  onFullscreen?: () => void;
  /** Callback for settings toggle */
  onSettingsToggle?: () => void;
  /** Whether settings panel is open */
  settingsOpen?: boolean;
}

const ProjectShowcasePage: React.FC<ProjectShowcaseProps> = ({
  // projectId is included in props for type completion but not used in render
  name,
  description,
  category,
  icon,
  isConnected,
  isStreaming,
  children,
  settingsPanel,
  metricsPanel,
  onRefresh,
  onFullscreen,
  onSettingsToggle,
  settingsOpen = false,
}) => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Page Header */}
      <div className="border-b border-neutral-200 dark:border-white/5 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition-colors"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {icon}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {name}
                  </h1>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Status + Actions */}
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}
              >
                {isConnected ? (
                  <>
                    <Wifi size={12} />
                    <span>{isStreaming ? 'Streaming' : 'Connected'}</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} />
                    <span>Disconnected</span>
                  </>
                )}
              </div>

              <Badge variant={category === 'basic' ? 'success' : 'accent'}>
                {category}
              </Badge>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-neutral-200 dark:border-white/10">
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                {onFullscreen && (
                  <button
                    onClick={onFullscreen}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 size={16} />
                  </button>
                )}
                {onSettingsToggle && (
                  <button
                    onClick={onSettingsToggle}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                      settingsOpen
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title="Settings"
                  >
                    <Settings size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div
          className={`grid gap-6 ${settingsOpen && settingsPanel ? 'lg:grid-cols-[1fr,320px]' : ''}`}
        >
          {/* Visualization Area */}
          <div className="space-y-6">
            {/* Main Display */}
            <Card padding="lg" className="min-h-[400px]">
              {children}
            </Card>

            {/* Metrics Panel (below visualization) */}
            {metricsPanel && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metricsPanel}
              </div>
            )}
          </div>

          {/* Settings Sidebar */}
          {settingsOpen && settingsPanel && (
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <Card padding="md">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings size={14} />
                  Settings
                </h2>
                {settingsPanel}
              </Card>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectShowcasePage;
