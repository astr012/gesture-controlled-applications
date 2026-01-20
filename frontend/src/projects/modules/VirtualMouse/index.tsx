/**
 * Virtual Mouse Project Module
 * Lazy-loaded component for virtual mouse gesture control
 * Follows standardized project interface with enhanced metadata
 */

import React from 'react';
import type { ProjectDisplayProps, ProjectMetadata, ProjectSettings } from '@/types/project';
import { VirtualMouseDisplay } from '@/components/GestureDisplay/VirtualMouseDisplay';

// Project metadata
export const metadata: ProjectMetadata = {
  name: 'Virtual Mouse',
  description: 'Control cursor and clicks with precise hand movements',
  version: '1.0.0',
  author: 'Gesture Control Platform',
  category: 'advanced',
  requirements: ['MediaPipe', 'Cursor Control API'],
  features: ['Cursor Movement', 'Click Gestures', 'Smoothing', 'Calibration', 'Multi-gesture Support'],
  tags: ['mouse', 'cursor', 'advanced', 'precision'],
  documentation: '/docs/projects/virtual-mouse',
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
  sensitivity: 1.0,
  // Project-specific settings
  smoothing: false,
  clickEnabled: true,
  dragEnabled: true,
  scrollEnabled: false,
  cursorSpeed: 1.0,
  clickThreshold: 0.8,
};

// Settings validation function
export const validateSettings = (settings: ProjectSettings): boolean => {
  if (typeof settings.sensitivity !== 'number' || settings.sensitivity < 0.1 || settings.sensitivity > 2.0) {
    return false;
  }
  if (typeof settings.cursorSpeed === 'number' && (settings.cursorSpeed < 0.1 || settings.cursorSpeed > 3.0)) {
    return false;
  }
  if (typeof settings.clickThreshold === 'number' && (settings.clickThreshold < 0.1 || settings.clickThreshold > 1.0)) {
    return false;
  }
  return true;
};

// Main display component
const VirtualMouseProject: React.FC<ProjectDisplayProps> = ({
  gestureData,
  settings,
  onSettingsChange,
}) => {
  return (
    <div>
      <VirtualMouseDisplay
        data={gestureData}
      />

      {settings.displayMode === 'detailed' && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Virtual Mouse Settings</h3>

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
                Mouse Sensitivity: {settings.sensitivity}
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
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
                Cursor Speed: {settings.cursorSpeed || 1.0}
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={settings.cursorSpeed || 1.0}
                  onChange={(e) => onSettingsChange({
                    ...settings,
                    cursorSpeed: parseFloat(e.target.value)
                  })}
                />
              </label>
            </div>

            <div>
              <label>
                Click Threshold: {settings.clickThreshold || 0.8}
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.clickThreshold || 0.8}
                  onChange={(e) => onSettingsChange({
                    ...settings,
                    clickThreshold: parseFloat(e.target.value)
                  })}
                />
              </label>
            </div>

            <label>
              <input
                type="checkbox"
                checked={settings.smoothing || false}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  smoothing: e.target.checked
                })}
              />
              Enable Mouse Smoothing
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings.clickEnabled ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  clickEnabled: e.target.checked
                })}
              />
              Enable Click Gestures
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings.dragEnabled ?? true}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  dragEnabled: e.target.checked
                })}
              />
              Enable Drag Gestures
            </label>

            <label>
              <input
                type="checkbox"
                checked={settings.scrollEnabled || false}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  scrollEnabled: e.target.checked
                })}
              />
              Enable Scroll Gestures
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the component as default for lazy loading
export default VirtualMouseProject;