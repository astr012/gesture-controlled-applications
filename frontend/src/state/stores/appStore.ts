/**
 * Zustand Store - App Store
 * 
 * Global application state including:
 * - Theme preferences
 * - Connection status
 * - Notifications
 * - UI state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  createdAt: number;
}

export interface ConnectionState {
  status: ConnectionStatus;
  lastConnected: number | null;
  reconnectAttempts: number;
  latency: number | null;
  errorMessage?: string;
}

export interface AppState {
  // Theme
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  
  // Connection
  connection: ConnectionState;
  
  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Debug
  debugMode: boolean;
}

export interface AppActions {
  // Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Connection
  setConnectionStatus: (status: ConnectionStatus, errorMessage?: string) => void;
  updateLatency: (latency: number) => void;
  
  // UI
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Debug
  setDebugMode: (enabled: boolean) => void;
  
  // Reset
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AppState = {
  theme: 'system',
  resolvedTheme: 'dark',
  
  connection: {
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    latency: null,
  },
  
  sidebarOpen: true,
  sidebarCollapsed: false,
  
  notifications: [],
  
  debugMode: false,
};

// ============================================================================
// HELPERS
// ============================================================================

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update meta theme-color for mobile
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute(
      'content',
      theme === 'dark' ? '#0f0f11' : '#ffffff'
    );
  }
}

// ============================================================================
// STORE
// ============================================================================

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Theme Actions
        setTheme: (theme) => {
          const resolvedTheme = getResolvedTheme(theme);
          applyTheme(resolvedTheme);
          
          set({ theme, resolvedTheme });
        },
        
        toggleTheme: () => {
          const current = get().resolvedTheme;
          const newTheme = current === 'dark' ? 'light' : 'dark';
          
          applyTheme(newTheme);
          set({ theme: newTheme, resolvedTheme: newTheme });
        },
        
        // Connection Actions
        setConnectionStatus: (status, errorMessage) => {
          const connection = { ...get().connection };
          
          connection.status = status;
          
          if (status === 'connected') {
            connection.lastConnected = Date.now();
            connection.reconnectAttempts = 0;
            connection.errorMessage = undefined;
          } else if (status === 'reconnecting') {
            connection.reconnectAttempts += 1;
          } else if (status === 'error') {
            connection.errorMessage = errorMessage;
          }
          
          set({ connection });
        },
        
        updateLatency: (latency) => {
          set((state) => ({
            connection: { ...state.connection, latency }
          }));
        },
        
        // UI Actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        // Notification Actions
        addNotification: (notification) => {
          const id = generateId();
          const newNotification: Notification = {
            ...notification,
            id,
            createdAt: Date.now(),
            dismissible: notification.dismissible ?? true,
            duration: notification.duration ?? 5000,
          };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }));
          
          // Auto-remove after duration
          if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }
          
          return id;
        },
        
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
          }));
        },
        
        clearNotifications: () => set({ notifications: [] }),
        
        // Debug Actions
        setDebugMode: (enabled) => set({ debugMode: enabled }),
        
        // Reset
        reset: () => {
          set(initialState);
          applyTheme(getResolvedTheme(initialState.theme));
        },
      }),
      {
        name: 'gcp-app-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          debugMode: state.debugMode,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

// ============================================================================
// INITIALIZATION
// ============================================================================

// Apply initial theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('gcp-app-store');
  let theme: Theme = 'system';
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      theme = parsed.state?.theme ?? 'system';
    } catch {
      // Use default
    }
  }
  
  applyTheme(getResolvedTheme(theme));
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useAppStore.getState();
    if (state.theme === 'system') {
      const resolved = e.matches ? 'dark' : 'light';
      applyTheme(resolved);
      useAppStore.setState({ resolvedTheme: resolved });
    }
  });
}
