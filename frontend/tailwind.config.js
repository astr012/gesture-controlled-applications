/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    // =========================================================================
    // ENTERPRISE DESIGN SYSTEM - SOURCE OF TRUTH
    // =========================================================================

    // === COLOR PALETTE ===
    colors: {
      // Transparent
      transparent: 'transparent',
      current: 'currentColor',

      // White
      white: '#ffffff',
      black: '#000000',

      // Neutral - Slate tones for enterprise dark theme
      neutral: {
        0: '#ffffff',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },

      // Primary - Deep Indigo (enterprise, professional)
      primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
        950: '#1e1b4b',
      },

      // Accent - Violet (subtle contrast)
      accent: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
      },

      // Success - Emerald
      success: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },

      // Warning - Amber
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },

      // Error - Rose (softer than pure red)
      error: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337',
      },

      // Info - Sky
      info: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
    },

    // === TYPOGRAPHY ===
    fontFamily: {
      sans: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'sans-serif',
      ],
      mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
    },

    fontSize: {
      '2xs': ['0.625rem', { lineHeight: '1.5' }], // 10px
      xs: ['0.75rem', { lineHeight: '1.5' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.5' }], // 14px
      base: ['1rem', { lineHeight: '1.6' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.5' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.4' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '1.35' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '1.3' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '1.2' }], // 36px
      '5xl': ['3rem', { lineHeight: '1.15' }], // 48px
      '6xl': ['3.75rem', { lineHeight: '1.1' }], // 60px
    },

    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },

    // === SPACING (8pt grid) ===
    spacing: {
      0: '0',
      px: '1px',
      0.5: '2px',
      1: '4px',
      1.5: '6px',
      2: '8px',
      2.5: '10px',
      3: '12px',
      3.5: '14px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      11: '44px',
      12: '48px',
      14: '56px',
      16: '64px',
      20: '80px',
      24: '96px',
      28: '112px',
      32: '128px',
      36: '144px',
      40: '160px',
      44: '176px',
      48: '192px',
      52: '208px',
      56: '224px',
      60: '240px',
      64: '256px',
      72: '288px',
      80: '320px',
      96: '384px',
    },

    // === BORDER RADIUS ===
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      '3xl': '24px',
      full: '9999px',
    },

    // === BOX SHADOW ===
    boxShadow: {
      none: 'none',
      xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      DEFAULT:
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.03)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      // Custom shadows
      card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      'card-hover':
        '0 4px 12px -2px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
      'glow-primary':
        '0 0 0 1px rgb(99 102 241 / 0.1), 0 0 20px rgb(99 102 241 / 0.15)',
      'glow-success':
        '0 0 0 1px rgb(16 185 129 / 0.1), 0 0 20px rgb(16 185 129 / 0.15)',
      'glow-error':
        '0 0 0 1px rgb(244 63 94 / 0.1), 0 0 20px rgb(244 63 94 / 0.15)',
    },

    // === TRANSITIONS ===
    transitionDuration: {
      0: '0ms',
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },

    transitionTimingFunction: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },

    // === Z-INDEX ===
    zIndex: {
      auto: 'auto',
      0: '0',
      10: '10',
      20: '20',
      30: '30',
      40: '40',
      50: '50',
      dropdown: '100',
      sticky: '200',
      fixed: '300',
      overlay: '400',
      modal: '500',
      popover: '600',
      tooltip: '700',
      toast: '800',
    },

    // === EXTEND ===
    extend: {
      // Animation keyframes
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out forwards',
        'fade-in-up': 'fade-in-up 200ms ease-out forwards',
        'fade-in-down': 'fade-in-down 200ms ease-out forwards',
        'scale-in': 'scale-in 200ms ease-out forwards',
        'slide-in-left': 'slide-in-left 200ms ease-out forwards',
        'slide-in-right': 'slide-in-right 200ms ease-out forwards',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s linear infinite',
        'spin-slow': 'spin-slow 2s linear infinite',
      },

      // Width utilities
      width: {
        sidebar: '280px',
        'sidebar-collapsed': '72px',
      },

      // Max width
      maxWidth: {
        container: '1400px',
        '8xl': '88rem',
      },

      // Height utilities
      height: {
        header: '64px',
      },

      // Min height
      minHeight: {
        'screen-minus-header': 'calc(100vh - 64px)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
