/**
 * Project selection component for switching between gesture projects
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';
import type { ProjectType } from '@/types';

interface Props {
  currentProject: ProjectType | null;
  onProjectSelect: (project: ProjectType) => void;
  disabled?: boolean;
}

const projects = [
  {
    id: 'finger_count' as ProjectType,
    name: 'Finger Counting',
    description: 'Count raised fingers in real-time',
    icon: '\u270b',
  },
  {
    id: 'volume_control' as ProjectType,
    name: 'Volume Control',
    description: 'Control system volume with gestures',
    icon: '\ud83d\udd0a',
  },
  {
    id: 'virtual_mouse' as ProjectType,
    name: 'Virtual Mouse',
    description: 'Control cursor with hand movements',
    icon: '\ud83d\uddb1\ufe0f',
  },
];

export const ProjectSelector: React.FC<Props> = ({
  currentProject,
  onProjectSelect,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Select Gesture Project
      </h2>

      <div className="grid gap-3">
        {projects.map(project => (
          <button
            key={project.id}
            className={`
              flex items-center gap-4 p-4 rounded-xl text-left transition-all
              border
              ${
                currentProject === project.id
                  ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 dark:border-primary-500/50'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => onProjectSelect(project.id)}
            disabled={disabled}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-2xl flex-shrink-0">
              {project.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                {project.name}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                {project.description}
              </p>
            </div>

            {currentProject === project.id && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300">
                Active
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
