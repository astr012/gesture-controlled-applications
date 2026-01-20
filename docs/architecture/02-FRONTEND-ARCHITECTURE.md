# Frontend Dashboard Architecture

> **Document**: 02-FRONTEND-ARCHITECTURE.md  
> **Version**: 2.0.0  
> **Scope**: Enterprise dashboard-based UI architecture with modern design patterns

---

## Overview

The frontend architecture follows an **enterprise dashboard philosophy** with feature-based module organization, centralized state management, and a comprehensive design system.

---

## Architectural Principles

### 1. Feature-First Organization

```
src/
├── features/           # Domain-specific modules (vertical slices)
│   ├── dashboard/      # Main dashboard
│   ├── finger-count/   # Finger counting feature
│   ├── volume-control/ # Volume control feature
│   └── analytics/      # Analytics dashboard
├── components/         # Shared UI components (horizontal layer)
├── services/           # Data layer (API, WebSocket)
└── state/              # Global state management
```

### 2. Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION SHELL                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌───────────────────────────────────────────────────────────────┐ │
│  │             │  │                      HEADER                                    │ │
│  │             │  │  [Logo]  [Navigation]  [Status]  [Settings]  [User]           │ │
│  │             │  └───────────────────────────────────────────────────────────────┘ │
│  │             │  ┌───────────────────────────────────────────────────────────────┐ │
│  │   SIDEBAR   │  │                     CONTENT AREA                              │ │
│  │             │  │                                                               │ │
│  │  [Dashboard]│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  [Projects] │  │  │              PAGE COMPONENT (Route-based)               │ │ │
│  │  [Analytics]│  │  │                                                         │ │ │
│  │  [Settings] │  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │ │
│  │             │  │  │  │   Widget 1   │  │   Widget 2   │  │   Widget 3   │  │ │ │
│  │             │  │  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │ │
│  │             │  │  │                                                         │ │ │
│  │             │  │  └─────────────────────────────────────────────────────────┘ │ │
│  │             │  │                                                               │ │
│  └─────────────┘  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                              STATUS BAR                                        │   │
│  │  [Connection Status]  [FPS]  [Latency]  [Memory]  [Notifications]             │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Application Shell

### AppShell Component

```tsx
// app/layout/AppShell.tsx

import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { useAppStore } from '@/state/stores/appStore';
import styles from './AppShell.module.css';

interface AppShellProps {
  children?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { sidebarCollapsed, theme } = useAppStore();
  
  return (
    <div 
      className={styles.shell}
      data-theme={theme}
      data-sidebar-collapsed={sidebarCollapsed}
    >
      <Header className={styles.header} />
      
      <div className={styles.body}>
        <Sidebar 
          className={styles.sidebar}
          collapsed={sidebarCollapsed}
        />
        
        <main className={styles.content}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
            {children}
          </Suspense>
        </main>
      </div>
      
      <StatusBar className={styles.statusBar} />
    </div>
  );
};

const PageSkeleton: React.FC = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonHeader} />
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonCard} />
      <div className={styles.skeletonCard} />
      <div className={styles.skeletonCard} />
    </div>
  </div>
);

export default AppShell;
```

### CSS Module

```css
/* app/layout/AppShell.module.css */

.shell {
  display: grid;
  grid-template-rows: var(--header-height) 1fr var(--status-bar-height);
  grid-template-columns: 1fr;
  height: 100vh;
  overflow: hidden;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
}

.header {
  grid-row: 1;
  z-index: var(--z-header);
}

.body {
  grid-row: 2;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  overflow: hidden;
  transition: grid-template-columns var(--transition-normal);
}

[data-sidebar-collapsed="true"] .body {
  grid-template-columns: var(--sidebar-width-collapsed) 1fr;
}

.sidebar {
  overflow-y: auto;
  overflow-x: hidden;
}

.content {
  overflow-y: auto;
  padding: var(--spacing-lg);
  background: var(--color-background-secondary);
}

.statusBar {
  grid-row: 3;
  z-index: var(--z-status-bar);
}

/* Skeleton loading states */
.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

.skeletonHeader {
  height: 48px;
  background: var(--color-skeleton);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeletonContent {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.skeletonCard {
  height: 200px;
  background: var(--color-skeleton);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## State Management

### Zustand Store Architecture

```typescript
// state/stores/appStore.ts

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  latency: number;
  quality: 'excellent' | 'good' | 'poor' | 'unknown';
  lastConnected: number | null;
}

interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  
  // Connection State
  connection: ConnectionState;
  
  // Notification State
  notifications: Notification[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  updateConnection: (connection: Partial<ConnectionState>) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  dismissible: boolean;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        theme: 'system',
        sidebarCollapsed: false,
        connection: {
          status: 'disconnected',
          latency: 0,
          quality: 'unknown',
          lastConnected: null,
        },
        notifications: [],
        
        // Actions
        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),
        
        toggleSidebar: () => set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }),
        
        updateConnection: (connection) => set((state) => {
          state.connection = { ...state.connection, ...connection };
        }),
        
        addNotification: (notification) => set((state) => {
          state.notifications.push({
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          });
        }),
        
        dismissNotification: (id) => set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        }),
      })),
      {
        name: 'gcp-app-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
```

### Project Store

```typescript
// state/stores/projectStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ProjectType, GestureData, ProjectSettings } from '@/types';

interface ProjectState {
  // Active Project
  activeProject: ProjectType | null;
  isRunning: boolean;
  
  // Gesture Data
  currentGesture: GestureData | null;
  gestureHistory: GestureData[];
  
  // Settings
  projectSettings: Record<ProjectType, ProjectSettings>;
  
  // Metrics
  fps: number;
  processingLatency: number;
  
  // Actions
  setActiveProject: (project: ProjectType | null) => void;
  startProject: () => void;
  stopProject: () => void;
  updateGestureData: (data: GestureData) => void;
  updateSettings: (project: ProjectType, settings: Partial<ProjectSettings>) => void;
  updateMetrics: (fps: number, latency: number) => void;
  clearHistory: () => void;
}

const defaultSettings: ProjectSettings = {
  displayMode: 'detailed',
  showDebugInfo: false,
  sensitivity: 0.5,
};

export const useProjectStore = create<ProjectState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      activeProject: null,
      isRunning: false,
      currentGesture: null,
      gestureHistory: [],
      projectSettings: {
        finger_count: { ...defaultSettings },
        volume_control: { ...defaultSettings, volumeStep: 5 },
        virtual_mouse: { ...defaultSettings, sensitivity: 1.0, smoothing: false },
      },
      fps: 0,
      processingLatency: 0,
      
      // Actions
      setActiveProject: (project) => set((state) => {
        state.activeProject = project;
        state.currentGesture = null;
        state.gestureHistory = [];
      }),
      
      startProject: () => set((state) => {
        state.isRunning = true;
      }),
      
      stopProject: () => set((state) => {
        state.isRunning = false;
        state.fps = 0;
        state.processingLatency = 0;
      }),
      
      updateGestureData: (data) => set((state) => {
        state.currentGesture = data;
        
        // Keep last 100 frames in history
        state.gestureHistory.push(data);
        if (state.gestureHistory.length > 100) {
          state.gestureHistory.shift();
        }
      }),
      
      updateSettings: (project, settings) => set((state) => {
        state.projectSettings[project] = {
          ...state.projectSettings[project],
          ...settings,
        };
      }),
      
      updateMetrics: (fps, latency) => set((state) => {
        state.fps = fps;
        state.processingLatency = latency;
      }),
      
      clearHistory: () => set((state) => {
        state.gestureHistory = [];
      }),
    })),
    { name: 'ProjectStore' }
  )
);
```

---

## Feature Module Structure

### Dashboard Feature

```typescript
// features/dashboard/index.ts

export { default as DashboardPage } from './DashboardPage';
export { default as DashboardLayout } from './DashboardLayout';
export * from './components';
export * from './hooks';
```

```tsx
// features/dashboard/DashboardPage.tsx

