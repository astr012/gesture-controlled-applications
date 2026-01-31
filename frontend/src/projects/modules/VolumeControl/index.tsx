/**
 * Volume Control Project Module
 *
 * Enterprise-grade module for gesture-based volume control.
 * Uses the ProjectShowcasePage template for consistent UX.
 */

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import type {
  ProjectDisplayProps,
  ProjectMetadata,
  ProjectSettings,
} from '@/types/project';
import { ProjectShowcasePage } from '@/components/ProjectShowcase';
import { VolumeControlDisplay } from '@/components/GestureDisplay/VolumeControlDisplay';
import VolumeControlSettings from './VolumeControlSettings';
import VolumeControlMetrics from './VolumeControlMetrics';

// Module metadata
export const metadata: ProjectMetadata = {
  name: 'Volume Control',
  description: 'Control system volume using intuitive hand gestures',
  version: '1.0.0',
  author: 'Gesture Control Platform',
  category: 'basic',
  requirements: ['MediaPipe', 'System Audio API'],
  features: [
    'Volume Adjustment',
    'Mute Control',
    'Visual Feedback',
    'Gesture Recognition',
  ],
  tags: ['volume', 'audio', 'control', 'system'],
  documentation: '/docs/projects/volume-control',
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
  sensitivity: 0.5,
  volumeStep: 5,
  enableMute: true,
  smoothVolumeChange: true,
  showVolumeBar: true,
};

// Settings validation
export const validateSettings = (settings: ProjectSettings): boolean => {
  if (
    typeof settings.sensitivity !== 'number' ||
    settings.sensitivity < 0.1 ||
    settings.sensitivity > 1.0
  ) {
    return false;
  }
  if (
    typeof settings.volumeStep === 'number' &&
    (settings.volumeStep < 1 || settings.volumeStep > 20)
  ) {
    return false;
  }
  return true;
};

// Main Project Component
const VolumeControlProject: React.FC<ProjectDisplayProps> = ({
  gestureData,
  settings,
  onSettingsChange,
  connectionStatus,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Extract volume control data
  const volumeData = gestureData?.volume_control ?? null;
  const isConnected = connectionStatus?.connected ?? false;
  const isStreaming = !!volumeData;

  return (
    <ProjectShowcasePage
      projectId="volume_control"
      name={metadata.name}
      description={metadata.description}
      category={metadata.category}
      icon={<Volume2 size={20} />}
      isConnected={isConnected}
      isStreaming={isStreaming}
      settingsOpen={settingsOpen}
      onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
      settingsPanel={
        <VolumeControlSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      }
      metricsPanel={
        <VolumeControlMetrics
          data={volumeData}
          fps={connectionStatus?.fps ?? 0}
          latency={connectionStatus?.latency ?? 0}
        />
      }
    >
      <VolumeControlDisplay data={volumeData} />
    </ProjectShowcasePage>
  );
};

export default VolumeControlProject;
