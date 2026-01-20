// Apple-Inspired Accessibility Utilities

// ARIA Live Region Management
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus Management
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Keyboard Navigation Helpers
export const handleArrowNavigation = (
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onIndexChange: (index: number) => void,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
  } = {}
): void => {
  const { loop = true, orientation = 'both' } = options;
  
  let newIndex = currentIndex;

  switch (e.key) {
    case 'ArrowUp':
      if (orientation === 'vertical' || orientation === 'both') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? items.length - 1 : currentIndex);
        e.preventDefault();
      }
      break;
    case 'ArrowDown':
      if (orientation === 'vertical' || orientation === 'both') {
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : (loop ? 0 : currentIndex);
        e.preventDefault();
      }
      break;
    case 'ArrowLeft':
      if (orientation === 'horizontal' || orientation === 'both') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? items.length - 1 : currentIndex);
        e.preventDefault();
      }
      break;
    case 'ArrowRight':
      if (orientation === 'horizontal' || orientation === 'both') {
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : (loop ? 0 : currentIndex);
        e.preventDefault();
      }
      break;
    case 'Home':
      newIndex = 0;
      e.preventDefault();
      break;
    case 'End':
      newIndex = items.length - 1;
      e.preventDefault();
      break;
  }

  if (newIndex !== currentIndex) {
    onIndexChange(newIndex);
    items[newIndex]?.focus();
  }
};

// ARIA Attributes Helpers
export const generateId = (prefix: string = 'element'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createAriaDescribedBy = (ids: string[]): string => {
  return ids.filter(Boolean).join(' ');
};

// Color Contrast Utilities
export const meetsContrastRequirement = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  // This is a simplified version - in production, you'd use a proper color contrast library
  const requiredRatio = level === 'AAA' ? 7 : 4.5;
  
  // Convert hex to RGB and calculate luminance
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return ratio >= requiredRatio;
};

// Screen Reader Utilities
export const isScreenReaderActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for common screen reader indicators
  return !!(
    window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack/i) ||
    window.speechSynthesis?.speaking ||
    document.querySelector('[aria-live]')
  );
};

// Reduced Motion Detection
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High Contrast Detection
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Touch Device Detection
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Keyboard-only Navigation Detection
export const isKeyboardUser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  let keyboardUser = false;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      keyboardUser = true;
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  
  const handleMouseDown = () => {
    keyboardUser = false;
    document.removeEventListener('mousedown', handleMouseDown);
  };
  
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);
  
  return keyboardUser;
};

// ARIA Live Region Types
export type AriaLiveType = 'off' | 'polite' | 'assertive';

// Common ARIA Roles
export type AriaRole = 
  | 'button'
  | 'link'
  | 'menuitem'
  | 'tab'
  | 'tabpanel'
  | 'dialog'
  | 'alertdialog'
  | 'status'
  | 'alert'
  | 'region'
  | 'navigation'
  | 'main'
  | 'complementary'
  | 'banner'
  | 'contentinfo';

// Accessibility Props Interface
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: AriaLiveType;
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-controls'?: string;
  'aria-owns'?: string;
  role?: AriaRole;
  tabIndex?: number;
}

// Gesture-specific accessibility helpers
export const announceGestureDetection = (gesture: string, confidence?: number): void => {
  const message = confidence 
    ? `${gesture} detected with ${Math.round(confidence * 100)}% confidence`
    : `${gesture} detected`;
  
  announceToScreenReader(message, 'polite');
};

export const announceConnectionStatus = (status: 'connected' | 'disconnected' | 'error'): void => {
  const messages = {
    connected: 'Camera connected successfully',
    disconnected: 'Camera disconnected',
    error: 'Camera connection error'
  };
  
  announceToScreenReader(messages[status], 'assertive');
};