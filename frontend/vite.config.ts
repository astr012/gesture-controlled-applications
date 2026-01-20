import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
      // Enable React DevTools in development
      babel: {
        plugins: process.env.NODE_ENV === 'development' ? [
          ['@babel/plugin-transform-react-jsx-development', {}]
        ] : [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for better optimization
    target: 'es2020',
    // Enable minification
    minify: 'esbuild',
    // Optimize CSS
    cssMinify: true,
    rollupOptions: {
      output: {
        // Enhanced manual chunks for optimal loading
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Router
            if (id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            // Testing libraries (shouldn't be in production, but just in case)
            if (id.includes('@testing-library') || id.includes('jest')) {
              return 'vendor-test';
            }
            // Other vendor libraries
            return 'vendor-misc';
          }

          // Core application chunks
          if (id.includes('src/context/')) {
            return 'core-context';
          }
          if (id.includes('src/services/')) {
            return 'core-services';
          }
          if (id.includes('src/components/ui/')) {
            return 'ui-components';
          }
          if (id.includes('src/components/layout/')) {
            return 'layout-components';
          }
          if (id.includes('src/utils/')) {
            return 'core-utils';
          }

          // Project-specific chunks for code splitting
          if (id.includes('src/projects/modules/FingerCount')) {
            return 'project-finger-count';
          }
          if (id.includes('src/projects/modules/VolumeControl')) {
            return 'project-volume-control';
          }
          if (id.includes('src/projects/modules/VirtualMouse')) {
            return 'project-virtual-mouse';
          }
          if (id.includes('src/projects/')) {
            return 'project-core';
          }

          // Debug and development chunks
          if (id.includes('src/components/debug/') || id.includes('src/utils/debug')) {
            return 'debug-tools';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';

          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
      // External dependencies that should not be bundled
      external: [],
      // Optimize tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Enable source maps for debugging (only in development)
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimize asset inlining
    assetsInlineLimit: 4096, // 4kb
    // Report compressed size
    reportCompressedSize: true,
    // Write bundle info for analysis
    write: true,
  },
  server: {
    port: 3000,
    host: true,
    // Enable HMR for development
    hmr: {
      overlay: true,
    },
    // Optimize development server
    fs: {
      strict: true,
    },
    // Enable CORS for development
    cors: true,
    // Optimize middleware
    middlewareMode: false,
  },
  // Enhanced CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: process.env.NODE_ENV === 'production'
        ? '[hash:base64:5]'
        : '[name]__[local]___[hash:base64:5]',
    },
    // Enable CSS code splitting
    devSourcemap: true,
    // Optimize CSS processing
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
    exclude: [
      // Exclude development-only dependencies
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
    ],
    // Force optimization of certain packages
    force: process.env.NODE_ENV === 'development',
  },
  // Enable experimental features for better performance
  esbuild: {
    // Remove console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Optimize for modern browsers
    target: 'es2020',
    // Optimize bundle size
    treeShaking: true,
  },
  // Preview configuration for production testing
  preview: {
    port: 3000,
    host: true,
    // Enable CORS for preview
    cors: true,
  },
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: process.env.NODE_ENV === 'development',
  },
  // Worker configuration for better performance
  worker: {
    format: 'es',
    plugins: () => [],
  },
  // JSON optimization
  json: {
    namedExports: true,
    stringify: false,
  },
  // Logging configuration
  logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
  clearScreen: false,
})
