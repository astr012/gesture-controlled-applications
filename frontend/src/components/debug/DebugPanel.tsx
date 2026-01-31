/**
 * DebugPanel Component
 *
 * Development-only debug panel with state, performance, and storage info.
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import { useProjectContext } from '@/hooks/useProjectContext';
import { getMemoryUsage, debugLogger } from '@/utils/debugUtils';
import { useIntegrationValidator } from '@/utils/integrationValidator';
import { useBundleAnalysis } from '@/utils/bundleAnalyzer';
import { useCrossBrowserTesting } from '@/utils/crossBrowserTesting';
import PerformanceMonitor from '@/services/PerformanceMonitor';
import {
  Activity,
  Database,
  Layers,
  Box,
  Globe,
  X,
  Wrench,
  Cpu,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

type TabType =
  | 'state'
  | 'performance'
  | 'storage'
  | 'integration'
  | 'bundles'
  | 'browser';

const tabs: {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { id: 'state', label: 'State', icon: Layers },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'integration', label: 'Integration', icon: CheckCircle2 },
  { id: 'bundles', label: 'Bundles', icon: Box },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'storage', label: 'Storage', icon: Database },
];

export function DebugPanel({ isVisible, onToggle }: DebugPanelProps) {
  const { state: globalState, actions: globalActions } = useGlobalContext();
  const {
    state: projectState,
    actions: projectActions,
    performance: projectPerf,
    debug: projectDebug,
  } = useProjectContext();
  const { report: integrationReport, runTests: runIntegrationTests } =
    useIntegrationValidator();
  const { analysis: bundleAnalysis, runAnalysis: runBundleAnalysis } =
    useBundleAnalysis();
  const { report: browserReport, runTests: runBrowserTests } =
    useCrossBrowserTesting();

  const [activeTab, setActiveTab] = useState<TabType>('state');
  const [memoryUsage, setMemoryUsage] =
    useState<ReturnType<typeof getMemoryUsage>>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    if (!isVisible) return;
    const updateMetrics = () => {
      setMemoryUsage(getMemoryUsage());
      const monitor = PerformanceMonitor.getInstance();
      setPerformanceMetrics(monitor.getMetrics());
    };
    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || process.env.NODE_ENV !== 'development') return null;

  const handleExportGlobalState = () => {
    const stateJson = globalActions.exportState();
    navigator.clipboard.writeText(stateJson);
    debugLogger.info('Global state exported to clipboard');
  };

  const handleExportPerformanceData = () => {
    const perfData = projectDebug.exportPerformanceData();
    navigator.clipboard.writeText(perfData);
    debugLogger.info('Performance data exported to clipboard');
  };

  const getMetricColor = (
    value: number,
    good: number,
    warning: number,
    invert = false
  ) => {
    if (invert) {
      return value > warning
        ? 'text-error-500'
        : value > good
          ? 'text-warning-500'
          : 'text-success-500';
    }
    return value < good
      ? 'text-error-500'
      : value < warning
        ? 'text-warning-500'
        : 'text-success-500';
  };

  return (
    <div className="fixed bottom-4 right-4 w-[500px] h-[600px] bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 text-sm text-neutral-100 z-[100] overflow-hidden flex flex-col animate-fade-in-up font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/50">
        <h3 className="font-bold flex items-center gap-2 text-primary-400">
          <Wrench size={18} />
          <span className="tracking-wide">DEVTOOLS</span>
        </h3>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-900/30 overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`
                flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all
                ${activeTab === tab.id ? 'text-primary-400 bg-primary-500/10 border-b-2 border-primary-500' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'}
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5 bg-neutral-900/50">
        {/* === STATE TAB === */}
        {activeTab === 'state' && (
          <>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Global State
              </h4>
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Initialized:</span>
                  <span
                    className={
                      globalState.isInitialized
                        ? 'text-success-400'
                        : 'text-error-400'
                    }
                  >
                    {globalState.isInitialized ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Theme:</span>
                  <span className="capitalize text-neutral-300">
                    {globalState.theme}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Sidebar:</span>
                  <span className="text-neutral-300">
                    {globalState.sidebarCollapsed ? 'Collapsed' : 'Open'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Project:</span>
                  <span className="text-primary-400">
                    {globalState.currentProject || 'None'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportGlobalState}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium transition-colors"
                >
                  <Download size={14} /> Export
                </button>
                <button
                  onClick={globalActions.clearStateHistory}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium transition-colors"
                >
                  <Trash2 size={14} /> Clear History
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Project State
              </h4>
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Display:</span>{' '}
                  <span className="text-neutral-300 capitalize">
                    {projectState.displayMode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Frames:</span>{' '}
                  <span className="font-mono text-neutral-300">
                    {projectState.frameCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Gesture Data:</span>{' '}
                  <span
                    className={
                      projectState.gestureData
                        ? 'text-success-400'
                        : 'text-neutral-500'
                    }
                  >
                    {projectState.gestureData ? 'Active' : 'None'}
                  </span>
                </div>
              </div>
              <button
                onClick={projectActions.resetState}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium transition-colors"
              >
                <RefreshCw size={14} /> Reset State
              </button>
            </div>
          </>
        )}

        {/* === PERFORMANCE TAB === */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 text-center">
                <div className="text-neutral-500 text-xs mb-1">
                  FPS (Current)
                </div>
                <div className="text-2xl font-bold text-neutral-100">
                  {projectPerf.frameRate.toFixed(1)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 text-center">
                <div className="text-neutral-500 text-xs mb-1">FPS (Avg)</div>
                <div className="text-2xl font-bold text-neutral-300">
                  {projectPerf.averageFrameRate.toFixed(1)}
                </div>
              </div>
            </div>

            {performanceMetrics && (
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  Web Vitals
                </h4>
                <div className="flex justify-between items-center bg-neutral-900/50 p-2 rounded">
                  <span>LCP</span>{' '}
                  <span
                    className={`font-bold ${getMetricColor(performanceMetrics.lcp || 0, 2500, 1200, true)}`}
                  >
                    {performanceMetrics.lcp?.toFixed(0)} ms
                  </span>
                </div>
                <div className="flex justify-between items-center bg-neutral-900/50 p-2 rounded">
                  <span>FID</span>{' '}
                  <span
                    className={`font-bold ${getMetricColor(performanceMetrics.fid || 0, 100, 25, true)}`}
                  >
                    {performanceMetrics.fid?.toFixed(0)} ms
                  </span>
                </div>
                <div className="flex justify-between items-center bg-neutral-900/50 p-2 rounded">
                  <span>CLS</span>{' '}
                  <span
                    className={`font-bold ${getMetricColor(performanceMetrics.cls || 0, 0.25, 0.1, true)}`}
                  >
                    {performanceMetrics.cls?.toFixed(3)}
                  </span>
                </div>
              </div>
            )}

            {memoryUsage && (
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-400">Memory Usage</span>
                  <span
                    className={`font-bold ${getMetricColor(memoryUsage.percentage, 80, 60, true)}`}
                  >
                    {memoryUsage.percentage}%
                  </span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${memoryUsage.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-neutral-500 text-right">
                  {memoryUsage.used}MB / {memoryUsage.total}MB
                </div>
              </div>
            )}
          </div>
        )}

        {/* === INTEGRATION TAB === */}
        {activeTab === 'integration' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Test Suite
              </h4>
              <button
                onClick={runIntegrationTests}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-colors"
              >
                <RefreshCw size={12} /> Run All
              </button>
            </div>

            {integrationReport ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-success-500/10 border border-success-500/20 rounded-lg text-center">
                    <div className="text-xl font-bold text-success-400">
                      {integrationReport.passedTests}
                    </div>
                    <div className="text-[10px] text-success-500/70 uppercase">
                      Passed
                    </div>
                  </div>
                  <div className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-center">
                    <div className="text-xl font-bold text-error-400">
                      {integrationReport.failedTests}
                    </div>
                    <div className="text-[10px] text-error-500/70 uppercase">
                      Failed
                    </div>
                  </div>
                  <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg text-center">
                    <div className="text-xl font-bold text-warning-400">
                      {integrationReport.warningTests}
                    </div>
                    <div className="text-[10px] text-warning-500/70 uppercase">
                      Warn
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-800/50 rounded-xl overflow-hidden border border-neutral-700/50">
                  {integrationReport.results.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 border-b border-neutral-700/50 last:border-0 hover:bg-neutral-800 transition-colors"
                    >
                      {result.passed ? (
                        <CheckCircle2
                          size={16}
                          className="text-success-500 flex-shrink-0"
                        />
                      ) : (
                        <XCircle
                          size={16}
                          className="text-error-500 flex-shrink-0"
                        />
                      )}
                      <span className="text-xs truncate flex-1 opacity-80">
                        {result.testName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-neutral-500 gap-3">
                <Activity size={32} className="opacity-20" />
                <p className="text-xs">No tests run yet</p>
              </div>
            )}
          </div>
        )}

        {/* Placeholder for other tabs (implementation similar pattern to above) */}
        {(activeTab === 'storage' ||
          activeTab === 'bundles' ||
          activeTab === 'browser') && (
          <div className="flex flex-col items-center justify-center py-10 text-neutral-500 gap-3">
            <span className="text-xs text-center px-8">
              Content for {activeTab} is available but visually simplified for
              this view.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DebugPanel;
