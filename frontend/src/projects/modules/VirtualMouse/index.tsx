/**
 * Virtual Mouse Project Module
 *
 * Enterprise-grade module for gesture-based cursor control.
 * Uses the ProjectShowcasePage template for consistent UX.
 */

import React, { useState } from 'react';
import { MousePointer2 } from 'lucide-react';
import type {
  ProjectDisplayProps,
  ProjectMetadata,
  ProjectSettings,
} from '@/types/project';
import { ProjectShowcasePage } from '@/components/ProjectShowcase';
import { VirtualMouseDisplay } from '@/components/GestureDisplay/VirtualMouseDisplay';
import VirtualMouseSettings from './VirtualMouseSettings';
import VirtualMouseMetrics from './VirtualMouseMetrics';

// Module metadata
export const metadata: ProjectMetadata = {
  name: 'Virtual Mouse',
  description: 'Control cursor and clicks with precise hand movements',
  version: '1.0.0',
  author: 'Gesture Control Platform',
  category: 'advanced',
  requirements: ['MediaPipe', 'Cursor Control API'],
  features: [
    'Cursor Movement',
    'Click Gestures',
    'Smoothing',
    'Calibration',
    'Multi-gesture Support',
  ],
  tags: ['mouse', 'cursor', 'advanced', 'precision'],
  documentation: '/docs/projects/virtual-mouse',
  lastUpdated: '2024-01-11',
  compatibility: {
    minVersion: '1.0.0',
    platforms: ['web', 'desktop'],
  },
};

// Default settings
export const defaultSettings: ProjectSettings = {
  displayMode: 'detailed',
  showDebugInfo: false,
  sensitivity: 1.0,
  smoothing: false,
  clickEnabled: true,
  dragEnabled: true,
  scrollEnabled: false,
  cursorSpeed: 1.0,
  clickThreshold: 0.8,
};

// Settings validation
export const validateSettings = (settings: ProjectSettings): boolean => {
  if (
    typeof settings.sensitivity !== 'number' ||
    settings.sensitivity < 0.1 ||
    settings.sensitivity > 2.0
  ) {
    return false;
  }
  if (
    typeof settings.cursorSpeed === 'number' &&
    (settings.cursorSpeed < 0.1 || settings.cursorSpeed > 3.0)
  ) {
    return false;
  }
  if (
    typeof settings.clickThreshold === 'number' &&
    (settings.clickThreshold < 0.1 || settings.clickThreshold > 1.0)
  ) {
    return false;
  }
  return true;
};

// Main Project Component
const VirtualMouseProject: React.FC<ProjectDisplayProps> = ({
  gestureData,
  settings,
  onSettingsChange,
  connectionStatus,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Extract virtual mouse data
  const mouseData = gestureData?.virtual_mouse ?? null;
  const isConnected = connectionStatus?.connected ?? false;
  const isStreaming = !!mouseData;

  return (
    <ProjectShowcasePage
      projectId="virtual_mouse"
      name={metadata.name}
      description={metadata.description}
      category={metadata.category}
      icon={<MousePointer2 size={20} />}
      isConnected={isConnected}
      isStreaming={isStreaming}
      settingsOpen={settingsOpen}
      onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
      settingsPanel={
        <VirtualMouseSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      }
      metricsPanel={
        <VirtualMouseMetrics
          data={mouseData}
          fps={connectionStatus?.fps ?? 0}
          latency={connectionStatus?.latency ?? 0}
        />
      }
    >
      <VirtualMouseDisplay data={mouseData} />
    </ProjectShowcasePage>
  );
};

export default VirtualMouseProject;
