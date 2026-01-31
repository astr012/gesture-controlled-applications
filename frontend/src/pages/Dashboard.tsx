/**
 * Dashboard Page
 *
 * Professional enterprise dashboard showing available modules.
 * Clean, minimal interface with no excessive animations.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { projectRegistry } from '@/projects/registry';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Hand,
  Volume2,
  MousePointer2,
  FolderOpen,
  Layers,
  Zap,
  Activity,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const enabledProjects = projectRegistry.projects.filter(
    project => project.enabled
  );

  const getProjectIcon = (id: string) => {
    switch (id) {
      case 'finger_count':
        return <Hand size={24} strokeWidth={1.5} />;
      case 'volume_control':
        return <Volume2 size={24} strokeWidth={1.5} />;
      case 'virtual_mouse':
        return <MousePointer2 size={24} strokeWidth={1.5} />;
      default:
        return <Zap size={24} strokeWidth={1.5} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-neutral-200 dark:border-white/10 pb-6">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2 tracking-tight">
          Gesture Control Platform
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Select a module to begin.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="p-4 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 flex items-center gap-4">
          <div className="p-2 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {enabledProjects.length}
            </div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Total Modules
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 flex items-center gap-4">
          <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {enabledProjects.filter(p => p.category === 'basic').length}
            </div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Basic
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 flex items-center gap-4">
          <div className="p-2 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {enabledProjects.filter(p => p.category === 'advanced').length}
            </div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Advanced
            </div>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledProjects.map(project => (
          <Link key={project.id} to={project.route} className="block group">
            <Card
              variant="default"
              className="h-full border border-neutral-200 dark:border-white/10 hover:border-primary-500 dark:hover:border-primary-500 transition-colors duration-200 bg-white dark:bg-neutral-900 shadow-sm"
              padding="lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {getProjectIcon(project.id)}
                </div>
                <Badge
                  variant={project.category === 'basic' ? 'success' : 'accent'}
                  className="uppercase text-[10px] tracking-wider font-bold px-2 py-0.5"
                >
                  {project.category}
                </Badge>
              </div>

              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                {project.name}
              </h3>

              <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                {project.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {enabledProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-300 dark:border-white/10 rounded-xl">
          <div className="w-16 h-16 mb-4 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
            <FolderOpen size={32} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
            No Modules Found
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Check your configuration registry.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
