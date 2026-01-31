/**
 * Finger Count Project Module
 *
 * Enterprise-grade module for real-time finger detection and counting.
 * Uses the ProjectShowcasePage template for consistent UX.
 */

import React, { useState } from 'react';
import { Hand } from 'lucide-react';
import type {
  ProjectDisplayProps,
  ProjectMetadata,
  ProjectSettings,
} from '@/types/project';
import { ProjectShowcasePage } from '@/components/ProjectShowcase';
import { FingerCountDisplay } from '@/components/GestureDisplay/FingerCountDisplay';
import FingerCountSettings from './FingerCountSettings';
import FingerCountMetrics from './FingerCountMetrics';

// Module metadata
export const metadata: ProjectMetadata = {
  name: 'Finger Counting',
  description:
    'Real-time finger detection and counting with hand tracking using MediaPipe',
  version: '1.0.0',
  author: 'Gesture Control Platform',
  category: 'basic',
  requirements: ['MediaPipe', 'Hand Tracking'],
  features: [
    'Real-time Detection',
    'Multi-hand Support',
    'Confidence Scoring',
    'Visual Feedback',
  ],
  tags: ['fingers', 'counting', 'basic', 'hand-tracking'],
  documentation: '/docs/projects/finger-count',
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
  showHandLabels: true,
  showConfidence: true,
  animateChanges: true,
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
  return true;
};

// Main Project Component
const FingerCountProject: React.FC<ProjectDisplayProps> = ({
  gestureData,
  settings,
  onSettingsChange,
  connectionStatus,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Extract finger count data
  const fingerData = gestureData?.finger_count ?? null;
  const isConnected = connectionStatus?.connected ?? false;
  const isStreaming = !!fingerData;

  return (
    <ProjectShowcasePage
      projectId="finger_count"
      name={metadata.name}
      description={metadata.description}
      category={metadata.category}
      icon={<Hand size={20} />}
      isConnected={isConnected}
      isStreaming={isStreaming}
      settingsOpen={settingsOpen}
      onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
      settingsPanel={
        <FingerCountSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      }
      metricsPanel={
        <FingerCountMetrics
          data={fingerData}
          fps={connectionStatus?.fps ?? 0}
          latency={connectionStatus?.latency ?? 0}
        />
      }
    >
      <FingerCountDisplay data={fingerData} />
    </ProjectShowcasePage>
  );
};

export default FingerCountProject;
