/**
 * Main gesture data visualization component
 * Uses Tailwind CSS for all styling.
 */

import React from 'react';
import {
  GestureData,
  FingerCountData,
  VolumeControlData,
  VirtualMouseData,
} from '../../types/gesture';
import { FingerCountDisplay } from './FingerCountDisplay';
import { VolumeControlDisplay } from './VolumeControlDisplay';
import { VirtualMouseDisplay } from './VirtualMouseDisplay';

interface Props {
  gestureData: GestureData | null;
}

export const GestureDisplay: React.FC<Props> = ({ gestureData }) => {
  if (!gestureData) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">&#128075;</div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            No gesture data
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Select a project and ensure your camera is working
          </p>
        </div>
      </div>
    );
  }

  const renderProjectDisplay = () => {
    switch (gestureData.project) {
      case 'finger_count':
        return <FingerCountDisplay data={gestureData as FingerCountData} />;
      case 'volume_control':
        return <VolumeControlDisplay data={gestureData as VolumeControlData} />;
      case 'virtual_mouse':
        return <VirtualMouseDisplay data={gestureData as VirtualMouseData} />;
      default:
        return (
          <div className="p-4 text-center text-neutral-600 dark:text-neutral-400">
            <p>Unknown project: {gestureData.project}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Gesture Detection
        </h2>
        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            Hands detected: {gestureData.hands_detected}
          </span>
          <span>
            Last update:{' '}
            {new Date(gestureData.timestamp * 1000).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div>{renderProjectDisplay()}</div>
    </div>
  );
};
