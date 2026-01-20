import React, { createContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import type {
  ProjectType,
  ProjectConfig,
  UserPreferences,
  ConnectionStatus,
  Theme,
} from '@/types';
import { useMemoizedContextValue } from '@/utils/memoization';
import { isDevelopment } from '@/utils/env';

// Global state interface
export interface GlobalState {
  // Application state
  isInitialized: boolean;
  theme: Theme;
  sidebarCollapsed: boolean;

  // Connection state
  connectionStatus: ConnectionStatus;

  // Project state
  currentProject: ProjectType | null;
  availableProjects: ProjectConfig[];

  // User preferences
  preferences: UserPreferences;

  // Debug state (development only)
  debugMode: boolean;
  stateHistory: GlobalState[];
  performanceMetrics: {
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
  };
}

// Action types
type GlobalAction =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'UPDATE_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SELECT_PROJECT'; payload: ProjectType | null }
  | { type: 'SET_AVAILABLE_PROJECTS'; payload: ProjectConfig[] }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'TOGGLE_DEBUG_MODE' }
  | { type: 'ADD_STATE_TO_HISTORY'; payload: GlobalState }
  | { type: 'UPDATE_PERFORMANCE_METRICS'; payload: { renderTime: number } }
  | { type: 'CLEAR_STATE_HISTORY' };

// Initial state
const initialState: GlobalState = {
  isInitialized: false,
  theme: 'light',
  sidebarCollapsed: false,
  connectionStatus: {
    connected: false,
    reconnecting: false,
    quality: {
      status: 'unknown',
      score: 0,
      factors: {
        latency: 0,
        stability: 0,
        throughput: 0,
      },
    },
    latency: 0,
    uptime: 0,
  },
  currentProject: null,
  availableProjects: [],
  preferences: {
    theme: 'light',
    sidebarCollapsed: false,
    defaultProject: null,
    showDebugInfo: false,
    animationsEnabled: true,
    autoReconnect: true,
  },
  debugMode: isDevelopment(),
  stateHistory: [],
  performanceMetrics: {
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  },
};

// Reducer function
function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  const startTime = performance.now();

  let newState: GlobalState;

  switch (action.type) {
    case 'SET_INITIALIZED':
      newState = { ...state, isInitialized: action.payload };
      break;

    case 'SET_THEME':
      newState = {
        ...state,
        theme: action.payload,
        preferences: { ...state.preferences, theme: action.payload },
      };
      break;

    case 'TOGGLE_SIDEBAR':
      newState = {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
        preferences: {
          ...state.preferences,
          sidebarCollapsed: !state.sidebarCollapsed,
        },
      };
      break;

    case 'SET_SIDEBAR_COLLAPSED':
      newState = {
        ...state,
        sidebarCollapsed: action.payload,
        preferences: { ...state.preferences, sidebarCollapsed: action.payload },
      };
      break;

    case 'UPDATE_CONNECTION_STATUS':
      newState = { ...state, connectionStatus: action.payload };
      break;

    case 'SELECT_PROJECT':
      newState = { ...state, currentProject: action.payload };
      break;

    case 'SET_AVAILABLE_PROJECTS':
      newState = { ...state, availableProjects: action.payload };
      break;

    case 'UPDATE_PREFERENCES':
      newState = {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
      break;

    case 'TOGGLE_DEBUG_MODE':
      newState = { ...state, debugMode: !state.debugMode };
      break;

    case 'ADD_STATE_TO_HISTORY':
      newState = {
        ...state,
        stateHistory: [
          ...state.stateHistory.slice(-9), // Keep last 10 states
          action.payload,
        ],
      };
      break;

    case 'UPDATE_PERFORMANCE_METRICS': {
      const renderCount = state.performanceMetrics.renderCount + 1;
      const averageRenderTime =
        (state.performanceMetrics.averageRenderTime * (renderCount - 1) + action.payload.renderTime) / renderCount;

      newState = {
        ...state,
        performanceMetrics: {
          renderCount,
          lastRenderTime: action.payload.renderTime,
          averageRenderTime,
        },
      };
      break;
    }

    case 'CLEAR_STATE_HISTORY':
      newState = { ...state, stateHistory: [] };
      break;

    default:
      return state;
  }

  // Add performance tracking in development
  if (isDevelopment()) {
    const renderTime = performance.now() - startTime;
    console.log(`[GlobalContext] Initialized in ${renderTime}ms`);
    if (action.type !== 'UPDATE_PERFORMANCE_METRICS') {
      // Avoid infinite loop by not tracking performance metrics updates
      setTimeout(() => {
        // This will be handled by the provider
      }, 0);
    }
  }

  return newState;
}

// Context interface
interface GlobalContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  actions: {
    setTheme: (theme: Theme) => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    updateConnectionStatus: (status: ConnectionStatus) => void;
    selectProject: (project: ProjectType | null) => void;
    setAvailableProjects: (projects: ProjectConfig[]) => void;
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
    loadProjects: () => Promise<void>;
    // Debug utilities
    toggleDebugMode: () => void;
    clearStateHistory: () => void;
    exportState: () => string;
    importState: (stateJson: string) => void;
  };
  // Debug utilities
  debug: {
    isEnabled: boolean;
    stateHistory: GlobalState[];
    performanceMetrics: GlobalState['performanceMetrics'];
    logStateChange: (action: GlobalAction, prevState: GlobalState, newState: GlobalState) => void;
  };
}

