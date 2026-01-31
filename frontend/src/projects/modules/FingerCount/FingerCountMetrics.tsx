/**
 * FingerCountMetrics - Real-time metrics display for Finger Count project
 */

import React from 'react';
import Card from '@/components/ui/Card';
import type { FingerCountData } from '@/types/gesture';

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

interface FingerCountMetricsProps {
  data: FingerCountData | null;
  fps?: number;
  latency?: number;
}

const FingerCountMetrics: React.FC<FingerCountMetricsProps> = ({
  data,
  fps = 0,
  latency = 0,
}) => {
  const totalFingers = data?.total_fingers ?? 0;
  const handsDetected = data?.hands_detected ?? 0;
  const avgConfidence = data?.confidence ?? 0;

  return (
    <>
      <MetricCard
        label="Total Fingers"
        value={totalFingers}
        subValue="Detected"
      />
      <MetricCard label="Hands" value={handsDetected} subValue="Active" />
      <MetricCard
        label="Confidence"
        value={`${(avgConfidence * 100).toFixed(0)}%`}
        subValue="Average"
      />
      <MetricCard
        label="Performance"
        value={`${fps}`}
        subValue={`FPS / ${latency}ms`}
      />
    </>
  );
};

export default FingerCountMetrics;
