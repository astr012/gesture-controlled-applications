/**
 * ProjectGrid Component
 *
 * Grid of project cards for the dashboard.
 * Uses Tailwind CSS v4, Lucide Icons, and Glassmorphism.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useProjectStore } from '../../../state/stores/projectStore';
import {
  Hand,
  Volume2,
  MousePointer2,
  Languages,
  Projector,
  ArrowRight,
  Lock,
} from 'lucide-react';

// Project definitions
const projects = [
  {
    id: 'finger_count',
    name: 'Smart Finger Counter',
    description: 'Real-time finger counting with pose detection',
    icon: Hand,
    category: 'basic',
    route: '/projects/finger-count',
    version: '2.0.0',
    color: 'text-primary-500',
    bg: 'bg-primary-500/10',
  },
  {
    id: 'volume_control',
    name: 'Gesture Volume Controller',
    description: 'Control system audio with pinch gestures',
    icon: Volume2,
    category: 'intermediate',
    route: '/projects/volume-control',
    version: '2.0.0',
    color: 'text-accent-500',
    bg: 'bg-accent-500/10',
  },
  {
    id: 'virtual_mouse',
    name: 'Precision Virtual Mouse',
    description: 'Control cursor with hand gestures',
    icon: MousePointer2,
    category: 'advanced',
    route: '/projects/virtual-mouse',
    version: '2.0.0',
    color: 'text-success-500',
    bg: 'bg-success-500/10',
  },
  {
    id: 'sign_language',
    name: 'Sign Language Alphabet',
    description: 'ASL alphabet recognition (experimental)',
    icon: Languages,
    category: 'experimental',
    route: '/projects/sign-language',
    version: '1.0.0',
    disabled: true,
    color: 'text-warning-500',
    bg: 'bg-warning-500/10',
  },
  {
    id: 'presentation',
    name: 'Presentation Controller',
    description: 'Control slideshows with air gestures',
    icon: Projector,
    category: 'advanced',
    route: '/projects/presentation',
    version: '1.0.0',
    disabled: true,
    color: 'text-info-500',
    bg: 'bg-info-500/10',
  },
];

const ProjectGrid: React.FC = () => {
  const navigate = useNavigate();
  const activeProject = useProjectStore(state => state.activeProject);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'advanced':
        return 'bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300';
      case 'intermediate':
        return 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300';
      case 'experimental':
        return 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300';
      default:
        return 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300';
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <div
          key={project.id}
          className={`
            group relative
            glass-panel rounded-2xl overflow-hidden
            transition-all duration-300
            ${
              project.disabled
                ? 'opacity-60 grayscale-[0.5]'
                : 'hover:-translate-y-1 hover:shadow-glass-hover cursor-pointer'
            }
            ${activeProject === project.id ? 'ring-2 ring-primary-500' : ''}
          `}
          onClick={() => !project.disabled && navigate(project.route)}
        >
          {/* Decorative Gradient Background */}
          <div
            className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${project.disabled ? 'from-neutral-200' : 'from-primary-500/20'} to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}
          />

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-3 rounded-xl ${project.bg} ${project.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
              >
                <project.icon size={28} strokeWidth={1.5} />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getCategoryColor(project.category)}`}
              >
                {project.category}
              </span>
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {project.name}
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 h-10 line-clamp-2 leading-relaxed">
              {project.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <span className="text-xs font-mono text-neutral-400">
                  v{project.version}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={project.disabled}
                onClick={e => {
                  e.stopPropagation();
                  navigate(project.route);
                }}
                className={`
                  text-xs font-medium 
                  ${project.disabled ? 'opacity-50' : 'text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform'}
                `}
                rightIcon={
                  project.disabled ? (
                    <Lock size={12} />
                  ) : (
                    <ArrowRight size={14} />
                  )
                }
              >
                {project.disabled ? 'Locked' : 'Launch'}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectGrid;
