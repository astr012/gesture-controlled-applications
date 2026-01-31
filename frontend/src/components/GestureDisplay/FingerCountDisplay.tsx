/**
 * Finger counting project display component
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React from 'react';
import type { FingerCountData } from '../../types/gesture';
import { Hand, Radio } from 'lucide-react';

interface Props {
  data: FingerCountData | null;
}

export const FingerCountDisplay: React.FC<Props> = ({ data }) => {
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
          to count fingers.
        </p>
      </div>
    );
  }

  const renderFingerState = (isUp: boolean) => (
    <div
      className={`
        w-full h-8 rounded-lg flex items-center justify-center transition-all duration-300
        ${
          isUp
            ? 'bg-success-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] translate-y-0'
            : 'bg-neutral-200 dark:bg-neutral-800 translate-y-2'
        }
      `}
    >
      <div
        className={`w-1.5 h-6 rounded-full ${isUp ? 'bg-white/40' : 'bg-black/10'}`}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Total Count */}
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl glass-panel relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary-500/5 group-hover:bg-primary-500/10 transition-colors duration-500" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="text-8xl font-black text-primary-600 dark:text-primary-400 mb-2 tracking-tighter drop-shadow-sm">
            {data.total_fingers}
          </div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-700 dark:text-primary-300">
            <Hand size={16} /> Total Fingers
          </div>
        </div>

        {/* Background decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-primary-500/20 rounded-full blur-[2px]" />
      </div>

      {/* Hand Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {data.hands.map((hand, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
          >
            {/* Hand Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span
                  className={`w-2 h-6 rounded-full ${hand.label === 'Right' ? 'bg-primary-500' : 'bg-accent-500'}`}
                />
                {hand.label} Hand
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono font-medium">
                  {Math.round(hand.confidence * 100)}% Conf
                </span>
                <span className="px-2.5 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-bold">
                  {hand.fingers} detected
                </span>
              </div>
            </div>

            {/* Finger States Visualizer */}
            <div className="grid grid-cols-5 gap-3 h-24 items-end pb-2 px-2 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl">
              {[
                { name: 'Thumb', state: hand.finger_states.thumb },
                { name: 'Index', state: hand.finger_states.index },
                { name: 'Middle', state: hand.finger_states.middle },
                { name: 'Ring', state: hand.finger_states.ring },
                { name: 'Pinky', state: hand.finger_states.pinky },
              ].map(finger => (
                <div
                  key={finger.name}
                  className="flex flex-col items-center gap-2 h-full justify-end"
                >
                  {renderFingerState(finger.state)}
                  <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">
                    {finger.name.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* No Hands */}
      {data.hands.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center text-center opacity-60">
          <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4 animate-pulse">
            <Hand size={32} className="text-neutral-400" />
          </div>
          <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300">
            No hands detected
          </p>
          <p className="text-sm text-neutral-400">
            Position your hands clearly in front of the camera
          </p>
        </div>
      )}
    </div>
  );
};
