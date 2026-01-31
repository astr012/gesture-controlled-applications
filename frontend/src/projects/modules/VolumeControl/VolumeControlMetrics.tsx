/**
 * VolumeControlMetrics - Metrics panel for Volume Control project
 */

import React from 'react';
import Card from '@/components/ui/Card';
import type { VolumeControlData } from '@/types/gesture';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue }) => (
  <Card padding="sm" className="text-center">
    <div className="text-2xl font-bold text-neutral-900 dark:text-white">
      {value}
    </div>
    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
      {label}
    </div>
    {subValue && (
      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
        {subValue}
      </div>
    )}
  </Card>
);

interface VolumeControlMetricsProps {
  data: VolumeControlData | null;
  fps?: number;
  latency?: number;
}

const VolumeControlMetrics: React.FC<VolumeControlMetricsProps> = ({
  data,
  fps = 0,
  latency = 0,
}) => {
  const volume = data?.volume_level ?? 0;
  const isControlling = data?.is_controlling ?? false;
  const direction = data?.gesture_direction ?? 'stable';
  const distance = data?.gesture_distance ?? 0;

  return (
    <>
      <MetricCard
        label="Volume"
        value={`${Math.round(volume)}%`}
        subValue={isControlling ? 'Controlling' : 'Idle'}
      />
      <MetricCard
        label="Direction"
        value={direction === 'stable' ? '-' : direction}
        subValue="Gesture"
      />
      <MetricCard
        label="Distance"
        value={distance.toFixed(1)}
        subValue="Finger span"
      />
      <MetricCard
        label="Performance"
        value={`${fps}`}
        subValue={`FPS / ${latency}ms`}
      />
    </>
  );
};

export default VolumeControlMetrics;
