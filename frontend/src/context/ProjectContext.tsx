import React, { createContext, useReducer, useMemo, useEffect } from 'react';
import type { GestureData, ProjectSettings, ProjectType } from '@/types';

// Project state interface
export interface ProjectState {
  // Current project
  currentProject: ProjectType | null;

  // Current gesture data
  gestureData: GestureData | null;

  // Project-specific settings
  settings: ProjectSettings;

  // Display preferences
  displayMode: 'compact' | 'detailed';
  showDebugInfo: boolean;

  // Performance metrics
  lastUpdateTime: number;
  frameRate: number;
  averageFrameRate: number;
  frameCount: number;
  droppedFrames: number;

  // Data quality metrics
  dataQuality: {
    averageConfidence: number;
    averageProcessingTime: number;
    totalFramesProcessed: number;
  };

  // Debug information
  debugInfo: {
    lastGestureData: GestureData | null;
    performanceHistory: Array<{
      timestamp: number;
      frameRate: number;
      confidence: number;
      processingTime: number;
    }>;
  };
}

// Action types
type ProjectAction =
  | { type: 'SELECT_PROJECT'; payload: ProjectType | null }
  | { type: 'UPDATE_GESTURE_DATA'; payload: GestureData | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProjectSettings> }
  | { type: 'SET_DISPLAY_MODE'; payload: 'compact' | 'detailed' }
  | { type: 'TOGGLE_DEBUG_INFO' }
  | { type: 'SET_DEBUG_INFO'; payload: boolean }
  | { type: 'UPDATE_PERFORMANCE'; payload: { frameRate: number } }
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_PERFORMANCE_HISTORY' }
  | { type: 'UPDATE_DATA_QUALITY'; payload: { confidence: number; processingTime: number } };

// Initial state
const initialState: ProjectState = {
  currentProject: null,
  gestureData: null,
  settings: {
    displayMode: 'detailed',
    showDebugInfo: false,
    sensitivity: 0.5,
  },
  displayMode: 'detailed',
  showDebugInfo: false,
  lastUpdateTime: 0,
  frameRate: 0,
  averageFrameRate: 0,
  frameCount: 0,
  droppedFrames: 0,
  dataQuality: {
    averageConfidence: 0,
    averageProcessingTime: 0,
    totalFramesProcessed: 0,
  },
  debugInfo: {
    lastGestureData: null,
    performanceHistory: [],
  },
};

