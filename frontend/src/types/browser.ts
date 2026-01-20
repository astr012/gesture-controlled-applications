export interface BrowserFeatures {
    webSocket: boolean;
    webGL: boolean;
    webRTC: boolean;
    serviceWorker: boolean;
    intersectionObserver: boolean;
    resizeObserver: boolean;
    performanceObserver: boolean;
    webAssembly: boolean;
    es6Modules: boolean;
    cssGrid: boolean;
    cssFlexbox: boolean;
    cssCustomProperties: boolean;
    webAnimations: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    geolocation: boolean;
    deviceMotion: boolean;
    touchEvents: boolean;
    pointerEvents: boolean;
    mediaDevices: boolean;
    webAudio: boolean;
}

export interface BrowserInfo {
    name: string;
    version: string;
    engine: string;
    platform: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    features: BrowserFeatures;
}

export interface CompatibilityIssue {
    feature: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    workaround?: string;
    polyfill?: string;
}
