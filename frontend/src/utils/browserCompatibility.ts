/**
 * Browser Compatibility Utilities
 * Handles cross-browser compatibility checks and polyfills
 */

import React from 'react';
import type { BrowserInfo, BrowserFeatures, CompatibilityIssue } from '@/types/browser';

export type { BrowserInfo, BrowserFeatures, CompatibilityIssue };

class BrowserCompatibilityChecker {
  private static instance: BrowserCompatibilityChecker;
  private browserInfo: BrowserInfo | null = null;
  private compatibilityIssues: CompatibilityIssue[] = [];

  private constructor() {
    this.detectBrowser();
    this.checkCompatibility();
  }

  static getInstance(): BrowserCompatibilityChecker {
    if (!BrowserCompatibilityChecker.instance) {
      BrowserCompatibilityChecker.instance = new BrowserCompatibilityChecker();
    }
    return BrowserCompatibilityChecker.instance;
  }

  private detectBrowser(): void {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    // Browser detection
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    }

    // Device type detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    // Feature detection
    const features = this.detectFeatures();

    this.browserInfo = {
      name,
      version,
      engine,
      platform,
      isMobile,
      isTablet,
      isDesktop,
      features,
    };
  }

  private detectFeatures(): BrowserFeatures {
    return {
      webSocket: 'WebSocket' in window,
      webGL: this.hasWebGL(),
      webRTC: 'RTCPeerConnection' in window,
      serviceWorker: 'serviceWorker' in navigator,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      performanceObserver: 'PerformanceObserver' in window,
      webAssembly: 'WebAssembly' in window,
      es6Modules: this.hasES6Modules(),
      cssGrid: this.hasCSSFeature('grid'),
      cssFlexbox: this.hasCSSFeature('flex'),
      cssCustomProperties: this.hasCSSFeature('--test', 'red'),
      webAnimations: 'animate' in document.createElement('div'),
      localStorage: this.hasStorage('localStorage'),
      sessionStorage: this.hasStorage('sessionStorage'),
      indexedDB: 'indexedDB' in window,
      geolocation: 'geolocation' in navigator,
      deviceMotion: 'DeviceMotionEvent' in window,
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      mediaDevices: 'mediaDevices' in navigator,
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    };
  }

  private hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  private hasES6Modules(): boolean {
    try {
      return typeof Symbol !== 'undefined' &&
        typeof Promise !== 'undefined' &&
        typeof Map !== 'undefined' &&
        typeof Set !== 'undefined';
    } catch (e) {
      return false;
    }
  }

  private hasCSSFeature(property: string, value?: string): boolean {
    try {
      const element = document.createElement('div');
      const style = element.style as any;

      if (value) {
        style.setProperty(property, value);
        return style.getPropertyValue(property) === value;
      } else {
        return property in style;
      }
    } catch (e) {
      return false;
    }
  }

  private hasStorage(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  private checkCompatibility(): void {
    if (!this.browserInfo) return;

    const issues: CompatibilityIssue[] = [];
    const { features, name, version } = this.browserInfo;

    // Critical features
    if (!features.webSocket) {
      issues.push({
        feature: 'WebSocket',
        severity: 'error',
        message: 'WebSocket is not supported. Real-time gesture data will not work.',
        workaround: 'Please use a modern browser that supports WebSocket.',
      });
    }

    if (!features.es6Modules) {
      issues.push({
        feature: 'ES6 Modules',
        severity: 'error',
        message: 'ES6 modules are not supported. The application may not load correctly.',
        workaround: 'Please update your browser to a more recent version.',
      });
    }

    if (!features.localStorage) {
      issues.push({
        feature: 'Local Storage',
        severity: 'warning',
        message: 'Local Storage is not available. User preferences will not be saved.',
        workaround: 'Settings will reset when you refresh the page.',
      });
    }

    // Performance features
    if (!features.performanceObserver) {
      issues.push({
        feature: 'Performance Observer',
        severity: 'info',
        message: 'Performance monitoring is limited in this browser.',
        workaround: 'Some performance metrics will not be available.',
      });
    }

    if (!features.intersectionObserver) {
      issues.push({
        feature: 'Intersection Observer',
        severity: 'warning',
        message: 'Intersection Observer is not supported. Some animations may not work optimally.',
        polyfill: 'intersection-observer',
      });
    }

    // CSS features
    if (!features.cssGrid) {
      issues.push({
        feature: 'CSS Grid',
        severity: 'warning',
        message: 'CSS Grid is not supported. Layout may not display correctly.',
        workaround: 'The layout will fall back to flexbox.',
      });
    }

    if (!features.cssCustomProperties) {
      issues.push({
        feature: 'CSS Custom Properties',
        severity: 'warning',
        message: 'CSS Custom Properties (variables) are not supported. Theming may not work.',
        workaround: 'Static styles will be used instead.',
      });
    }

    // Browser-specific issues
    if (name === 'Safari' && parseInt(version) < 14) {
      issues.push({
        feature: 'Safari Version',
        severity: 'warning',
        message: 'Safari version is outdated. Some features may not work correctly.',
        workaround: 'Please update Safari to version 14 or later.',
      });
    }

    if (name === 'Firefox' && parseInt(version) < 78) {
      issues.push({
        feature: 'Firefox Version',
        severity: 'warning',
        message: 'Firefox version is outdated. Some features may not work correctly.',
        workaround: 'Please update Firefox to version 78 or later.',
      });
    }

    if (name === 'Chrome' && parseInt(version) < 80) {
      issues.push({
        feature: 'Chrome Version',
        severity: 'warning',
        message: 'Chrome version is outdated. Some features may not work correctly.',
        workaround: 'Please update Chrome to version 80 or later.',
      });
    }

    // Mobile-specific checks
    if (this.browserInfo.isMobile) {
      if (!features.touchEvents) {
        issues.push({
          feature: 'Touch Events',
          severity: 'warning',
          message: 'Touch events are not supported on this mobile device.',
          workaround: 'Some touch interactions may not work.',
        });
      }

      if (!features.deviceMotion) {
        issues.push({
          feature: 'Device Motion',
          severity: 'info',
          message: 'Device motion events are not available.',
          workaround: 'Motion-based gestures will not work.',
        });
      }
    }

    this.compatibilityIssues = issues;
  }

  // Public API
  getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo;
  }

  getCompatibilityIssues(): CompatibilityIssue[] {
    return [...this.compatibilityIssues];
  }

  isFeatureSupported(feature: keyof BrowserFeatures): boolean {
    return this.browserInfo?.features[feature] || false;
  }

  isBrowserSupported(): boolean {
    const criticalIssues = this.compatibilityIssues.filter(issue => issue.severity === 'error');
    return criticalIssues.length === 0;
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.browserInfo) return recommendations;

    const { name, version } = this.browserInfo;
    const versionNum = parseInt(version);

    // Browser update recommendations
    if (name === 'Chrome' && versionNum < 90) {
      recommendations.push('Update Chrome to the latest version for the best experience.');
    }
    if (name === 'Firefox' && versionNum < 85) {
      recommendations.push('Update Firefox to the latest version for the best experience.');
    }
    if (name === 'Safari' && versionNum < 15) {
      recommendations.push('Update Safari to the latest version for the best experience.');
    }
    if (name === 'Edge' && versionNum < 90) {
      recommendations.push('Update Edge to the latest version for the best experience.');
    }

    // Feature-specific recommendations
    if (!this.isFeatureSupported('webSocket')) {
      recommendations.push('Use a modern browser that supports WebSocket for real-time features.');
    }
    if (!this.isFeatureSupported('webGL')) {
      recommendations.push('Enable hardware acceleration for better performance.');
    }
    if (!this.isFeatureSupported('serviceWorker')) {
      recommendations.push('Use a browser that supports Service Workers for offline functionality.');
    }

    return recommendations;
  }

  // Polyfill loading
  async loadPolyfills(): Promise<void> {
    const polyfillsNeeded: string[] = [];

    if (!this.isFeatureSupported('intersectionObserver')) {
      polyfillsNeeded.push('intersection-observer');
    }
    if (!this.isFeatureSupported('resizeObserver')) {
      polyfillsNeeded.push('resize-observer-polyfill');
    }

    // Load polyfills dynamically
    for (const polyfill of polyfillsNeeded) {
      try {
        await this.loadPolyfill(polyfill);
        console.log(`✅ Loaded polyfill: ${polyfill}`);
      } catch (error) {
        console.warn(`❌ Failed to load polyfill: ${polyfill}`, error);
      }
    }
  }

  private async loadPolyfill(name: string): Promise<void> {
    // In a real application, you would load these from a CDN or bundle them
    // For now, we'll just log that they would be loaded
    console.log(`Loading polyfill: ${name}`);

    // Example of how you might load a polyfill:
    // return import(`https://polyfill.io/v3/polyfill.min.js?features=${name}`);
  }

  // Utility methods
  logCompatibilityReport(): void {
    if (!this.browserInfo) return;

    console.group('🌐 Browser Compatibility Report');
    console.log('Browser:', `${this.browserInfo.name} ${this.browserInfo.version}`);
    console.log('Engine:', this.browserInfo.engine);
    console.log('Platform:', this.browserInfo.platform);
    console.log('Device Type:', {
      mobile: this.browserInfo.isMobile,
      tablet: this.browserInfo.isTablet,
      desktop: this.browserInfo.isDesktop,
    });

    console.group('Features');
    Object.entries(this.browserInfo.features).forEach(([feature, supported]) => {
      console.log(`${supported ? '✅' : '❌'} ${feature}`);
    });
    console.groupEnd();

    if (this.compatibilityIssues.length > 0) {
      console.group('Issues');
      this.compatibilityIssues.forEach(issue => {
        const icon = issue.severity === 'error' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${issue.feature}: ${issue.message}`);
        if (issue.workaround) {
          console.log(`   Workaround: ${issue.workaround}`);
        }
      });
      console.groupEnd();
    }

    const recommendations = this.getRecommendations();
    if (recommendations.length > 0) {
      console.group('Recommendations');
      recommendations.forEach(rec => console.log(`💡 ${rec}`));
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const browserCompatibility = BrowserCompatibilityChecker.getInstance();

// React hook for browser compatibility
export function useBrowserCompatibility() {
  const [browserInfo, setBrowserInfo] = React.useState<BrowserInfo | null>(null);
  const [issues, setIssues] = React.useState<CompatibilityIssue[]>([]);
  const [isSupported, setIsSupported] = React.useState(true);

  React.useEffect(() => {
    const checker = BrowserCompatibilityChecker.getInstance();
    setBrowserInfo(checker.getBrowserInfo());
    setIssues(checker.getCompatibilityIssues());
    setIsSupported(checker.isBrowserSupported());

    // Load polyfills if needed
    checker.loadPolyfills();

    // Log compatibility report in development
    if (process.env.NODE_ENV === 'development') {
      checker.logCompatibilityReport();
    }
  }, []);

  return {
    browserInfo,
    issues,
    isSupported,
    isFeatureSupported: (feature: keyof BrowserFeatures) =>
      browserCompatibility.isFeatureSupported(feature),
    getRecommendations: () => browserCompatibility.getRecommendations(),
  };
}

export default browserCompatibility;