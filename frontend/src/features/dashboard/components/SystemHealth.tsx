/**
 * SystemHealth Component
 *
 * System health indicators for the dashboard.
 * Uses Tailwind CSS v4 and Glassmorphism.
 */

import React from 'react';
import { useAppStore } from '../../../state/stores/appStore';
import { Server, Camera, Cpu, Activity } from 'lucide-react';

const SystemHealth: React.FC = () => {
  const connection = useAppStore(state => state.connection);

  const healthItems = [
    {
      label: 'Backend Status',
      icon: Server,
      status:
        connection.status === 'connected'
          ? 'healthy'
          : connection.status === 'connecting'
            ? 'warning'
            : 'error',
      value:
        connection.status === 'connected'
          ? 'Connected'
          : connection.status === 'connecting'
            ? 'Connecting...'
            : 'Disconnected',
    },
    {
      label: 'Camera Feed',
      icon: Camera,
      status: 'healthy',
      value: 'Ready',
    },
    {
      label: 'AI Engine',
      icon: Cpu,
      status: 'healthy',
      value: 'Active',
    },
    {
      label: 'Network Latency',
      icon: Activity,
      status:
        connection.latency < 50
          ? 'healthy'
          : connection.latency < 100
            ? 'warning'
            : 'error',
      value: `${connection.latency}ms`,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'warning':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'error':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'warning':
        return 'bg-amber-500 animate-pulse';
      case 'error':
        return 'bg-rose-500';
      default:
        return 'bg-neutral-400';
    }
  };

  return (
    <div className="glass-panel p-4 rounded-2xl h-full">
      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
        System Status
      </h3>
      <div className="flex flex-col gap-3">
        {healthItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                <item.icon size={16} />
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                {item.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${getDotColor(item.status)}`}
              />
              <span
                className={`text-xs font-semibold ${item.status === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' : item.status === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemHealth;
