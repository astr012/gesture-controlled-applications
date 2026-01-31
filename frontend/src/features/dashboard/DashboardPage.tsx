/**
 * DashboardPage Component
 *
 * Main dashboard view with project grid, stats, and quick actions.
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';
import DashboardLayout from './DashboardLayout';
import ProjectGrid from './components/ProjectGrid';
import StatsPanel from './components/StatsPanel';
import QuickActions from './components/QuickActions';
import SystemHealth from './components/SystemHealth';
import { useDashboardStats } from './hooks/useDashboardStats';

const DashboardPage: React.FC = () => {
  const { stats, isLoading } = useDashboardStats();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Welcome to the Gesture Control Platform
          </p>
        </header>

        {/* Stats Row */}
        <section>
          <StatsPanel stats={stats} isLoading={isLoading} />
        </section>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Projects
            </h2>
            <ProjectGrid />
          </section>

          <aside className="flex flex-col gap-6">
            <QuickActions />
            <SystemHealth />
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
