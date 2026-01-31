/**
 * VirtualMouseSettings - Settings panel for Virtual Mouse project
 */

import React from 'react';
import { Toggle, Slider, Section } from '@/components/ui/SettingsControls';
import type { ProjectSettings } from '@/types/project';

interface VirtualMouseSettingsProps {
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
}

const VirtualMouseSettings: React.FC<VirtualMouseSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const updateSetting = (key: string, value: unknown) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
      <Section title="Movement">
        <Slider
          label="Sensitivity"
          description="Mouse movement sensitivity"
          value={settings.sensitivity ?? 1.0}
          min={0.1}
          max={2.0}
          step={0.1}
          onChange={value => updateSetting('sensitivity', value)}
        />
        <Slider
          label="Cursor Speed"
          description="Movement speed multiplier"
          value={(settings.cursorSpeed as number) ?? 1.0}
          min={0.1}
          max={3.0}
          step={0.1}
          onChange={value => updateSetting('cursorSpeed', value)}
          formatValue={v => `${v.toFixed(1)}x`}
        />
        <Toggle
          label="Smoothing"
          description="Reduce cursor jitter"
          checked={(settings.smoothing as boolean) ?? false}
          onChange={checked => updateSetting('smoothing', checked)}
        />
      </Section>

      <Section title="Actions">
        <Slider
          label="Click Threshold"
          description="Gesture recognition sensitivity"
          value={(settings.clickThreshold as number) ?? 0.8}
          min={0.1}
          max={1.0}
          step={0.1}
          onChange={value => updateSetting('clickThreshold', value)}
        />
        <Toggle
          label="Click Gestures"
          description="Enable tap-to-click"
          checked={(settings.clickEnabled as boolean) ?? true}
          onChange={checked => updateSetting('clickEnabled', checked)}
        />
        <Toggle
          label="Drag Gestures"
          description="Enable click-and-drag"
          checked={(settings.dragEnabled as boolean) ?? true}
          onChange={checked => updateSetting('dragEnabled', checked)}
        />
        <Toggle
          label="Scroll Gestures"
          description="Enable two-finger scroll"
          checked={(settings.scrollEnabled as boolean) ?? false}
          onChange={checked => updateSetting('scrollEnabled', checked)}
        />
      </Section>

      <Section title="Debug">
        <Toggle
          label="Debug Mode"
          description="Show tracking overlay"
          checked={settings.showDebugInfo ?? false}
          onChange={checked => updateSetting('showDebugInfo', checked)}
        />
      </Section>
    </div>
  );
};

export default VirtualMouseSettings;
