/**
 * FingerCountSettings - Settings panel for Finger Count project
 */

import React from 'react';
import { Toggle, Slider, Section } from '@/components/ui/SettingsControls';
import type { ProjectSettings } from '@/types/project';

interface FingerCountSettingsProps {
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
}

const FingerCountSettings: React.FC<FingerCountSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const updateSetting = <K extends keyof ProjectSettings>(
    key: K,
    value: ProjectSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
      <Section title="Display">
        <Toggle
          label="Show Hand Labels"
          description="Display Left/Right hand indicators"
          checked={settings.showHandLabels ?? true}
          onChange={checked => updateSetting('showHandLabels', checked)}
        />
        <Toggle
          label="Show Confidence"
          description="Display detection confidence scores"
          checked={settings.showConfidence ?? true}
          onChange={checked => updateSetting('showConfidence', checked)}
        />
        <Toggle
          label="Debug Mode"
          description="Show additional debug information"
          checked={settings.showDebugInfo ?? false}
          onChange={checked => updateSetting('showDebugInfo', checked)}
        />
      </Section>

      <Section title="Detection">
        <Slider
          label="Sensitivity"
          description="Detection sensitivity threshold"
          value={settings.sensitivity ?? 0.5}
          min={0.1}
          max={1.0}
          step={0.1}
          onChange={value => updateSetting('sensitivity', value)}
        />
      </Section>
    </div>
  );
};

export default FingerCountSettings;
