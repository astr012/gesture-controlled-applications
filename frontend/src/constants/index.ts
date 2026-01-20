// Application constants
export const APP_CONFIG = {
  name: 'Gesture Control Platform',
  version: '2.0.0',
  description: 'Modern gesture control application with Apple-inspired design',
} as const;

// WebSocket configuration
export const WEBSOCKET_CONFIG = {
  url: 'ws://localhost:8000/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
} as const;

// Layout constants following Apple's 8-point grid system
export const LAYOUT_CONFIG = {
  headerHeight: 64,
  sidebarWidth: 320,
  sidebarCollapsedWidth: 80,
  contentPadding: 24,
  gridUnit: 8, // Apple's 8-point grid system
} as const;

// Animation constants following Apple's motion principles
export const ANIMATION_CONFIG = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    standard: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  },
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  wide: 1440,
} as const;

// Theme constants
export const THEME_CONFIG = {
  colors: {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    purple: '#AF52DE',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
} as const;
