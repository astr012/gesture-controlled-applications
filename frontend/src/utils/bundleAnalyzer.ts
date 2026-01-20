/**
 * Bundle Analyzer Utility
 * Analyzes bundle sizes, loading performance, and optimization opportunities
 */

import React from 'react';
import PerformanceMonitor from '@/services/PerformanceMonitor';

export interface BundleInfo {
  name: string;
  size: number;
  loadTime: number;
  type: 'vendor' | 'app' | 'chunk' | 'css' | 'asset';
  cached: boolean;
  compressed: boolean;
  critical: boolean;
}

export interface BundleAnalysis {
  totalSize: number;
  totalLoadTime: number;
  bundles: BundleInfo[];
  recommendations: string[];
  performance: {
    score: number;
    metrics: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      timeToInteractive: number;
      totalBlockingTime: number;
    };
  };
  optimization: {
    unusedCode: number;
    duplicateCode: number;
    compressionRatio: number;
    cacheHitRate: number;
  };
}

class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private performanceMonitor: PerformanceMonitor;
  private resourceEntries: PerformanceResourceTiming[] = [];

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.collectResourceEntries();
  }

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  private collectResourceEntries(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
  }

  private getBundleType(url: string): BundleInfo['type'] {
    if (url.includes('vendor') || url.includes('node_modules')) return 'vendor';
    if (url.includes('.css')) return 'css';
    if (url.includes('.js')) return url.includes('chunk') ? 'chunk' : 'app';
    return 'asset';
  }

  private isCriticalResource(url: string): boolean {
    // Critical resources are those needed for initial render
    return url.includes('main') || 
           url.includes('vendor-react') || 
           url.includes('index') ||
           url.includes('app');
  }

  private calculateCompressionRatio(transferSize: number, decodedSize: number): number {
    if (decodedSize === 0) return 0;
    return (1 - (transferSize / decodedSize)) * 100;
  }

  private analyzeBundles(): BundleInfo[] {
    const bundles: BundleInfo[] = [];

    this.resourceEntries.forEach(entry => {
      if (entry.name.includes('.js') || entry.name.includes('.css')) {
        const url = new URL(entry.name);
        const filename = url.pathname.split('/').pop() || 'unknown';
        
        const bundle: BundleInfo = {
          name: filename,
          size: entry.decodedBodySize || entry.transferSize || 0,
          loadTime: entry.duration,
          type: this.getBundleType(entry.name),
          cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
          compressed: entry.transferSize < entry.decodedBodySize,
          critical: this.isCriticalResource(entry.name),
        };

        bundles.push(bundle);
      }
    });

    return bundles.sort((a, b) => b.size - a.size);
  }

  private generateRecommendations(bundles: BundleInfo[], analysis: Partial<BundleAnalysis>): string[] {
    const recommendations: string[] = [];
    
    // Large bundle recommendations
    const largeBundles = bundles.filter(b => b.size > 500 * 1024); // > 500KB
    if (largeBundles.length > 0) {
      recommendations.push(`Consider code splitting for large bundles: ${largeBundles.map(b => b.name).join(', ')}`);
    }

    // Slow loading recommendations
    const slowBundles = bundles.filter(b => b.loadTime > 1000); // > 1s
    if (slowBundles.length > 0) {
      recommendations.push(`Optimize loading for slow bundles: ${slowBundles.map(b => b.name).join(', ')}`);
    }

    // Compression recommendations
    const uncompressedBundles = bundles.filter(b => !b.compressed && b.size > 50 * 1024);
    if (uncompressedBundles.length > 0) {
      recommendations.push(`Enable compression for: ${uncompressedBundles.map(b => b.name).join(', ')}`);
    }

    // Caching recommendations
    const uncachedCritical = bundles.filter(b => b.critical && !b.cached);
    if (uncachedCritical.length > 0) {
      recommendations.push(`Improve caching for critical resources: ${uncachedCritical.map(b => b.name).join(', ')}`);
    }

    // Total size recommendations
    const totalSize = analysis.totalSize || 0;
    if (totalSize > 2 * 1024 * 1024) { // > 2MB
      recommendations.push('Total bundle size is large. Consider lazy loading non-critical features.');
    }

    // Performance recommendations
    if (analysis.performance && analysis.performance.score < 70) {
      recommendations.push('Bundle loading performance is below optimal. Consider preloading critical resources.');
    }

    // Vendor bundle recommendations
    const vendorBundles = bundles.filter(b => b.type === 'vendor');
    if (vendorBundles.length > 3) {
      recommendations.push('Consider consolidating vendor bundles to reduce HTTP requests.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Bundle configuration is well optimized!');
    }

    return recommendations;
  }

  private calculatePerformanceMetrics(): BundleAnalysis['performance'] {
    const metrics = this.performanceMonitor.getMetrics();
    
    const performanceMetrics = {
      firstContentfulPaint: metrics.fcp || 0,
      largestContentfulPaint: metrics.lcp || 0,
      timeToInteractive: 0, // Would need additional measurement
      totalBlockingTime: 0, // Would need additional measurement
    };

    // Calculate performance score based on Core Web Vitals
    let score = 100;
    if (performanceMetrics.firstContentfulPaint > 1800) score -= 20;
    if (performanceMetrics.largestContentfulPaint > 2500) score -= 30;
    if (performanceMetrics.timeToInteractive > 3800) score -= 25;
    if (performanceMetrics.totalBlockingTime > 300) score -= 25;

    return {
      score: Math.max(0, score),
      metrics: performanceMetrics,
    };
  }

  private calculateOptimizationMetrics(bundles: BundleInfo[]): BundleAnalysis['optimization'] {
    const totalTransferSize = bundles.reduce((sum, b) => sum + (b.compressed ? b.size * 0.7 : b.size), 0);
    const totalDecodedSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const cachedBundles = bundles.filter(b => b.cached).length;
    
    return {
      unusedCode: 0, // Would need additional analysis
      duplicateCode: 0, // Would need additional analysis
      compressionRatio: this.calculateCompressionRatio(totalTransferSize, totalDecodedSize),
      cacheHitRate: bundles.length > 0 ? (cachedBundles / bundles.length) * 100 : 0,
    };
  }

  // Public API
  async analyzeBundlePerformance(): Promise<BundleAnalysis> {
    // Refresh resource entries
    this.collectResourceEntries();
    
    const bundles = this.analyzeBundles();
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const totalLoadTime = bundles.reduce((sum, bundle) => sum + bundle.loadTime, 0);
    const performance = this.calculatePerformanceMetrics();
    const optimization = this.calculateOptimizationMetrics(bundles);
    
    const analysis: BundleAnalysis = {
      totalSize,
      totalLoadTime,
      bundles,
      performance,
      optimization,
      recommendations: [],
    };

    analysis.recommendations = this.generateRecommendations(bundles, analysis);

    return analysis;
  }

  // Get bundle information for a specific type
  getBundlesByType(type: BundleInfo['type']): BundleInfo[] {
    const bundles = this.analyzeBundles();
    return bundles.filter(bundle => bundle.type === type);
  }

  // Get critical path bundles
  getCriticalBundles(): BundleInfo[] {
    const bundles = this.analyzeBundles();
    return bundles.filter(bundle => bundle.critical);
  }

  // Check if bundles are optimally configured
  isOptimallyConfigured(): boolean {
    const bundles = this.analyzeBundles();
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const largeBundles = bundles.filter(b => b.size > 500 * 1024).length;
    const uncompressedBundles = bundles.filter(b => !b.compressed && b.size > 50 * 1024).length;
    
    return totalSize < 2 * 1024 * 1024 && // < 2MB total
           largeBundles === 0 && // No bundles > 500KB
           uncompressedBundles === 0; // All large bundles compressed
  }

  // Export analysis for debugging
  exportAnalysis(): string {
    return this.analyzeBundlePerformance().then(analysis => 
      JSON.stringify({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        analysis,
      }, null, 2)
    ).catch(() => 'Export failed');
  }

  // Log bundle analysis to console
  logBundleAnalysis(): void {
    this.analyzeBundlePerformance().then(analysis => {
      console.group('📦 Bundle Analysis Report');
      console.log(`Total Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total Load Time: ${analysis.totalLoadTime.toFixed(0)} ms`);
      console.log(`Performance Score: ${analysis.performance.score}/100`);
      console.log(`Compression Ratio: ${analysis.optimization.compressionRatio.toFixed(1)}%`);
      console.log(`Cache Hit Rate: ${analysis.optimization.cacheHitRate.toFixed(1)}%`);

      console.group('Bundles by Size');
      analysis.bundles.forEach(bundle => {
        const sizeKB = (bundle.size / 1024).toFixed(1);
        const loadTime = bundle.loadTime.toFixed(0);
        const flags = [
          bundle.critical ? '🔥' : '',
          bundle.cached ? '💾' : '',
          bundle.compressed ? '🗜️' : '',
        ].filter(Boolean).join(' ');
        
        console.log(`${bundle.type.padEnd(8)} ${bundle.name.padEnd(30)} ${sizeKB.padStart(8)} KB ${loadTime.padStart(6)} ms ${flags}`);
      });
      console.groupEnd();

      if (analysis.recommendations.length > 0) {
        console.group('Recommendations');
        analysis.recommendations.forEach(rec => console.log(`💡 ${rec}`));
        console.groupEnd();
      }

      console.groupEnd();
    });
  }
}

// Export singleton instance
export const bundleAnalyzer = BundleAnalyzer.getInstance();

// React hook for bundle analysis
export function useBundleAnalysis() {
  const [analysis, setAnalysis] = React.useState<BundleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const runAnalysis = React.useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = await bundleAnalyzer.analyzeBundlePerformance();
      setAnalysis(result);
      
      // Log analysis in development
      if (process.env.NODE_ENV === 'development') {
        bundleAnalyzer.logBundleAnalysis();
      }
    } catch (error) {
      console.error('Bundle analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  React.useEffect(() => {
    // Run analysis after initial load
    const timer = setTimeout(runAnalysis, 2000);
    return () => clearTimeout(timer);
  }, [runAnalysis]);

  return {
    analysis,
    isAnalyzing,
    runAnalysis,
    isOptimal: analysis ? bundleAnalyzer.isOptimallyConfigured() : false,
  };
}

export default bundleAnalyzer;