// Create context
const GlobalContext = createContext<GlobalContextType | null>(null);

// Provider component
export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  // Enhanced localStorage integration
  const savePreferences = useCallback((preferences: UserPreferences) => {
    try {
      const prefKey = 'gesture-control-preferences';
      localStorage.setItem(prefKey, JSON.stringify(preferences));

      // Also save backup with timestamp
      const backupKey = `${prefKey}-backup-${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(preferences));

      // Clean old backups (keep last 5)
      const allKeys = Object.keys(localStorage);
      const backupKeys = allKeys
        .filter(key => key.startsWith(`${prefKey}-backup-`))
        .sort()
        .slice(0, -5);

      backupKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }, []);

  const loadPreferences = useCallback((): UserPreferences | null => {
    try {
      const saved = localStorage.getItem('gesture-control-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        // Validate preferences structure
        if (preferences && typeof preferences === 'object') {
          return {
            theme: preferences.theme || 'light',
            sidebarCollapsed: Boolean(preferences.sidebarCollapsed),
            defaultProject: preferences.defaultProject || null,
            showDebugInfo: Boolean(preferences.showDebugInfo),
            animationsEnabled: preferences.animationsEnabled !== false,
            autoReconnect: preferences.autoReconnect !== false,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
    }
    return null;
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = loadPreferences();
    if (savedPreferences) {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: savedPreferences });
      dispatch({ type: 'SET_THEME', payload: savedPreferences.theme });
      dispatch({
        type: 'SET_SIDEBAR_COLLAPSED',
        payload: savedPreferences.sidebarCollapsed,
      });
    }
    dispatch({ type: 'SET_INITIALIZED', payload: true });
  }, [loadPreferences]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (state.isInitialized) {
      savePreferences(state.preferences);
    }
  }, [state.preferences, state.isInitialized, savePreferences]);

  // Debug state tracking in development - Removed to prevent infinite loop
  // useEffect(() => {
  //   if (isDevelopment() && state.debugMode) {
  //     // This causes an infinite loop because updating history changes state, triggering the effect again
  //     // dispatch({ type: 'ADD_STATE_TO_HISTORY', payload: state });
  //   }
  // }, [state]);

  // Memoized action creators
  const actions = useMemo(() => ({
    setTheme: (theme: Theme) => dispatch({ type: 'SET_THEME', payload: theme }),

    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),

    setSidebarCollapsed: (collapsed: boolean) =>
      dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed }),

    updateConnectionStatus: (status: ConnectionStatus) =>
      dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: status }),

    selectProject: (project: ProjectType | null) =>
      dispatch({ type: 'SELECT_PROJECT', payload: project }),

    setAvailableProjects: (projects: ProjectConfig[]) =>
      dispatch({ type: 'SET_AVAILABLE_PROJECTS', payload: projects }),

    updatePreferences: (preferences: Partial<UserPreferences>) =>
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences }),

    loadProjects: async () => {
      // This will be implemented when project registry is created
      // For now, return empty array
      dispatch({ type: 'SET_AVAILABLE_PROJECTS', payload: [] });
    },

    // Debug utilities
    toggleDebugMode: () => dispatch({ type: 'TOGGLE_DEBUG_MODE' }),

    clearStateHistory: () => dispatch({ type: 'CLEAR_STATE_HISTORY' }),

    exportState: () => {
      const exportData = {
        state: state,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
      return JSON.stringify(exportData, null, 2);
    },

    importState: (stateJson: string) => {
      try {
        const importData = JSON.parse(stateJson);
        if (importData.state && importData.state.preferences) {
          dispatch({ type: 'UPDATE_PREFERENCES', payload: importData.state.preferences });
          dispatch({ type: 'SET_THEME', payload: importData.state.theme });
          dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: importData.state.sidebarCollapsed });
        }
      } catch (error) {
        console.error('Failed to import state:', error);
      }
    },
  }), [state]);

  // Debug utilities
  const debug = useMemo(() => ({
    isEnabled: state.debugMode,
    stateHistory: state.stateHistory,
    performanceMetrics: state.performanceMetrics,
    logStateChange: (action: GlobalAction, prevState: GlobalState, newState: GlobalState) => {
      if (isDevelopment() && state.debugMode) {
        console.group(`🔄 Global State Change: ${action.type}`);
        console.log('Action:', action);
        console.log('Previous State:', prevState);
        console.log('New State:', newState);
        console.log('State Diff:', {
          changed: Object.keys(newState).filter(key =>
            JSON.stringify(prevState[key as keyof GlobalState]) !==
            JSON.stringify(newState[key as keyof GlobalState])
          ),
        });
        console.groupEnd();
      }
    },
  }), [state.debugMode, state.stateHistory, state.performanceMetrics]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemoizedContextValue({
    state,
    dispatch,
    actions,
    debug,
  });

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}

export default GlobalContext;