// Reducer function
function projectReducer(
  state: ProjectState,
  action: ProjectAction
): ProjectState {
  switch (action.type) {
    case 'SELECT_PROJECT': {
      // Reset performance metrics when switching projects
      return {
        ...initialState,
        currentProject: action.payload,
        settings: {
          ...initialState.settings,
          // Preserve some user preferences
          displayMode: state.settings.displayMode,
          showDebugInfo: state.settings.showDebugInfo,
        },
        displayMode: state.settings.displayMode,
        showDebugInfo: state.settings.showDebugInfo,
      };
    }

    case 'UPDATE_GESTURE_DATA': {
      const now = Date.now();
      const timeDiff = now - state.lastUpdateTime;
      const currentFrameRate = timeDiff > 0 ? 1000 / timeDiff : 0;

      // Calculate average frame rate
      const newFrameCount = state.frameCount + 1;
      const newAverageFrameRate =
        (state.averageFrameRate * state.frameCount + currentFrameRate) / newFrameCount;

      // Detect dropped frames (if time diff is significantly higher than expected)
      const expectedFrameTime = 1000 / 30; // Assuming 30 FPS target
      const droppedFrames = timeDiff > expectedFrameTime * 2 ?
        state.droppedFrames + 1 : state.droppedFrames;

      // Update performance history for debugging
      const newPerformanceEntry = {
        timestamp: now,
        frameRate: currentFrameRate,
        confidence: action.payload?.confidence || 0,
        processingTime: action.payload?.processing_time || 0,
      };

      const updatedPerformanceHistory = [
        ...state.debugInfo.performanceHistory.slice(-49), // Keep last 50 entries
        newPerformanceEntry,
      ];

      return {
        ...state,
        gestureData: action.payload,
        lastUpdateTime: now,
        frameRate: currentFrameRate,
        averageFrameRate: newAverageFrameRate,
        frameCount: newFrameCount,
        droppedFrames,
        debugInfo: {
          ...state.debugInfo,
          lastGestureData: state.gestureData, // Store previous data
          performanceHistory: updatedPerformanceHistory,
        },
      };
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'SET_DISPLAY_MODE':
      return {
        ...state,
        displayMode: action.payload,
        settings: { ...state.settings, displayMode: action.payload },
      };

    case 'TOGGLE_DEBUG_INFO':
      return {
        ...state,
        showDebugInfo: !state.showDebugInfo,
        settings: { ...state.settings, showDebugInfo: !state.showDebugInfo },
      };

    case 'SET_DEBUG_INFO':
      return {
        ...state,
        showDebugInfo: action.payload,
        settings: { ...state.settings, showDebugInfo: action.payload },
      };

    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        frameRate: action.payload.frameRate,
      };

    case 'UPDATE_DATA_QUALITY': {
      const totalFrames = state.dataQuality.totalFramesProcessed + 1;
      const newAverageConfidence =
        (state.dataQuality.averageConfidence * state.dataQuality.totalFramesProcessed + action.payload.confidence) / totalFrames;
      const newAverageProcessingTime =
        (state.dataQuality.averageProcessingTime * state.dataQuality.totalFramesProcessed + action.payload.processingTime) / totalFrames;

      return {
        ...state,
        dataQuality: {
          averageConfidence: newAverageConfidence,
          averageProcessingTime: newAverageProcessingTime,
          totalFramesProcessed: totalFrames,
        },
      };
    }

    case 'CLEAR_PERFORMANCE_HISTORY':
      return {
        ...state,
        debugInfo: {
          ...state.debugInfo,
          performanceHistory: [],
        },
        frameCount: 0,
        droppedFrames: 0,
        dataQuality: {
          averageConfidence: 0,
          averageProcessingTime: 0,
          totalFramesProcessed: 0,
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context interface
interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  actions: {
    selectProject: (project: ProjectType | null) => void;
    updateGestureData: (data: GestureData | null) => void;
    updateSettings: (settings: Partial<ProjectSettings>) => void;
    setDisplayMode: (mode: 'compact' | 'detailed') => void;
    toggleDebugInfo: () => void;
    setDebugInfo: (show: boolean) => void;
    resetState: () => void;
    clearPerformanceHistory: () => void;
  };
  // Performance utilities
  performance: {
    frameRate: number;
    averageFrameRate: number;
    droppedFrames: number;
    dataQuality: ProjectState['dataQuality'];
    getPerformanceReport: () => string;
  };
  // Debug utilities
  debug: {
    isEnabled: boolean;
    performanceHistory: ProjectState['debugInfo']['performanceHistory'];
    lastGestureData: GestureData | null;
    exportPerformanceData: () => string;
  };
}

// Create context
const ProjectContext = createContext<ProjectContextType | null>(null);

// Provider component
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Auto-update data quality metrics when gesture data changes
  useEffect(() => {
    if (state.gestureData) {
      dispatch({
        type: 'UPDATE_DATA_QUALITY',
        payload: {
          confidence: state.gestureData.confidence || 0,
          processingTime: state.gestureData.processing_time || 0,
        },
      });
    }
  }, [state.gestureData]);

  // Memoized action creators
  const actions = useMemo(() => ({
    selectProject: (project: ProjectType | null) =>
      dispatch({ type: 'SELECT_PROJECT', payload: project }),

    updateGestureData: (data: GestureData | null) =>
      dispatch({ type: 'UPDATE_GESTURE_DATA', payload: data }),

    updateSettings: (settings: Partial<ProjectSettings>) =>
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),

    setDisplayMode: (mode: 'compact' | 'detailed') =>
      dispatch({ type: 'SET_DISPLAY_MODE', payload: mode }),

    toggleDebugInfo: () => dispatch({ type: 'TOGGLE_DEBUG_INFO' }),

    setDebugInfo: (show: boolean) =>
      dispatch({ type: 'SET_DEBUG_INFO', payload: show }),

    resetState: () => dispatch({ type: 'RESET_STATE' }),

    clearPerformanceHistory: () => dispatch({ type: 'CLEAR_PERFORMANCE_HISTORY' }),
  }), []);

  // Performance utilities
  const performance = useMemo(() => ({
    frameRate: state.frameRate,
    averageFrameRate: state.averageFrameRate,
    droppedFrames: state.droppedFrames,
    dataQuality: state.dataQuality,

    getPerformanceReport: () => {
      const report = {
        currentFrameRate: state.frameRate.toFixed(2),
        averageFrameRate: state.averageFrameRate.toFixed(2),
        totalFrames: state.frameCount,
        droppedFrames: state.droppedFrames,
        dropRate: state.frameCount > 0 ? ((state.droppedFrames / state.frameCount) * 100).toFixed(2) : '0.00',
        averageConfidence: (state.dataQuality.averageConfidence * 100).toFixed(2),
        averageProcessingTime: state.dataQuality.averageProcessingTime.toFixed(2),
        totalFramesProcessed: state.dataQuality.totalFramesProcessed,
      };

      return `Performance Report:
Current Frame Rate: ${report.currentFrameRate} FPS
Average Frame Rate: ${report.averageFrameRate} FPS
Total Frames: ${report.totalFrames}
Dropped Frames: ${report.droppedFrames} (${report.dropRate}%)
Average Confidence: ${report.averageConfidence}%
Average Processing Time: ${report.averageProcessingTime}ms
Total Frames Processed: ${report.totalFramesProcessed}`;
    },
  }), [state.frameRate, state.averageFrameRate, state.droppedFrames, state.frameCount, state.dataQuality]);

  // Debug utilities
  const debug = useMemo(() => ({
    isEnabled: state.showDebugInfo,
    performanceHistory: state.debugInfo.performanceHistory,
    lastGestureData: state.debugInfo.lastGestureData,

    exportPerformanceData: () => {
      const exportData = {
        performanceHistory: state.debugInfo.performanceHistory,
        summary: {
          frameRate: state.frameRate,
          averageFrameRate: state.averageFrameRate,
          droppedFrames: state.droppedFrames,
          frameCount: state.frameCount,
          dataQuality: state.dataQuality,
        },
        timestamp: new Date().toISOString(),
      };
      return JSON.stringify(exportData, null, 2);
    },
  }), [state.showDebugInfo, state.debugInfo, state.frameRate, state.averageFrameRate, state.droppedFrames, state.frameCount, state.dataQuality]);

  // Memoized context value
  const contextValue = useMemo<ProjectContextType>(() => ({
    state,
    dispatch,
    actions,
    performance,
    debug,
  }), [state, actions, performance, debug]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export default ProjectContext;
