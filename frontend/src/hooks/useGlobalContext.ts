import { useContext } from 'react';
import GlobalContext from '@/context/GlobalContext';

export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
}

// Additional hook for accessing only debug utilities
export function useGlobalDebug() {
  const { debug } = useGlobalContext();
  return debug;
}

// Hook for accessing only global actions
export function useGlobalActions() {
  const { actions } = useGlobalContext();
  return actions;
}

// Hook for accessing only global state
export function useGlobalState() {
  const { state } = useGlobalContext();
  return state;
}
