/**
 * Volume Control Project Module
 * Lazy-loaded component for volume control gesture detection
 * Follows standardized project interface with enhanced metadata
 */

import React from 'react';
import type { ProjectDisplayProps, ProjectMetadata, ProjectSettings } from '@/types/project';
import { VolumeControlDisplay } from '@/components/GestureDisplay/VolumeControlDisplay';

// Project metadata
export const metadata: ProjectMetadata = {
  name: 'Volume Control',
  description: 'Control system volume using intuitive hand gestures',
  version: '1.0.0',
  author: 'Gesture Control Platform',
  category: 'basic',
  requirements: ['MediaPipe', 'System Audio API'],
  features: ['Volume Adjustment', 'Mute Control', 'Visual Feedback', 'Gesture Recognition'],
  tags: ['volume', 'audio', 'control', 'system'],
  documentation: '/docs/projects/volume-control',
  lastUpdated: '2024-01-11',
  compatibility: {
    minVersion: '1.0.0',
    platforms: ['web', 'desktop'],
  },
};

// Default settings for this project
export const defaultSettings: ProjectSettings = {
  displayMode: 'detailed',
  showDebugInfo: false,
  sensitivity: 0.5,
  // Project-specific settings
  volumeStep: 5,
  enableMute: true,
  smoothVolumeChange: true,
  showVolumeBar: true,
};

// Settings validation function
export const validateSettings = (settings: ProjectSettings): boolean => {
  if (typeof settings.sensitivity !== 'number' || settings.sensitivity < 0.1 || settings.sensitivity > 1.0) {
    return false;
  }
  if (typeof settings.volumeStep === 'number' && (settings.volumeStep < 1 || settings.volumeStep > 20)) {
    return false;
  }
  return true;
};

// Main display component
const VolumeControlProject: React.FC<ProjectDisplayProps> = ({
  gestureData,
  settings,
  onSettingsChange,
}) => {
  return (
    <div>
      <VolumeControlDisplay
        data={gestureData}
      />

      {settings.displayMode === 'detailed' && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Volume Control Settings</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label>
              <input
                type="checkbox"
                checked={settings.showDebugInfo}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  showDebugInfo: e.target.checked
                })}
              />
              Show Debug Information
            </label>

            <div>
              <label>
                Sensitivity: {settings.sensitivity}
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) => onSettingsChange({
                    ...settings,
                    sensitivity: parseFloat(e.target.value)
                  })}
                />
              </label>
            </div>

            <div>
              <label>
                Volume Step: {settings.volumeStep || 5}%
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={settings.volumeStep || 5}
                  onChange={(e) => onSettingsChange({
                    ...settings,
                    volumeStep: parseInt(e.target.value)
                  })}
                />
              </label>
            </div>

            <label>
              <input
                type="checkbox"
                checked={settings.enableMute ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  enableMute: e.target.checked
                })}
              />
              Enable Mute Gestures
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings.smoothVolumeChange ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  smoothVolumeChange: e.target.checked
                })}
              />
              Smooth Volume Changes
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings.showVolumeBar ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  showVolumeBar: e.target.checked
                })}
              />
              Show Volume Bar
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the component as default for lazy loading
export default VolumeControlProject;