/**
 * VolumeControlSettings - Settings panel for Volume Control project
 */

import React from 'react';
import { Toggle, Slider, Section } from '@/components/ui/SettingsControls';
import type { ProjectSettings } from '@/types/project';

interface VolumeControlSettingsProps {
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
}

const VolumeControlSettings: React.FC<VolumeControlSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const updateSetting = (key: string, value: unknown) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
      <Section title="Volume">
        <Slider
          label="Volume Step"
          description="Adjustment increment per gesture"
          value={(settings.volumeStep as number) ?? 5}
          min={1}
          max={20}
          step={1}
          onChange={value => updateSetting('volumeStep', value)}
          formatValue={v => `${v}%`}
        />
        <Toggle
          label="Smooth Changes"
          description="Animate volume transitions"
          checked={(settings.smoothVolumeChange as boolean) ?? true}
          onChange={checked => updateSetting('smoothVolumeChange', checked)}
        />
      </Section>

      <Section title="Controls">
        <Toggle
          label="Enable Mute"
          description="Allow mute gesture control"
          checked={(settings.enableMute as boolean) ?? true}
          onChange={checked => updateSetting('enableMute', checked)}
        />
        <Toggle
          label="Show Volume Bar"
          description="Display visual volume indicator"
          checked={(settings.showVolumeBar as boolean) ?? true}
          onChange={checked => updateSetting('showVolumeBar', checked)}
        />
      </Section>

      <Section title="Detection">
        <Slider
          label="Sensitivity"
          description="Gesture detection threshold"
          value={settings.sensitivity ?? 0.5}
          min={0.1}
          max={1.0}
          step={0.1}
          onChange={value => updateSetting('sensitivity', value)}
        />
        <Toggle
          label="Debug Mode"
          description="Show debug information"
          checked={settings.showDebugInfo ?? false}
          onChange={checked => updateSetting('showDebugInfo', checked)}
        />
      </Section>
    </div>
  );
};

export default VolumeControlSettings;
