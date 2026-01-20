import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import DebugPanel from './DebugPanel';
import ErrorTestingPanel from './ErrorTestingPanel';
import styles from './DebugToggle.module.css';

export function DebugToggle() {
  const { state, debug } = useGlobalContext();
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const [isErrorTestingVisible, setIsErrorTestingVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D for debug panel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsDebugPanelVisible(prev => !prev);
      }
      
      // Ctrl/Cmd + Shift + E for error testing panel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        setIsErrorTestingVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className={styles.debugControls}>
        <button
          className={styles.debugToggle}
          onClick={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
          title="Toggle Debug Panel (Ctrl/Cmd + Shift + D)"
          aria-label="Toggle Debug Panel"
        >
          <span className={styles.icon}>🔧</span>
          {debug.isEnabled && (
            <span className={styles.badge}>
              {debug.stateHistory.length}
            </span>
          )}
        </button>

        <button
          className={styles.errorTestingToggle}
          onClick={() => setIsErrorTestingVisible(!isErrorTestingVisible)}
          title="Toggle Error Testing Panel (Ctrl/Cmd + Shift + E)"
          aria-label="Toggle Error Testing Panel"
        >
          <span className={styles.icon}>🧪</span>
        </button>
      </div>

      <DebugPanel
        isVisible={isDebugPanelVisible}
        onToggle={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
      />

      <ErrorTestingPanel
        isVisible={isErrorTestingVisible}
        onClose={() => setIsErrorTestingVisible(false)}
      />
    </>
  );
}

export default DebugToggle;