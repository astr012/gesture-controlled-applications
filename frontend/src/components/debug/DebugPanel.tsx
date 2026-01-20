import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import { useProjectContext } from '@/hooks/useProjectContext';
import { getMemoryUsage, debugLogger } from '@/utils/debugUtils';
import { useIntegrationValidator } from '@/utils/integrationValidator';
import { useBundleAnalysis } from '@/utils/bundleAnalyzer';
import { useCrossBrowserTesting } from '@/utils/crossBrowserTesting';
import PerformanceMonitor from '@/services/PerformanceMonitor';
import styles from './DebugPanel.module.css';

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugPanel({ isVisible, onToggle }: DebugPanelProps) {
  const { state: globalState, actions: globalActions, debug: globalDebug } = useGlobalContext();
  const { state: projectState, actions: projectActions, performance, debug: projectDebug } = useProjectContext();
  const { report: integrationReport, runTests: runIntegrationTests } = useIntegrationValidator();
  const { analysis: bundleAnalysis, runAnalysis: runBundleAnalysis } = useBundleAnalysis();
  const { report: browserReport, runTests: runBrowserTests } = useCrossBrowserTesting();
  
  const [activeTab, setActiveTab] = useState<'state' | 'performance' | 'storage' | 'integration' | 'bundles' | 'browser'>('state');
  const [memoryUsage, setMemoryUsage] = useState<ReturnType<typeof getMemoryUsage>>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Update memory usage and performance metrics periodically
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

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

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

  const handleClearPerformanceHistory = () => {
    projectActions.clearPerformanceHistory();
    debugLogger.info('Performance history cleared');
  };

  const handleExportIntegrationReport = () => {
    if (integrationReport) {
      navigator.clipboard.writeText(JSON.stringify(integrationReport, null, 2));
      debugLogger.info('Integration report exported to clipboard');
    }
  };

  const handleExportBundleAnalysis = () => {
    if (bundleAnalysis) {
      navigator.clipboard.writeText(JSON.stringify(bundleAnalysis, null, 2));
      debugLogger.info('Bundle analysis exported to clipboard');
    }
  };

  return (
    <div className={styles.debugPanel}>
      <div className={styles.header}>
        <h3>🔧 Debug Panel</h3>
        <button onClick={onToggle} className={styles.closeButton}>
          ✕
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'state' ? styles.active : ''}`}
          onClick={() => setActiveTab('state')}
        >
          State
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'integration' ? styles.active : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          Integration
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'bundles' ? styles.active : ''}`}
          onClick={() => setActiveTab('bundles')}
        >
          Bundles
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'browser' ? styles.active : ''}`}
          onClick={() => setActiveTab('browser')}
        >
          Browser
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'storage' ? styles.active : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          Storage
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'state' && (
          <div className={styles.stateTab}>
            <div className={styles.section}>
              <h4>Global State</h4>
              <div className={styles.stateInfo}>
                <p><strong>Initialized:</strong> {globalState.isInitialized ? '✅' : '❌'}</p>
                <p><strong>Theme:</strong> {globalState.theme}</p>
                <p><strong>Sidebar:</strong> {globalState.sidebarCollapsed ? 'Collapsed' : 'Expanded'}</p>
                <p><strong>Current Project:</strong> {globalState.currentProject || 'None'}</p>
                <p><strong>Connection:</strong> {globalState.connectionStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
              </div>
              <div className={styles.actions}>
                <button onClick={handleExportGlobalState} className={styles.actionButton}>
                  Export State
                </button>
                <button onClick={globalActions.clearStateHistory} className={styles.actionButton}>
                  Clear History
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h4>Project State</h4>
              <div className={styles.stateInfo}>
                <p><strong>Display Mode:</strong> {projectState.displayMode}</p>
                <p><strong>Debug Info:</strong> {projectState.showDebugInfo ? '✅' : '❌'}</p>
                <p><strong>Has Gesture Data:</strong> {projectState.gestureData ? '✅' : '❌'}</p>
                <p><strong>Frame Count:</strong> {projectState.frameCount}</p>
              </div>
              <div className={styles.actions}>
                <button onClick={projectActions.resetState} className={styles.actionButton}>
                  Reset State
                </button>
              </div>
            </div>

            {globalDebug.stateHistory.length > 0 && (
              <div className={styles.section}>
                <h4>State History ({globalDebug.stateHistory.length})</h4>
                <div className={styles.historyList}>
                  {globalDebug.stateHistory.slice(-5).map((state, index) => (
                    <div key={index} className={styles.historyItem}>
                      <small>Theme: {state.theme}, Project: {state.currentProject || 'None'}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className={styles.performanceTab}>
            <div className={styles.section}>
              <h4>Core Web Vitals</h4>
              <div className={styles.metrics}>
                {performanceMetrics?.lcp && (
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>LCP:</span>
                    <span className={`${styles.metricValue} ${performanceMetrics.lcp > 2500 ? styles.poor : performanceMetrics.lcp > 1200 ? styles.needsImprovement : styles.good}`}>
                      {performanceMetrics.lcp.toFixed(0)}ms
                    </span>
                  </div>
                )}
                {performanceMetrics?.fid && (
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>FID:</span>
                    <span className={`${styles.metricValue} ${performanceMetrics.fid > 100 ? styles.poor : performanceMetrics.fid > 25 ? styles.needsImprovement : styles.good}`}>
                      {performanceMetrics.fid.toFixed(0)}ms
                    </span>
                  </div>
                )}
                {performanceMetrics?.cls && (
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>CLS:</span>
                    <span className={`${styles.metricValue} ${performanceMetrics.cls > 0.25 ? styles.poor : performanceMetrics.cls > 0.1 ? styles.needsImprovement : styles.good}`}>
                      {performanceMetrics.cls.toFixed(3)}
                    </span>
                  </div>
                )}
                {performanceMetrics?.performanceScore && (
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Score:</span>
                    <span className={`${styles.metricValue} ${performanceMetrics.performanceScore < 50 ? styles.poor : performanceMetrics.performanceScore < 90 ? styles.needsImprovement : styles.good}`}>
                      {performanceMetrics.performanceScore}/100
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h4>Frame Rate</h4>
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Current:</span>
                  <span className={styles.metricValue}>{performance.frameRate.toFixed(1)} FPS</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Average:</span>
                  <span className={styles.metricValue}>{performance.averageFrameRate.toFixed(1)} FPS</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Dropped:</span>
                  <span className={styles.metricValue}>{performance.droppedFrames}</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h4>Data Quality</h4>
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Avg Confidence:</span>
                  <span className={styles.metricValue}>
                    {(performance.dataQuality.averageConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Avg Processing:</span>
                  <span className={styles.metricValue}>
                    {performance.dataQuality.averageProcessingTime.toFixed(1)}ms
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Total Frames:</span>
                  <span className={styles.metricValue}>{performance.dataQuality.totalFramesProcessed}</span>
                </div>
              </div>
            </div>

            {memoryUsage && (
              <div className={styles.section}>
                <h4>Memory Usage</h4>
                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Used:</span>
                    <span className={styles.metricValue}>{memoryUsage.used} MB</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Total:</span>
                    <span className={styles.metricValue}>{memoryUsage.total} MB</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Usage:</span>
                    <span className={`${styles.metricValue} ${memoryUsage.percentage > 80 ? styles.poor : memoryUsage.percentage > 60 ? styles.needsImprovement : styles.good}`}>
                      {memoryUsage.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button onClick={handleExportPerformanceData} className={styles.actionButton}>
                Export Performance Data
              </button>
              <button onClick={handleClearPerformanceHistory} className={styles.actionButton}>
                Clear History
              </button>
            </div>

            {projectDebug.performanceHistory.length > 0 && (
              <div className={styles.section}>
                <h4>Performance History</h4>
                <div className={styles.performanceChart}>
                  {projectDebug.performanceHistory.slice(-20).map((entry, index) => (
                    <div
                      key={index}
                      className={styles.performanceBar}
                      style={{
                        height: `${Math.min(entry.frameRate / 60 * 100, 100)}%`,
                        backgroundColor: entry.frameRate > 30 ? '#34C759' : entry.frameRate > 15 ? '#FF9500' : '#FF3B30'
                      }}
                      title={`${entry.frameRate.toFixed(1)} FPS at ${new Date(entry.timestamp).toLocaleTimeString()}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'integration' && (
          <div className={styles.integrationTab}>
            <div className={styles.section}>
              <h4>Integration Status</h4>
              {integrationReport ? (
                <>
                  <div className={styles.statusOverview}>
                    <div className={`${styles.statusBadge} ${styles[integrationReport.overallStatus]}`}>
                      {integrationReport.overallStatus.toUpperCase()}
                    </div>
                    <div className={styles.statusStats}>
                      <span>✅ {integrationReport.passedTests} passed</span>
                      <span>❌ {integrationReport.failedTests} failed</span>
                      <span>⚠️ {integrationReport.warningTests} warnings</span>
                    </div>
                  </div>
                  
                  <div className={styles.testResults}>
                    {integrationReport.results.map((result, index) => (
                      <div key={index} className={`${styles.testResult} ${result.passed ? styles.passed : styles.failed}`}>
                        <span className={styles.testIcon}>{result.passed ? '✅' : '❌'}</span>
                        <span className={styles.testName}>{result.testName}</span>
                        <span className={styles.testMessage}>{result.message}</span>
                      </div>
                    ))}
                  </div>

                  {integrationReport.recommendations.length > 0 && (
                    <div className={styles.recommendations}>
                      <h5>Recommendations:</h5>
                      <ul>
                        {integrationReport.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>Running integration tests...</p>
              )}
              
              <div className={styles.actions}>
                <button onClick={runIntegrationTests} className={styles.actionButton}>
                  Run Tests
                </button>
                <button onClick={handleExportIntegrationReport} className={styles.actionButton}>
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bundles' && (
          <div className={styles.bundlesTab}>
            <div className={styles.section}>
              <h4>Bundle Analysis</h4>
              {bundleAnalysis ? (
                <>
                  <div className={styles.bundleOverview}>
                    <div className={styles.metrics}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Total Size:</span>
                        <span className={styles.metricValue}>
                          {(bundleAnalysis.totalSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Load Time:</span>
                        <span className={styles.metricValue}>
                          {bundleAnalysis.totalLoadTime.toFixed(0)} ms
                        </span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Performance:</span>
                        <span className={`${styles.metricValue} ${bundleAnalysis.performance.score < 50 ? styles.poor : bundleAnalysis.performance.score < 90 ? styles.needsImprovement : styles.good}`}>
                          {bundleAnalysis.performance.score}/100
                        </span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Compression:</span>
                        <span className={styles.metricValue}>
                          {bundleAnalysis.optimization.compressionRatio.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.bundleList}>
                    <h5>Bundles by Size:</h5>
                    {bundleAnalysis.bundles.slice(0, 10).map((bundle, index) => (
                      <div key={index} className={styles.bundleItem}>
                        <span className={styles.bundleName}>{bundle.name}</span>
                        <span className={styles.bundleType}>{bundle.type}</span>
                        <span className={styles.bundleSize}>
                          {(bundle.size / 1024).toFixed(1)} KB
                        </span>
                        <span className={styles.bundleFlags}>
                          {bundle.critical && '🔥'}
                          {bundle.cached && '💾'}
                          {bundle.compressed && '🗜️'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {bundleAnalysis.recommendations.length > 0 && (
                    <div className={styles.recommendations}>
                      <h5>Recommendations:</h5>
                      <ul>
                        {bundleAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>Analyzing bundles...</p>
              )}
              
              <div className={styles.actions}>
                <button onClick={runBundleAnalysis} className={styles.actionButton}>
                  Analyze Bundles
                </button>
                <button onClick={handleExportBundleAnalysis} className={styles.actionButton}>
                  Export Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'browser' && (
          <div className={styles.browserTab}>
            <div className={styles.section}>
              <h4>Browser Compatibility</h4>
              {browserReport ? (
                <>
                  <div className={styles.browserOverview}>
                    <div className={styles.browserInfo}>
                      <p><strong>Browser:</strong> {browserReport.browserInfo.name} {browserReport.browserInfo.version}</p>
                      <p><strong>Platform:</strong> {browserReport.browserInfo.platform}</p>
                      <p><strong>Engine:</strong> {browserReport.browserInfo.engine}</p>
                      <p><strong>Device:</strong> {browserReport.browserInfo.isMobile ? 'Mobile' : browserReport.browserInfo.isTablet ? 'Tablet' : 'Desktop'}</p>
                    </div>
                    <div className={`${styles.supportBadge} ${styles[browserReport.supportLevel]}`}>
                      {browserReport.supportLevel.toUpperCase()} SUPPORT
                    </div>
                    <div className={styles.overallScore}>
                      Score: {browserReport.overallScore.toFixed(1)}/100
                    </div>
                  </div>

                  <div className={styles.testResults}>
                    {browserReport.testResults.map((result, index) => (
                      <div key={index} className={`${styles.testResult} ${result.passed ? styles.passed : styles.failed}`}>
                        <span className={styles.testIcon}>{result.passed ? '✅' : '❌'}</span>
                        <span className={styles.testName}>{result.testName}</span>
                        <span className={styles.testScore}>{result.score}/100</span>
                        {result.issues.length > 0 && (
                          <div className={styles.testIssues}>
                            {result.issues.map((issue, i) => (
                              <small key={i}>{issue}</small>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {browserReport.criticalIssues.length > 0 && (
                    <div className={styles.criticalIssues}>
                      <h5>Critical Issues:</h5>
                      {browserReport.criticalIssues.map((issue, index) => (
                        <div key={index} className={styles.criticalIssue}>
                          <strong>{issue.feature}:</strong> {issue.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {browserReport.recommendations.length > 0 && (
                    <div className={styles.recommendations}>
                      <h5>Recommendations:</h5>
                      <ul>
                        {browserReport.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>Testing browser compatibility...</p>
              )}
              
              <div className={styles.actions}>
                <button onClick={runBrowserTests} className={styles.actionButton}>
                  Run Tests
                </button>
                <button onClick={() => {
                  if (browserReport) {
                    navigator.clipboard.writeText(JSON.stringify(browserReport, null, 2));
                    debugLogger.info('Browser report exported to clipboard');
                  }
                }} className={styles.actionButton}>
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className={styles.storageTab}>
            <div className={styles.section}>
              <h4>LocalStorage</h4>
              <div className={styles.storageInfo}>
                <p><strong>Preferences:</strong> {localStorage.getItem('gesture-control-preferences') ? '✅ Saved' : '❌ Not found'}</p>
                <p><strong>Total Items:</strong> {Object.keys(localStorage).length}</p>
              </div>
              <div className={styles.actions}>
                <button 
                  onClick={() => {
                    const backup = JSON.stringify(Object.fromEntries(
                      Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])
                    ), null, 2);
                    navigator.clipboard.writeText(backup);
                    debugLogger.info('LocalStorage backup copied to clipboard');
                  }}
                  className={styles.actionButton}
                >
                  Backup to Clipboard
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Clear all localStorage data?')) {
                      localStorage.clear();
                      debugLogger.info('LocalStorage cleared');
                    }
                  }}
                  className={styles.actionButton}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h4>Preferences</h4>
              <pre className={styles.jsonDisplay}>
                {JSON.stringify(globalState.preferences, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DebugPanel;