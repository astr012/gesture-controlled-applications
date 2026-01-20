// Apple-Inspired Theme System
export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  theme: Theme;
  systemTheme: 'light' | 'dark';
}

// Theme detection and management
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

// Theme persistence
const THEME_STORAGE_KEY = 'gesture-control-theme';

export const saveTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const loadTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
  return saved || 'auto';
};

// Apply theme to document
export const applyTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  
  const effectiveTheme = getEffectiveTheme(theme);
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('theme-light', 'theme-dark');
  
  // Add new theme class
  root.classList.add(`theme-${effectiveTheme}`);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      effectiveTheme === 'dark' ? '#171717' : '#ffffff'
    );
  }
};

// System theme change listener
export const createThemeListener = (callback: (theme: 'light' | 'dark') => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
};

// Theme CSS custom properties for dark mode
export const darkThemeProperties = {
  '--white': '#000000',
  '--gray-50': '#0a0a0a',
  '--gray-100': '#171717',
  '--gray-200': '#262626',
  '--gray-300': '#404040',
  '--gray-400': '#525252',
  '--gray-500': '#737373',
  '--gray-600': '#a3a3a3',
  '--gray-700': '#d4d4d4',
  '--gray-800': '#e5e5e5',
  '--gray-900': '#fafafa',
  
  '--bg-primary': '#000000',
  '--bg-secondary': '#0a0a0a',
  '--border-color': '#262626',
  '--text-primary': '#fafafa',
  '--text-secondary': '#a3a3a3',
  
  '--blue-primary': '#0A84FF',
  '--blue-light': '#64D2FF',
  '--green-success': '#30D158',
  '--orange-warning': '#FF9F0A',
  '--red-error': '#FF453A',
  '--purple-accent': '#BF5AF2',
};

// Apply dark theme properties
export const applyDarkTheme = (): void => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  Object.entries(darkThemeProperties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

// Remove dark theme properties (revert to light)
export const removeDarkTheme = (): void => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  Object.keys(darkThemeProperties).forEach((property) => {
    root.style.removeProperty(property);
  });
};

// Theme utility class names
export const getThemeClasses = (theme: Theme): string => {
  const effectiveTheme = getEffectiveTheme(theme);
  return `theme-${effectiveTheme}`;
};

// Component theme variants
export const createThemeVariant = (
  lightStyles: string,
  darkStyles: string
): string => {
  return `${lightStyles} theme-dark:${darkStyles}`;
};