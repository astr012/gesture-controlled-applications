/**
 * Error Testing Panel - Development tool for testing error scenarios
 * Only available in development mode
 */

import React, { useState } from 'react';
import errorTestingService from '@/utils/errorTesting';
import type { ErrorTestScenario } from '@/types/error-testing';
import ErrorLoggingService from '@/services/ErrorLoggingService';
import styles from './ErrorTestingPanel.module.css';

interface ErrorTestingPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const ErrorTestingPanel: React.FC<ErrorTestingPanelProps> = ({ isVisible, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const errorLogger = ErrorLoggingService.getInstance();

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const allScenarios = errorTestingService.getAllScenarios();
  const categories = ['all', 'component', 'network', 'async', 'permission', 'memory'];

  const filteredScenarios = selectedCategory === 'all'
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

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all error logs?')) {
      errorTestingService.clearErrorData();
    }
  };

  const handleTestRecovery = () => {
    errorTestingService.testRecoveryMechanisms();
  };

  const handleTestPerformance = () => {
    errorTestingService.testPerformanceImpact();
  };

  const getSeverityColor = (severity: ErrorTestScenario['severity']) => {
    switch (severity) {
      case 'critical': return '#ff3b30';
      case 'high': return '#ff9500';
      case 'medium': return '#007aff';
      case 'low': return '#34c759';
      default: return '#a3a3a3';
    }
  };

  const getCategoryIcon = (category: ErrorTestScenario['category']) => {
    switch (category) {
      case 'component': return '⚛️';
      case 'network': return '🌐';
      case 'async': return '⏳';
      case 'permission': return '🔒';
      case 'memory': return '💾';
      default: return '🔧';
    }
  };

  const errorLogs = errorLogger.getErrorLogs();
  const breadcrumbs = errorLogger.getBreadcrumbs();
  const userActions = errorLogger.getUserActions();

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>🧪 Error Testing Panel</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Category Filter */}
          <div className={styles.section}>
            <h3>Category Filter</h3>
            <div className={styles.categoryFilter}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''
                    }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? '🔍' : getCategoryIcon(category as ErrorTestScenario['category'])}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error Scenarios */}
          <div className={styles.section}>
            <h3>Error Scenarios ({filteredScenarios.length})</h3>
            <div className={styles.scenarioGrid}>
              {filteredScenarios.map(scenario => (
                <div key={scenario.id} className={styles.scenarioCard}>
                  <div className={styles.scenarioHeader}>
                    <span className={styles.scenarioIcon}>
                      {getCategoryIcon(scenario.category)}
                    </span>
                    <div className={styles.scenarioInfo}>
                      <h4 className={styles.scenarioName}>{scenario.name}</h4>
                      <p className={styles.scenarioDescription}>{scenario.description}</p>
                    </div>
                    <div
                      className={styles.severityBadge}
                      style={{ backgroundColor: getSeverityColor(scenario.severity) }}
                    >
                      {scenario.severity}
                    </div>
                  </div>
                  <button
                    className={`${styles.triggerButton} ${lastTriggered === scenario.id ? styles.triggered : ''
                      }`}
                    onClick={() => handleTriggerScenario(scenario)}
                    disabled={lastTriggered === scenario.id}
                  >
                    {lastTriggered === scenario.id ? 'Triggered!' : 'Trigger Error'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Testing Tools */}
          <div className={styles.section}>
            <h3>Testing Tools</h3>
            <div className={styles.toolsGrid}>
              <button className={styles.toolButton} onClick={handleTestRecovery}>
                🔧 Test Recovery
              </button>
              <button className={styles.toolButton} onClick={handleTestPerformance}>
                ⚡ Test Performance
              </button>
              <button
                className={styles.toolButton}
                onClick={handleExportLogs}
                disabled={isExporting}
              >
                📥 {isExporting ? 'Exporting...' : 'Export Logs'}
              </button>
              <button className={styles.toolButton} onClick={handleClearLogs}>
                🧹 Clear Logs
              </button>
            </div>
          </div>

          {/* Error Statistics */}
          <div className={styles.section}>
            <h3>Error Statistics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{errorLogs.length}</div>
                <div className={styles.statLabel}>Error Logs</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{breadcrumbs.length}</div>
                <div className={styles.statLabel}>Breadcrumbs</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{userActions.length}</div>
                <div className={styles.statLabel}>User Actions</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {errorLogs.filter(log => log.severity === 'critical').length}
                </div>
                <div className={styles.statLabel}>Critical Errors</div>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          {errorLogs.length > 0 && (
            <div className={styles.section}>
              <h3>Recent Errors</h3>
              <div className={styles.errorList}>
                {errorLogs.slice(-5).reverse().map(log => (
                  <div key={log.id} className={styles.errorItem}>
                    <div className={styles.errorHeader}>
                      <span
                        className={styles.errorSeverity}
                        style={{ backgroundColor: getSeverityColor(log.severity) }}
                      >
                        {log.severity}
                      </span>
                      <span className={styles.errorName}>{log.error.name}</span>
                      <span className={styles.errorTime}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={styles.errorMessage}>{log.error.message}</div>
                    <div className={styles.errorContext}>
                      Level: {log.level} | Route: {log.context.route || 'unknown'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.disclaimer}>
            ⚠️ This panel is only available in development mode.
            Use with caution as it can trigger real errors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestingPanel;