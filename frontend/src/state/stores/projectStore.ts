/**
 * Zustand Store - Project Store
 * 
 * Manages state related to gesture projects:
 * - Active project
 * - Project settings
 * - Gesture data
 * - Metrics
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type ProjectStatus = 'idle' | 'initializing' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error';
export type GestureType = 
  | 'none' 
  | 'finger_count' 
  | 'pinch' 
  | 'swipe_left' 
  | 'swipe_right'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'fist'
  | 'open_palm'
  | 'peace'
  | 'pointing';

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'intermediate' | 'advanced' | 'experimental';
  version: string;
  status: 'available' | 'disabled' | 'experimental';
  features: string[];
  requirements: string[];
}

export interface GestureData {
  gestureType: GestureType;
  confidence: number;
  timestamp: number;
  handsDetected: number;
  
  // Gesture-specific data
  fingerCount?: number;
  fingerStates?: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  
  // Raw landmark data (for visualization)
  landmarks?: Array<{
    label: string;
    landmarks: Array<{
      x: number;
      y: number;
      z: number;
      pixel_x: number;
      pixel_y: number;
    }>;
  }>;
}

export interface PipelineMetrics {
  fps: number;
  totalLatencyMs: number;
  ingestionLatencyMs: number;
  preprocessingLatencyMs: number;
  extractionLatencyMs: number;
  inferenceLatencyMs: number;
  outputLatencyMs: number;
  framesProcessed: number;
  framesDropped: number;
  errorsCount: number;
}

export interface ProjectSettings {
  displayMode: 'minimal' | 'detailed' | 'debug';
  showDebugInfo: boolean;
  sensitivity: number;
  customSettings: Record<string, unknown>;
}

export interface ProjectState {
  // Available projects
  availableProjects: ProjectMetadata[];
  
  // Active project
  activeProject: ProjectMetadata | null;
  projectStatus: ProjectStatus;
  
  // Gesture data
  currentGesture: GestureData | null;
  gestureHistory: GestureData[];
  
  // Metrics
  metrics: PipelineMetrics;
  
  // Settings
  settings: ProjectSettings;
  
  // Error state
  error: string | null;
}

export interface ProjectActions {
  // Projects
  setAvailableProjects: (projects: ProjectMetadata[]) => void;
  setActiveProject: (project: ProjectMetadata | null) => void;
  setProjectStatus: (status: ProjectStatus) => void;
  
  // Gesture Data
  updateGestureData: (data: GestureData) => void;
  clearGestureData: () => void;
  
  // Metrics
  updateMetrics: (metrics: Partial<PipelineMetrics>) => void;
  resetMetrics: () => void;
  
  // Settings
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  
  // Error
  setError: (error: string | null) => void;
  
  // Control
  startProject: (projectId: string) => Promise<boolean>;
  stopProject: () => Promise<boolean>;
  
  // Reset
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialMetrics: PipelineMetrics = {
  fps: 0,
  totalLatencyMs: 0,
  ingestionLatencyMs: 0,
  preprocessingLatencyMs: 0,
  extractionLatencyMs: 0,
  inferenceLatencyMs: 0,
  outputLatencyMs: 0,
  framesProcessed: 0,
  framesDropped: 0,
  errorsCount: 0,
};

const initialSettings: ProjectSettings = {
  displayMode: 'detailed',
  showDebugInfo: false,
  sensitivity: 0.5,
  customSettings: {},
};

const initialState: ProjectState = {
  availableProjects: [],
  activeProject: null,
  projectStatus: 'idle',
  currentGesture: null,
  gestureHistory: [],
  metrics: initialMetrics,
  settings: initialSettings,
  error: null,
};

// Maximum history size
const MAX_HISTORY_SIZE = 100;

// ============================================================================
// STORE
// ============================================================================

export const useProjectStore = create<ProjectState & ProjectActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Projects
      setAvailableProjects: (projects) => set({ availableProjects: projects }),
      
      setActiveProject: (project) => set({ 
        activeProject: project,
        projectStatus: project ? 'idle' : 'idle',
        currentGesture: null,
        gestureHistory: [],
        error: null,
      }),
      
      setProjectStatus: (status) => set({ projectStatus: status }),
      
      // Gesture Data
      updateGestureData: (data) => {
        const history = get().gestureHistory;
        const newHistory = [...history, data].slice(-MAX_HISTORY_SIZE);
        
        set({
          currentGesture: data,
          gestureHistory: newHistory,
        });
      },
      
      clearGestureData: () => set({
        currentGesture: null,
        gestureHistory: [],
      }),
      
      // Metrics
      updateMetrics: (metrics) => {
        set((state) => ({
          metrics: { ...state.metrics, ...metrics }
        }));
      },
      
      resetMetrics: () => set({ metrics: initialMetrics }),
      
      // Settings
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings }
        }));
      },
      
      // Error
      setError: (error) => set({ error }),
      
      // Control
      startProject: async (projectId) => {
        const projects = get().availableProjects;
        const project = projects.find((p) => p.id === projectId);
        
        if (!project) {
          set({ error: `Project not found: ${projectId}` });
          return false;
        }
        
        set({
          activeProject: project,
          projectStatus: 'initializing',
          error: null,
        });
        
        try {
          // Call backend API
          const response = await fetch(`/api/v1/projects/${projectId}/start`, {
            method: 'POST',
          });
          
          if (!response.ok) {
            throw new Error('Failed to start project');
          }
          
          set({ projectStatus: 'running' });
          return true;
          
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          set({
            projectStatus: 'error',
            error: message,
          });
          return false;
        }
      },
      
      stopProject: async () => {
        const active = get().activeProject;
        
        if (!active) {
          return false;
        }
        
        set({ projectStatus: 'stopping' });
        
        try {
          const response = await fetch(`/api/v1/projects/${active.id}/stop`, {
            method: 'POST',
          });
          
          if (!response.ok) {
            throw new Error('Failed to stop project');
          }
          
          set({
            projectStatus: 'stopped',
            currentGesture: null,
          });
          return true;
          
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          set({
            projectStatus: 'error',
            error: message,
          });
          return false;
        }
      },
      
      // Reset
      reset: () => set(initialState),
    }),
    { name: 'ProjectStore' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectIsRunning = (state: ProjectState) => 
  state.projectStatus === 'running';

export const selectFingerCount = (state: ProjectState) => 
  state.currentGesture?.fingerCount ?? 0;

export const selectFps = (state: ProjectState) => 
  state.metrics.fps;

export const selectLatency = (state: ProjectState) => 
  state.metrics.totalLatencyMs;
