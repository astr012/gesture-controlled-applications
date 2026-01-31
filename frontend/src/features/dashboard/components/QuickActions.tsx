/**
 * QuickActions Component
 *
 * Quick action buttons for the dashboard sidebar.
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Hand, Volume2, MousePointer2 } from 'lucide-react';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Start Finger Count',
      icon: Hand,
      action: () => navigate('/projects/finger-count'),
    },
    {
      label: 'Volume Control',
      icon: Volume2,
      action: () => navigate('/projects/volume-control'),
    },
    {
      label: 'Virtual Mouse',
      icon: MousePointer2,
      action: () => navigate('/projects/virtual-mouse'),
    },
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl h-full">
      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
        Quick Launch
      </h3>
      <div className="flex flex-col gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="secondary"
            onClick={action.action}
            leftIcon={<action.icon size={18} />}
            fullWidth
            className="justify-start px-4 py-3 h-auto glass hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-glass hover:scale-[1.02] transition-all duration-300 border-transparent"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
