/**
 * Finger Count Project Module
 * Lazy-loaded component for finger counting gesture detection
 * Follows standardized project interface with enhanced metadata
 */

import React from 'react';
import type { ProjectDisplayProps, ProjectMetadata, ProjectSettings } from '@/types/project';
import { FingerCountDisplay } from '@/components/GestureDisplay/FingerCountDisplay';

// Project metadata
export const metadata: ProjectMetadata = {
  name: 'Finger Counting',
  description: 'Real-time finger detection and counting with hand tracking using MediaPipe',
  version: '1.0.0',
  author: 'Gesture Control Platform',
  category: 'basic',
  requirements: ['MediaPipe', 'Hand Tracking'],
  features: ['Real-time Detection', 'Multi-hand Support', 'Confidence Scoring', 'Visual Feedback'],
  tags: ['fingers', 'counting', 'basic', 'hand-tracking'],
  documentation: '/docs/projects/finger-count',
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
  showHandLabels: true,
  showConfidence: true,
  animateChanges: true,
};

// Settings validation function
export const validateSettings = (settings: ProjectSettings): boolean => {
  if (typeof settings.sensitivity !== 'number' || settings.sensitivity < 0.1 || settings.sensitivity > 1.0) {
    return false;
  }
  return true;
};

// Main display component
const FingerCountProject: React.FC<ProjectDisplayProps> = ({
  gestureData,
  settings,
  onSettingsChange,
}) => {
  return (
    <div>
      <FingerCountDisplay
        data={gestureData}
      />

      {settings.displayMode === 'detailed' && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Project Settings</h3>

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

            <label>
              <input
                type="checkbox"
                checked={settings.showHandLabels ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  showHandLabels: e.target.checked
                })}
              />
              Show Hand Labels (Left/Right)
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings.showConfidence ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  showConfidence: e.target.checked
                })}
              />
              Show Confidence Scores
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings.animateChanges ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  animateChanges: e.target.checked
                })}
              />
              Animate Finger Count Changes
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the component as default for lazy loading
export default FingerCountProject;