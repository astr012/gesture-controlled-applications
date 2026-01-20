import { useContext } from 'react';
import ProjectContext from '@/context/ProjectContext';

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}

// Additional hook for accessing only performance utilities
export function useProjectPerformance() {
  const { performance } = useProjectContext();
  return performance;
}

// Hook for accessing only project debug utilities
export function useProjectDebug() {
  const { debug } = useProjectContext();
  return debug;
}

// Hook for accessing only project actions
export function useProjectActions() {
  const { actions } = useProjectContext();
  return actions;
}

// Hook for accessing only project state
export function useProjectState() {
  const { state } = useProjectContext();
  return state;
}
