/**
 * VirtualMouseMetrics - Metrics panel for Virtual Mouse project
 */

import React from 'react';
import Card from '@/components/ui/Card';
import type { VirtualMouseData } from '@/types/gesture';

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

interface VirtualMouseMetricsProps {
  data: VirtualMouseData | null;
  fps?: number;
  latency?: number;
}

const VirtualMouseMetrics: React.FC<VirtualMouseMetricsProps> = ({
  data,
  fps = 0,
  latency = 0,
}) => {
  const x = data?.cursor_x ?? 0;
  const y = data?.cursor_y ?? 0;
  const mode = data?.gesture_mode ?? 'move';
  const isClicking = data?.is_clicking ?? false;

  return (
    <>
      <MetricCard
        label="Position"
        value={`${Math.round(x)}, ${Math.round(y)}`}
        subValue="X, Y coordinates"
      />
      <MetricCard label="Mode" value={mode} subValue="Current" />
      <MetricCard
        label="State"
        value={isClicking ? 'Click' : 'Idle'}
        subValue="Mouse action"
      />
      <MetricCard
        label="Performance"
        value={`${fps}`}
        subValue={`FPS / ${latency}ms`}
      />
    </>
  );
};

export default VirtualMouseMetrics;
