/**
 * Environment detection utilities
 * Provides a Jest-compatible way to detect the environment
 */

// Helper to safely get Vite environment mode
const getViteMode = (): string | null => {
  // Check if we're in a browser/Vite environment
  // Jest doesn't have window.document, so this check helps us avoid import.meta issues
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Use eval to avoid Jest parsing import.meta at compile time
    try {
      // eslint-disable-next-line no-eval
      const mode = eval('typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.MODE : null');
      return mode;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Check if we're in development mode
export const isDevelopment = (): boolean => {
  // In Jest/test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // Try Vite environment
  const viteMode = getViteMode();
  if (viteMode) {
    return viteMode === 'development';
  }
  
  // Fallback to NODE_ENV
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }
  
  return false;
};

// Check if we're in production mode
export const isProduction = (): boolean => {
  // In Jest/test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // Try Vite environment
  const viteMode = getViteMode();
  if (viteMode) {
    return viteMode === 'production';
  }
  
  // Fallback to NODE_ENV
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'production';
  }
  
  return false;
};

// Check if we're in test mode
export const isTest = (): boolean => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return true;
  }
  
  const viteMode = getViteMode();
  if (viteMode) {
    return viteMode === 'test';
  }
  
  return false;
};

// Get the current environment mode
export const getMode = (): string => {
  if (isTest()) return 'test';
  if (isDevelopment()) return 'development';
  if (isProduction()) return 'production';
  return 'unknown';
};
