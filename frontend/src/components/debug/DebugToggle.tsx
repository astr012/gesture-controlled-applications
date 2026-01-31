/**
 * DebugToggle Component
 *
 * Floating debug controls for development mode.
 * Uses Tailwind CSS v4 and Lucide Icons.
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '@/hooks/useGlobalContext';
import DebugPanel from './DebugPanel';
import ErrorTestingPanel from './ErrorTestingPanel';
import { Wrench, FlaskConical, Terminal } from 'lucide-react';

export function DebugToggle() {
  const { debug } = useGlobalContext();
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const [isErrorTestingVisible, setIsErrorTestingVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === 'D'
      ) {
        event.preventDefault();
        setIsDebugPanelVisible(prev => !prev);
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === 'E'
      ) {
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
      <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-[999]">
        <button
          className="
            flex items-center justify-center w-12 h-12 rounded-full 
            bg-neutral-900 border border-neutral-700 shadow-xl 
            text-neutral-400 hover:text-white hover:scale-110 
            transition-all duration-200 relative group
          "
          onClick={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
          title="Toggle Debug Panel (Ctrl/Cmd + Shift + D)"
        >
          <Terminal size={20} />
          {debug.isEnabled && debug.stateHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold shadow-lg">
              {debug.stateHistory.length}
            </span>
          )}

          <div className="absolute left-full ml-3 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Debug Tools
          </div>
        </button>

        <button
          className="
            flex items-center justify-center w-12 h-12 rounded-full 
            bg-neutral-900 border border-neutral-700 shadow-xl 
            text-neutral-400 hover:text-rose-400 hover:scale-110 
            transition-all duration-200 group relative
          "
          onClick={() => setIsErrorTestingVisible(!isErrorTestingVisible)}
          title="Toggle Error Testing Panel (Ctrl/Cmd + Shift + E)"
        >
          <FlaskConical size={20} />
          <div className="absolute left-full ml-3 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Error Lab
          </div>
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
