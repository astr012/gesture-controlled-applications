/**
 * Volume control project display component
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React from 'react';
import type { VolumeControlData } from '../../types/gesture';
import {
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Activity,
  Radio,
} from 'lucide-react';

interface Props {
  data: VolumeControlData | null;
}

export const VolumeControlDisplay: React.FC<Props> = ({ data }) => {
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
          to control volume.
        </p>
      </div>
    );
  }

  const volumePercentage = Math.round(data.volume_level * 100);

  const getVolumeIcon = () => {
    if (volumePercentage === 0) return VolumeX;
    if (volumePercentage < 30) return Volume;
    if (volumePercentage < 70) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const getBarColor = () => {
    if (volumePercentage < 30)
      return 'bg-success-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
    if (volumePercentage < 70)
      return 'bg-primary-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]';
    return 'bg-warning-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Volume Display */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5 group-hover:from-primary-500/10 group-hover:to-accent-500/10 transition-colors duration-500" />

        <div className="relative z-10 flex items-center gap-8">
          <div className="p-6 rounded-2xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur shadow-sm">
            <VolumeIcon
              size={48}
              className="text-primary-600 dark:text-primary-400"
              strokeWidth={1.5}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400">
                {volumePercentage}%
              </div>
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                Master Volume
              </div>
            </div>

            <div className="h-4 rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-200 ease-out ${getBarColor()}`}
                style={{ width: `${volumePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gesture Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center justify-between group hover:border-primary-500/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-primary-500 transition-colors">
              <Maximize2 size={20} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
                Gesture Distance
              </div>
              <div className="text-xl font-mono font-semibold text-neutral-900 dark:text-white">
                {data.gesture_distance.toFixed(2)} cm
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
                Status
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${data.is_controlling ? 'bg-success-500 animate-pulse' : 'bg-neutral-400'}`}
                />
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {data.is_controlling ? 'Active Control' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-white/5">
        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 mb-4 border-b border-neutral-200 dark:border-white/10 pb-2">
          Gesture Guide
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Show thumb & index finger to camera
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
              <Minimize2 size={12} /> Pinch to decrease volume
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
              <Maximize2 size={12} /> Spread to increase volume
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
