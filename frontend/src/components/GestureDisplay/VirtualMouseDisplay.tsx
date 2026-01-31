/**
 * Virtual mouse project display component
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React from 'react';
import type { VirtualMouseData } from '../../types/gesture';
import {
  MousePointer2,
  Move,
  MousePointerClick,
  Scroll,
  Info,
  Radio,
} from 'lucide-react';

interface Props {
  data: VirtualMouseData | null;
}

export const VirtualMouseDisplay: React.FC<Props> = ({ data }) => {
  // Empty state when no data
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Radio
            size={48}
            className="text-neutral-400 dark:text-neutral-500"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Waiting for Connection
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
          Start the gesture detection service and show your hand to the camera
          to control the cursor.
        </p>
      </div>
    );
  }

  const getModeColor = () => {
    switch (data.gesture_mode) {
      case 'move':
        return 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border-primary-500/30';
      case 'click':
        return 'bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-300 border-success-500/30';
      case 'scroll':
        return 'bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-300 border-accent-500/30';
      default:
        return 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 border-neutral-500/30';
    }
  };

  const getModeIcon = () => {
    switch (data.gesture_mode) {
      case 'move':
        return <Move size={16} />;
      case 'click':
        return <MousePointerClick size={16} />;
      case 'scroll':
        return <Scroll size={16} />;
      default:
        return <MousePointer2 size={16} />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Cursor Display */}
      <div className="glass-panel p-6 rounded-2xl relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <MousePointer2 className="text-primary-500" /> Virtual Workspace
          </h3>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-sm text-neutral-600 dark:text-neutral-300">
              X: <span className="font-bold">{Math.round(data.cursor_x)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-sm text-neutral-600 dark:text-neutral-300">
              Y: <span className="font-bold">{Math.round(data.cursor_y)}</span>
            </div>
          </div>
        </div>

        {/* Visual Cursor Area */}
        <div className="relative w-full aspect-video rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/10 overflow-hidden shadow-inner group">
          {/* Grid overlay */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10 pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="border border-neutral-500/50" />
            ))}
          </div>

          {/* Center Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-20">
            <div className="absolute w-full h-[1px] bg-neutral-500 top-1/2" />
            <div className="absolute h-full w-[1px] bg-neutral-500 left-1/2" />
          </div>

          {/* Cursor indicator */}
          <div
            className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 will-change-transform z-10"
            style={{
              left: `${Math.min(100, Math.max(0, (data.cursor_x / 1920) * 100))}%`,
              top: `${Math.min(100, Math.max(0, (data.cursor_y / 1080) * 100))}%`,
            }}
          >
            <div
              className={`
                relative flex items-center justify-center
                transition-all duration-200
                ${data.is_clicking ? 'scale-90' : 'scale-100'}
            `}
            >
              <div
                className={`
                    absolute inset-0 rounded-full blur-sm opacity-50
                    ${data.is_clicking ? 'bg-success-500' : 'bg-primary-500'}
                `}
              />

              <MousePointer2
                size={24}
                className={`
                        relative z-10 drop-shadow-md
                        ${data.is_clicking ? 'text-success-500 fill-success-500' : 'text-primary-500 fill-primary-500'}
                    `}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gesture Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-primary-500/30 transition-colors">
          <div className="text-xs font-bold uppercase text-neutral-500 mb-2">
            Interaction Mode
          </div>
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold uppercase tracking-wider ${getModeColor()}`}
            >
              {getModeIcon()}
              {data.gesture_mode}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-success-500/30 transition-colors">
          <div className="text-xs font-bold uppercase text-neutral-500 mb-2">
            Action State
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${data.is_clicking ? 'bg-success-500 animate-ping' : 'bg-neutral-300 dark:bg-neutral-700'}`}
            />
            <span
              className={`text-lg font-bold ${data.is_clicking ? 'text-success-600 dark:text-success-400' : 'text-neutral-400'}`}
            >
              {data.is_clicking ? 'CLICKING' : 'Idle'}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 mb-4 border-b border-neutral-200 dark:border-white/10 pb-2">
          <Info size={14} /> Control Guide
        </h4>
        <div className="grid gap-3">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors">
            <div className="p-2 rounded bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
              <Move size={16} />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              Point index finger to move cursor
            </span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors">
            <div className="p-2 rounded bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400">
              <MousePointerClick size={16} />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              Make a fist to perform a click
            </span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors">
            <div className="p-2 rounded bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400">
              <Scroll size={16} />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              Raise two fingers for scroll mode
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
