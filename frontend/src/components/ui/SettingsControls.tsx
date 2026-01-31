/**
 * SettingsControl - Reusable settings control components
 *
 * Provides consistent UI for project settings panels.
 */

import React from 'react';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <label
    className={`flex items-center justify-between py-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className="flex-1 min-w-0 pr-4">
      <span className="text-sm font-medium text-neutral-900 dark:text-white">
        {label}
      </span>
      {description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {description}
        </p>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  </label>
);

interface SliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  description,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  disabled = false,
  formatValue = v => v.toFixed(1),
}) => (
  <div className={`py-2 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div>
        <span className="text-sm font-medium text-neutral-900 dark:text-white">
          {label}
        </span>
        {description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <span className="text-sm font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
        {formatValue(value)}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-primary-600"
    />
  </div>
);

interface SelectProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
}) => (
  <div className={`py-2 ${disabled ? 'opacity-50' : ''}`}>
    <label className="block">
      <span className="text-sm font-medium text-neutral-900 dark:text-white">
        {label}
      </span>
      {description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {description}
        </p>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
      {title}
    </h3>
    <div className="space-y-1">{children}</div>
  </div>
);

const SettingsControls = {
  Toggle,
  Slider,
  Select,
  Section,
};

export default SettingsControls;
