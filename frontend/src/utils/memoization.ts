/**
 * Advanced Memoization Utilities
 * Provides optimized memoization strategies for React components and functions
 */

import React from 'react';

// Deep equality check for complex objects
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

// Shallow equality check for objects
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key) || a[key] !== b[key]) return false;
  }
  
  return true;
}

// Enhanced React.memo with custom comparison
export function memo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoizedComponent<P> {
  return React.memo(Component, areEqual || shallowEqual);
}

// Deep memo for complex props
export function deepMemo<P extends object>(
  Component: React.ComponentType<P>
): React.MemoizedComponent<P> {
  return React.memo(Component, deepEqual);
}

// Memoized callback with dependency array optimization
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(callback, deps);
}

// Memoized value with deep comparison
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const ref = React.useRef<{ deps: React.DependencyList; value: T }>();
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }
  
  return ref.current.value;
}

// Stable reference hook - prevents unnecessary re-renders
export function useStableRef<T>(value: T): React.MutableRefObject<T> {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}

// Memoized object creation
export function useMemoizedObject<T extends Record<string, any>>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return React.useMemo(factory, deps);
}

// Optimized event handler creation
export function useEventHandler<T extends (...args: any[]) => any>(
  handler: T
): T {
  const handlerRef = useStableRef(handler);
  
  return React.useCallback(
    ((...args: any[]) => handlerRef.current(...args)) as T,
    []
  );
}

// Debounced value hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Throttled value hook
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastRun = React.useRef(Date.now());
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return throttledValue;
}

// Memoized selector for complex state
export function useSelector<TState, TSelected>(
  state: TState,
  selector: (state: TState) => TSelected,
  equalityFn: (a: TSelected, b: TSelected) => boolean = shallowEqual
): TSelected {
  const selectedRef = React.useRef<TSelected>();
  const selectorRef = useStableRef(selector);
  
  const selected = selectorRef.current(state);
  
  if (selectedRef.current === undefined || !equalityFn(selectedRef.current, selected)) {
    selectedRef.current = selected;
  }
  
  return selectedRef.current;
}

// Performance-optimized list rendering
export function useOptimizedList<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number,
  renderItem: (item: T, index: number) => React.ReactNode
): React.ReactNode[] {
  return React.useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      return React.createElement(
        React.Fragment,
        { key },
        renderItem(item, index)
      );
    });
  }, [items, keyExtractor, renderItem]);
}

// Memoized component factory
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoizedComponent<P> {
  const MemoizedComponent = React.memo(Component, areEqual);
  
  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }
  
  return MemoizedComponent;
}

// HOC for automatic memoization based on prop types
export function withAutoMemo<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    deep?: boolean;
    displayName?: string;
    customCompare?: (prevProps: P, nextProps: P) => boolean;
  } = {}
): React.MemoizedComponent<P> {
  const { deep = false, displayName, customCompare } = options;
  
  let compareFunction: ((prevProps: P, nextProps: P) => boolean) | undefined;
  
  if (customCompare) {
    compareFunction = customCompare;
  } else if (deep) {
    compareFunction = deepEqual;
  } else {
    compareFunction = shallowEqual;
  }
  
  const MemoizedComponent = React.memo(Component, compareFunction);
  
  if (displayName) {
    MemoizedComponent.displayName = displayName;
  } else {
    MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  }
  
  return MemoizedComponent;
}

// Context value memoization helper
export function useMemoizedContextValue<T extends Record<string, any>>(
  value: T
): T {
  const keys = Object.keys(value).sort();
  const deps = keys.map(key => value[key]);
  
  return React.useMemo(() => value, deps);
}

// Gesture data memoization (specific to our app)
export function useGestureDataMemo(gestureData: any) {
  return React.useMemo(() => {
    if (!gestureData) return null;
    
    // Only re-render if significant gesture data changes
    return {
      project: gestureData.project,
      timestamp: Math.floor(gestureData.timestamp / 100) * 100, // Round to 100ms
      hands_detected: gestureData.hands_detected,
      confidence: Math.round(gestureData.confidence * 10) / 10, // Round to 1 decimal
      // Include project-specific data
      ...gestureData,
    };
  }, [
    gestureData?.project,
    gestureData?.hands_detected,
    Math.floor((gestureData?.timestamp || 0) / 100),
    Math.round((gestureData?.confidence || 0) * 10),
    gestureData?.fingers, // For finger count
    gestureData?.volume, // For volume control
    gestureData?.mouse_x, // For virtual mouse
    gestureData?.mouse_y,
  ]);
}

// Settings memoization helper
export function useSettingsMemo(settings: Record<string, any>) {
  return React.useMemo(() => {
    // Create a stable reference for settings
    const sortedKeys = Object.keys(settings).sort();
    const stableSettings: Record<string, any> = {};
    
    sortedKeys.forEach(key => {
      stableSettings[key] = settings[key];
    });
    
    return stableSettings;
  }, [JSON.stringify(settings)]);
}

// Performance tracking for memoized components
export function useRenderTracking(componentName: string) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());
  
  React.useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔄 ${componentName} render #${renderCount.current} (${timeSinceLastRender}ms since last)`
      );
    }
  });
  
  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  };
}

export default {
  memo,
  deepMemo,
  useOptimizedCallback,
  useDeepMemo,
  useStableRef,
  useMemoizedObject,
  useEventHandler,
  useDebouncedValue,
  useThrottledValue,
  useSelector,
  useOptimizedList,
  createMemoizedComponent,
  withAutoMemo,
  useMemoizedContextValue,
  useGestureDataMemo,
  useSettingsMemo,
  useRenderTracking,
  deepEqual,
  shallowEqual,
};