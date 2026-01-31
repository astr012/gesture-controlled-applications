/**
 * Error Testing Panel - Development tool for testing error scenarios
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React, { useState } from 'react';
import errorTestingService from '@/utils/errorTesting';
import type { ErrorTestScenario } from '@/types/error-testing';
import ErrorLoggingService from '@/services/ErrorLoggingService';
import {
  FlaskConical,
  Search,
  Settings,
  Globe,
  Zap,
  Lock,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  Activity,
  Download,
  Trash2,
  Bug,
  List,
  User,
  X,
  Play,
} from 'lucide-react';

interface ErrorTestingPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const ErrorTestingPanel: React.FC<ErrorTestingPanelProps> = ({
  isVisible,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const errorLogger = ErrorLoggingService.getInstance();

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const allScenarios = errorTestingService.getAllScenarios();
  const categories = [
    'all',
    'component',
    'network',
    'async',
    'permission',
    'memory',
  ];

  const filteredScenarios =
    selectedCategory === 'all'
      ? allScenarios
      : allScenarios.filter(scenario => scenario.category === selectedCategory);

  const handleTriggerScenario = (scenario: ErrorTestScenario) => {
    const success = errorTestingService.triggerScenario(scenario.id);
    if (success) {
      setLastTriggered(scenario.id);
      setTimeout(() => setLastTriggered(null), 3000);
    }
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      const logData = errorTestingService.exportErrorLogs();
      const blob = new Blob([logData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityColor = (severity: ErrorTestScenario['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-500/20 text-error-400 border border-error-500/30';
      case 'high':
        return 'bg-warning-500/20 text-warning-400 border border-warning-500/30';
      case 'medium':
        return 'bg-primary-500/20 text-primary-400 border border-primary-500/30';
      case 'low':
        return 'bg-success-500/20 text-success-400 border border-success-500/30';
      default:
        return 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'all':
        return Search;
      case 'component':
        return Settings;
      case 'network':
        return Globe;
      case 'async':
        return RotateCcw;
      case 'permission':
        return Lock;
      case 'memory':
        return HardDrive;
      default:
        return Bug;
    }
  };

  const errorLogs = errorLogger.getErrorLogs();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-3">
            <span className="p-2 bg-error-500/10 rounded-lg text-error-500">
              <FlaskConical size={20} />
            </span>
            CHAOS ENGINEERING LAB
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-8 bg-neutral-900/50">
          {/* Category Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Filter by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const Icon = getCategoryIcon(category);
                return (
                  <button
                    key={category}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                      }
                    `}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Icon size={14} />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Scenarios */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Tests ({filteredScenarios.length})
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScenarios.map(scenario => {
                const CategoryIcon = getCategoryIcon(scenario.category);
                return (
                  <div
                    key={scenario.id}
                    className="group relative p-4 rounded-xl bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-neutral-700/50 text-neutral-300">
                        <CategoryIcon size={18} />
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getSeverityColor(scenario.severity)}`}
                      >
                        {scenario.severity}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-neutral-100 mb-1 group-hover:text-primary-400 transition-colors">
                      {scenario.name}
                    </h4>
                    <p className="text-xs text-neutral-400 line-clamp-2 h-8 mb-4">
                      {scenario.description}
                    </p>

                    <button
                      className={`
                        w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                        ${
                          lastTriggered === scenario.id
                            ? 'bg-success-600 text-white cursor-default'
                            : 'bg-error-500/10 text-error-500 hover:bg-error-500 hover:text-white'
                        }
                      `}
                      onClick={() => handleTriggerScenario(scenario)}
                      disabled={lastTriggered === scenario.id}
                    >
                      {lastTriggered === scenario.id ? (
                        <>Executed</>
                      ) : (
                        <>
                          <Play size={12} fill="currentColor" /> Trigger Error
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-neutral-800">
            {/* Testing Tools */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Utility Belt
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => errorTestingService.testRecoveryMechanisms()}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <RotateCcw size={16} /> Test Recovery
                </button>
                <button
                  onClick={() => errorTestingService.testPerformanceImpact()}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <Activity size={16} /> Test Performance
                </button>
                <button
                  onClick={handleExportLogs}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <Download size={16} />{' '}
                  {isExporting ? 'Exporting...' : 'Export Logs'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all error logs?')) {
                      errorTestingService.clearErrorData();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <Trash2 size={16} /> Clear Logs
                </button>
              </div>
            </div>

            {/* Error Statistics */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Impact Analysis
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Errors', value: errorLogs.length, icon: Bug },
                  {
                    label: 'Breadcrumbs',
                    value: errorLogger.getBreadcrumbs().length,
                    icon: List,
                  },
                  {
                    label: 'User Actions',
                    value: errorLogger.getUserActions().length,
                    icon: User,
                  },
                  {
                    label: 'Critical Events',
                    value: errorLogs.filter(log => log.severity === 'critical')
                      .length,
                    icon: AlertTriangle,
                    color: 'text-error-400',
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 border border-neutral-700"
                  >
                    <div className="flex flex-col">
                      <span
                        className={`text-xl font-bold font-mono ${stat.color || 'text-white'}`}
                      >
                        {stat.value}
                      </span>
                      <span className="text-[10px] uppercase text-neutral-500 font-bold">
                        {stat.label}
                      </span>
                    </div>
                    <stat.icon size={20} className="text-neutral-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestingPanel;
