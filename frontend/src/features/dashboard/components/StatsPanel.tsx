/**
 * StatsPanel Component
 *
 * Overview statistics for the dashboard.
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Activity, Clock, Hand, Target } from 'lucide-react';

interface DashboardStats {
  totalSessions: number;
  activeTime: string;
  gesturesDetected: number;
  accuracy: number;
}

interface StatsPanelProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const defaultStats: DashboardStats = {
  totalSessions: 0,
  activeTime: '0h 0m',
  gesturesDetected: 0,
  accuracy: 0,
};

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, isLoading }) => {
  const data = stats || defaultStats;

  const statItems = [
    {
      label: 'Total Sessions',
      value: data.totalSessions,
      icon: Activity,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-500/10',
    },
    {
      label: 'Active Time',
      value: data.activeTime,
      icon: Clock,
      color: 'text-accent-600 dark:text-accent-400',
      bg: 'bg-accent-50 dark:bg-accent-500/10',
    },
    {
      label: 'Gestures Detected',
      value: data.gesturesDetected.toLocaleString(),
      icon: Hand,
      color: 'text-success-600 dark:text-success-400',
      bg: 'bg-success-50 dark:bg-success-500/10',
    },
    {
      label: 'Accuracy',
      value: `${data.accuracy}%`,
      icon: Target,
      color: 'text-warning-600 dark:text-warning-400',
      bg: 'bg-warning-50 dark:bg-warning-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`
            glass-panel p-5 rounded-2xl relative overflow-hidden group
            ${isLoading ? 'animate-pulse' : ''}
          `}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {item.label}
              </span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {item.value}
              </span>
            </div>
            <div
              className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}
            >
              <item.icon size={24} strokeWidth={2} />
            </div>
          </div>

          {/* Background Glow Effect on Hover */}
          <div
            className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${item.color.replace('text-', 'bg-')}`}
          />
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
