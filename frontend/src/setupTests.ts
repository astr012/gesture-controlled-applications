import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock import.meta for Jest environment
// @ts-ignore
global.import = {
  meta: {
    env: {
      MODE: 'test',
      DEV: false,
      PROD: false,
      SSR: false,
      VITE_APP_VERSION: '1.0.0-test',
    },
  },
};

// Configure fast-check for property-based testing
import { fc } from '@fast-check/jest';

fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as per design requirements
  verbose: true,
});

// Add TextEncoder/TextDecoder polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock WebSocket for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).WebSocket = class MockWebSocket {
  constructor() {
    // Mock implementation
  }

  close() {}
  send() {}

  // Mock properties
  readyState = 1;
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
};

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for layout tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