import React from 'react';
import DashboardLayout from './DashboardLayout';
import ProjectGrid from './components/ProjectGrid';
import StatsPanel from './components/StatsPanel';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';
import SystemHealth from './components/SystemHealth';
import { useDashboardStats } from './hooks/useDashboardStats';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => {
  const { stats, isLoading } = useDashboardStats();
  
  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome to the Gesture Control Platform
          </p>
        </header>
        
        <section className={styles.statsRow}>
          <StatsPanel stats={stats} isLoading={isLoading} />
        </section>
        
        <div className={styles.mainGrid}>
          <section className={styles.projectsSection}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <ProjectGrid />
          </section>
          
          <aside className={styles.sidebar}>
            <QuickActions />
            <SystemHealth />
            <RecentActivity />
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
```

### Project Grid Component

```tsx
// features/dashboard/components/ProjectGrid.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { projectRegistry } from '@/projects/registry';
import { useProjectStore } from '@/state/stores/projectStore';
import styles from './ProjectGrid.module.css';

const ProjectGrid: React.FC = () => {
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const projects = projectRegistry.getEnabledProjects();
  
  return (
    <div className={styles.grid}>
      {projects.map((project) => (
        <Card
          key={project.id}
          className={styles.projectCard}
          variant="elevated"
          hoverable
          onClick={() => navigate(project.route)}
          data-active={activeProject === project.id}
        >
          <div className={styles.cardHeader}>
            <span className={styles.icon}>{project.icon}</span>
            <Badge 
              variant={project.category === 'advanced' ? 'accent' : 'default'}
              size="sm"
            >
              {project.category}
            </Badge>
          </div>
          
          <div className={styles.cardBody}>
            <h3 className={styles.projectName}>{project.name}</h3>
            <p className={styles.projectDescription}>{project.description}</p>
          </div>
          
          <div className={styles.cardFooter}>
            <span className={styles.version}>v{project.version}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(project.route);
              }}
            >
              Launch →
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProjectGrid;
```

---

## Project Execution Page

### Unified Project Layout

```tsx
// features/projects/ProjectPage.tsx

import React, { Suspense, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { urlToProjectId } from '@/projects/registry';
import { useProjectStore } from '@/state/stores/projectStore';
import { useWebSocketHub } from '@/services/websocket/useWebSocketHub';
import ProjectLayout from './ProjectLayout';
import GestureCanvas from './components/GestureCanvas';
import ControlPanel from './components/ControlPanel';
import MetricsPanel from './components/MetricsPanel';
import SettingsDrawer from './components/SettingsDrawer';
import ProjectContent from './components/ProjectContent';
import { LoadingState, ErrorState } from '@/components/feedback';
import styles from './ProjectPage.module.css';

const ProjectPage: React.FC = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const navigate = useNavigate();
  
  const projectId = urlToProjectId(projectSlug || '');
  
  const {
    activeProject,
    isRunning,
    currentGesture,
    projectSettings,
    fps,
    processingLatency,
    setActiveProject,
    startProject,
    stopProject,
    updateGestureData,
  } = useProjectStore();
  
  const {
    isConnected,
    connect,
    disconnect,
    subscribe,
  } = useWebSocketHub();
  
  // Initialize project
  useEffect(() => {
    if (!projectId) {
      navigate('/404');
      return;
    }
    
    setActiveProject(projectId);
    
    return () => {
      stopProject();
      setActiveProject(null);
    };
  }, [projectId]);
  
  // Subscribe to gesture data
  useEffect(() => {
    if (!isConnected || !projectId) return;
    
    const unsubscribe = subscribe(projectId, (data) => {
      updateGestureData(data);
    });
    
    return () => {
      unsubscribe();
    };
  }, [isConnected, projectId]);
  
  if (!projectId) {
    return <ErrorState message="Project not found" />;
  }
  
  const settings = projectSettings[projectId];
  
  return (
    <ProjectLayout projectId={projectId}>
      <div className={styles.container}>
        <div className={styles.mainArea}>
          <GestureCanvas
            gestureData={currentGesture}
            isRunning={isRunning}
            onStart={startProject}
            onStop={stopProject}
          />
          
          <Suspense fallback={<LoadingState message="Loading project..." />}>
            <ProjectContent
              projectId={projectId}
              gestureData={currentGesture}
              settings={settings}
            />
          </Suspense>
        </div>
        
        <aside className={styles.sidebar}>
          <ControlPanel
            isConnected={isConnected}
            isRunning={isRunning}
            onConnect={connect}
            onDisconnect={disconnect}
            onStart={startProject}
            onStop={stopProject}
          />
          
          <MetricsPanel
            fps={fps}
            latency={processingLatency}
            handsDetected={currentGesture?.hands_detected || 0}
          />
        </aside>
      </div>
      
      <SettingsDrawer projectId={projectId} />
    </ProjectLayout>
  );
};

export default ProjectPage;
```

### Gesture Canvas Component

```tsx
// features/projects/components/GestureCanvas.tsx

import React, { useRef, useEffect, useCallback } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import type { GestureData } from '@/types';
import styles from './GestureCanvas.module.css';

interface GestureCanvasProps {
  gestureData: GestureData | null;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

const GestureCanvas: React.FC<GestureCanvasProps> = ({
  gestureData,
  isRunning,
  onStart,
  onStop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw hand landmarks on canvas
  const drawLandmarks = useCallback((data: GestureData) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.hands) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw each hand
    data.hands.forEach((hand) => {
      const landmarks = hand.landmarks;
      if (!landmarks) return;
      
      // Draw connections
      drawConnections(ctx, landmarks);
      
      // Draw landmark points
      landmarks.forEach((lm, index) => {
        drawLandmarkPoint(ctx, lm, index);
      });
    });
  }, []);
  
  useEffect(() => {
    if (gestureData) {
      drawLandmarks(gestureData);
    }
  }, [gestureData, drawLandmarks]);
  
  return (
    <Card className={styles.canvasCard} variant="elevated">
      <div className={styles.header}>
        <h2 className={styles.title}>Hand Tracking</h2>
        <div className={styles.badges}>
          <Badge 
            variant={isRunning ? 'success' : 'default'}
            size="sm"
            pulse={isRunning}
          >
            {isRunning ? 'Active' : 'Inactive'}
          </Badge>
          {gestureData && (
            <Badge variant="info" size="sm">
              {gestureData.hands_detected} hand{gestureData.hands_detected !== 1 ? 's' : ''} detected
            </Badge>
          )}
        </div>
      </div>
      
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={640}
          height={480}
        />
        
        {!isRunning && (
          <div className={styles.overlay}>
            <Button
              variant="primary"
              size="lg"
              onClick={onStart}
            >
              Start Tracking
            </Button>
          </div>
        )}
      </div>
      
      <div className={styles.controls}>
        <Button
          variant={isRunning ? 'danger' : 'primary'}
          onClick={isRunning ? onStop : onStart}
        >
          {isRunning ? 'Stop' : 'Start'}
        </Button>
      </div>
    </Card>
  );
};

// Helper functions for drawing
const drawConnections = (
  ctx: CanvasRenderingContext2D,
  landmarks: any[]
) => {
  // MediaPipe hand connections
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],      // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],      // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17],           // Palm
  ];
  
  ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
  ctx.lineWidth = 2;
  
  connections.forEach(([start, end]) => {
    const lmStart = landmarks[start];
    const lmEnd = landmarks[end];
    
    if (lmStart && lmEnd) {
      ctx.beginPath();
      ctx.moveTo(lmStart.pixel_x, lmStart.pixel_y);
      ctx.lineTo(lmEnd.pixel_x, lmEnd.pixel_y);
      ctx.stroke();
    }
  });
};

const drawLandmarkPoint = (
  ctx: CanvasRenderingContext2D,
  landmark: any,
  index: number
) => {
  const isFingertip = [4, 8, 12, 16, 20].includes(index);
  const radius = isFingertip ? 6 : 4;
  
  // Outer glow
  ctx.beginPath();
  ctx.arc(landmark.pixel_x, landmark.pixel_y, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = isFingertip 
    ? 'rgba(236, 72, 153, 0.3)' 
    : 'rgba(102, 126, 234, 0.3)';
  ctx.fill();
  
  // Inner point
  ctx.beginPath();
  ctx.arc(landmark.pixel_x, landmark.pixel_y, radius, 0, Math.PI * 2);
  ctx.fillStyle = isFingertip 
    ? 'rgb(236, 72, 153)' 
    : 'rgb(102, 126, 234)';
  ctx.fill();
  
  // White center
  ctx.beginPath();
  ctx.arc(landmark.pixel_x, landmark.pixel_y, radius / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
};

export default GestureCanvas;
```

---

## Component Library

### Button Component

```tsx
// components/ui/Button/Button.tsx

import React, { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner}>
          <svg viewBox="0 0 24 24" className={styles.spinnerIcon}>
            <circle
              cx="12" cy="12" r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="32"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      
      {!loading && leftIcon && (
        <span className={styles.leftIcon}>{leftIcon}</span>
      )}
      
      <span className={styles.label}>{children}</span>
      
      {!loading && rightIcon && (
        <span className={styles.rightIcon}>{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
```

```css
/* components/ui/Button/Button.module.css */

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-sans);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  line-height: 1;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  white-space: nowrap;
}

.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.primary {
  background: var(--color-primary-gradient);
  color: white;
  box-shadow: var(--shadow-sm);
}

.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.primary:active:not(:disabled) {
  transform: translateY(0);
}

.secondary {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.secondary:hover:not(:disabled) {
  background: var(--color-background-quaternary);
  border-color: var(--color-border-hover);
}

.ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.ghost:hover:not(:disabled) {
  background: var(--color-background-hover);
  color: var(--color-text-primary);
}

.danger {
  background: var(--color-danger);
  color: white;
}

.danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}

.success {
  background: var(--color-success);
  color: white;
}

.success:hover:not(:disabled) {
  background: var(--color-success-hover);
}

/* Sizes */
.sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  border-radius: var(--radius-sm);
}

.md {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.lg {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
}

/* States */
.fullWidth {
  width: 100%;
}

.loading .label {
  opacity: 0;
}

.spinner {
  position: absolute;
}

.spinnerIcon {
  width: 1em;
  height: 1em;
  animation: spin 0.8s linear infinite;
}

.leftIcon,
.rightIcon {
  display: flex;
  align-items: center;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Card Component

```tsx
// components/ui/Card/Card.tsx

import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        hoverable && styles.hoverable,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
```

```css
/* components/ui/Card/Card.module.css */

.card {
  background: var(--color-card-background);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}

/* Variants */
.default {
  border: 1px solid var(--color-border);
}

.elevated {
  box-shadow: var(--shadow-md);
}

.outlined {
  border: 2px solid var(--color-border);
  background: transparent;
}

.glass {
  background: var(--color-glass-background);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-glass-border);
}

/* Hover */
.hoverable {
  cursor: pointer;
}

.hoverable:hover {
  transform: translateY(-2px);
}

.hoverable.elevated:hover {
  box-shadow: var(--shadow-lg);
}

.hoverable.default:hover,
.hoverable.outlined:hover {
  border-color: var(--color-primary);
}

/* Padding */
.padding-none { padding: 0; }
.padding-sm { padding: var(--spacing-sm); }
.padding-md { padding: var(--spacing-md); }
.padding-lg { padding: var(--spacing-lg); }
```

---

## WebSocket Hub Service

```typescript
// services/websocket/WebSocketHub.ts

import type { GestureData, ProjectType } from '@/types';
import { useAppStore } from '@/state/stores/appStore';

type MessageHandler = (data: GestureData) => void;
type ConnectionHandler = (connected: boolean) => void;

interface Subscription {
  id: string;
  project: ProjectType;
  handler: MessageHandler;
}

class WebSocketHub {
  private static instance: WebSocketHub;
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Subscription>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  static getInstance(): WebSocketHub {
    if (!WebSocketHub.instance) {
      WebSocketHub.instance = new WebSocketHub();
    }
    return WebSocketHub.instance;
  }
  
  connect(url = 'ws://localhost:8000/ws/gestures'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      
      this.ws = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new Error('Connection timeout'));
      }, 10000);
      
      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.notifyConnectionChange(true);
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        this.handleClose(event);
      };
      
      this.ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };
    });
  }
  
  disconnect(): void {
    this.clearReconnectTimeout();
    this.clearPingInterval();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.notifyConnectionChange(false);
  }
  
  subscribe(project: ProjectType, handler: MessageHandler): () => void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(id, { id, project, handler });
    
    // Request this project's data
    this.send({ type: 'subscribe', project });
    
    return () => {
      this.subscriptions.delete(id);
    };
  }
  
  selectProject(project: ProjectType): void {
    this.send({ type: 'project_select', payload: { project } });
  }
  
  send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }
  
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle pong (latency measurement)
      if (data.type === 'pong') {
        const latency = Date.now() - data.timestamp;
        useAppStore.getState().updateConnection({ latency });
        return;
      }
      
      // Route to subscribers
      this.subscriptions.forEach((subscription) => {
        if (!data.project || subscription.project === data.project) {
          try {
            subscription.handler(data);
          } catch (e) {
            console.error('Subscription handler error:', e);
          }
        }
      });
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }
  
  private handleClose(event: CloseEvent): void {
    this.clearPingInterval();
    this.ws = null;
    this.notifyConnectionChange(false);
    
    // Don't reconnect for normal closure
    if (event.code === 1000) return;
    
    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect(): void {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );
    
    useAppStore.getState().updateConnection({ status: 'reconnecting' });
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        await this.connect();
      } catch {
        this.handleClose(new CloseEvent('close', { code: 1006 }));
      }
    }, delay);
  }
  
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000);
  }
  
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  private notifyConnectionChange(connected: boolean): void {
    useAppStore.getState().updateConnection({
      status: connected ? 'connected' : 'disconnected',
      lastConnected: connected ? Date.now() : null,
    });
    
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (e) {
        console.error('Connection handler error:', e);
      }
    });
  }
}

export default WebSocketHub;

// React hook for WebSocket hub
export const useWebSocketHub = () => {
  const hub = WebSocketHub.getInstance();
  
  return {
    connect: () => hub.connect(),
    disconnect: () => hub.disconnect(),
    subscribe: (project: ProjectType, handler: MessageHandler) => 
      hub.subscribe(project, handler),
    selectProject: (project: ProjectType) => hub.selectProject(project),
    isConnected: hub.isConnected,
  };
};
```

---

## Routing Configuration

```tsx
// app/routing/routes.tsx

import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import AppShell from '@/app/layout/AppShell';
import { LoadingState, ErrorState } from '@/components/feedback';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ProjectPage = lazy(() => import('@/features/projects/ProjectPage'));
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppShell />} errorElement={<ErrorState />}>
      <Route index element={<DashboardPage />} />
      
      <Route 
        path="project/:projectSlug" 
        element={<ProjectPage />}
        errorElement={<ErrorState message="Project failed to load" />}
      />
      
      <Route path="analytics" element={<AnalyticsPage />} />
      
      <Route path="settings" element={<SettingsPage />} />
      
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
);

export default router;
```

---

## Summary

This frontend architecture provides:

1. **Feature-based organization** for scalable codebase
2. **Zustand stores** for efficient global state management
3. **Compound components** for reusable UI patterns
4. **CSS Modules + Design Tokens** for consistent styling
5. **WebSocket Hub** for centralized real-time communication
6. **Lazy loading** for optimal bundle splitting
7. **Comprehensive type safety** throughout

The architecture aligns with enterprise dashboard best practices while maintaining the flexibility needed for a gesture control application with real-time requirements.
