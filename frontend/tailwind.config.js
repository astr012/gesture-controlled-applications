/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Custom colors based on design system
      colors: {
        // Primary palette (purple-blue)
        primary: {
          50: 'hsl(248, 85%, 97%)',
          100: 'hsl(248, 85%, 94%)',
          200: 'hsl(248, 85%, 88%)',
          300: 'hsl(248, 80%, 76%)',
          400: 'hsl(248, 75%, 64%)',
          500: 'hsl(248, 70%, 52%)',
          600: 'hsl(248, 70%, 44%)',
          700: 'hsl(248, 65%, 36%)',
          800: 'hsl(248, 60%, 28%)',
          900: 'hsl(248, 55%, 20%)',
          DEFAULT: 'hsl(248, 70%, 52%)',
        },
        // Accent palette (pink-magenta)
        accent: {
          400: 'hsl(322, 75%, 62%)',
          500: 'hsl(322, 70%, 50%)',
          600: 'hsl(322, 70%, 42%)',
          DEFAULT: 'hsl(322, 70%, 50%)',
        },
        // Semantic colors
        success: {
          50: 'hsl(152, 75%, 95%)',
          100: 'hsl(152, 70%, 88%)',
          500: 'hsl(152, 60%, 42%)',
          700: 'hsl(152, 55%, 32%)',
          DEFAULT: 'hsl(152, 60%, 42%)',
        },
        warning: {
          50: 'hsl(38, 95%, 95%)',
          100: 'hsl(38, 90%, 85%)',
          500: 'hsl(38, 85%, 50%)',
          700: 'hsl(38, 80%, 40%)',
          DEFAULT: 'hsl(38, 85%, 50%)',
        },
        danger: {
          50: 'hsl(0, 85%, 97%)',
          100: 'hsl(0, 80%, 90%)',
          500: 'hsl(0, 75%, 55%)',
          700: 'hsl(0, 70%, 45%)',
          DEFAULT: 'hsl(0, 75%, 55%)',
        },
        // Neutral palette
        neutral: {
          0: 'hsl(0, 0%, 100%)',
          50: 'hsl(220, 20%, 98%)',
          100: 'hsl(220, 18%, 96%)',
          200: 'hsl(220, 16%, 90%)',
          300: 'hsl(220, 14%, 80%)',
          400: 'hsl(220, 12%, 65%)',
          500: 'hsl(220, 10%, 50%)',
          600: 'hsl(220, 12%, 40%)',
          700: 'hsl(220, 14%, 30%)',
          800: 'hsl(220, 16%, 20%)',
          900: 'hsl(220, 18%, 12%)',
          950: 'hsl(220, 20%, 8%)',
          1000: 'hsl(220, 22%, 4%)',
        },
        // Theme-aware semantic colors
        background: {
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        foreground: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
          focus: 'var(--color-border-focus)',
        },
        card: {
          DEFAULT: 'var(--color-card-background)',
        },
      },
      
      // Font families
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      
      // Font sizes
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.5' }],
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        md: ['1.125rem', { lineHeight: '1.5' }],
        lg: ['1.25rem', { lineHeight: '1.4' }],
        xl: ['1.5rem', { lineHeight: '1.3' }],
        '2xl': ['1.875rem', { lineHeight: '1.25' }],
        '3xl': ['2.25rem', { lineHeight: '1.2' }],
        '4xl': ['3rem', { lineHeight: '1.1' }],
        '5xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      
      // Spacing scale
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      
      // Border radius
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      
      // Box shadows
      boxShadow: {
        xs: '0 1px 2px 0 hsl(220 20% 10% / 0.05)',
        sm: '0 1px 3px 0 hsl(220 20% 10% / 0.1), 0 1px 2px -1px hsl(220 20% 10% / 0.1)',
        DEFAULT: '0 4px 6px -1px hsl(220 20% 10% / 0.1), 0 2px 4px -2px hsl(220 20% 10% / 0.1)',
        md: '0 4px 6px -1px hsl(220 20% 10% / 0.1), 0 2px 4px -2px hsl(220 20% 10% / 0.1)',
        lg: '0 10px 15px -3px hsl(220 20% 10% / 0.1), 0 4px 6px -4px hsl(220 20% 10% / 0.1)',
        xl: '0 20px 25px -5px hsl(220 20% 10% / 0.1), 0 8px 10px -6px hsl(220 20% 10% / 0.1)',
        '2xl': '0 25px 50px -12px hsl(220 20% 10% / 0.25)',
        inner: 'inset 0 2px 4px 0 hsl(220 20% 10% / 0.05)',
        'glow-primary': '0 0 0 1px hsl(248 70% 52% / 0.1), 0 0 20px hsl(248 70% 52% / 0.15)',
        'glow-success': '0 0 0 1px hsl(152 60% 42% / 0.1), 0 0 20px hsl(152 60% 42% / 0.15)',
        'glow-danger': '0 0 0 1px hsl(0 75% 55% / 0.1), 0 0 20px hsl(0 75% 55% / 0.15)',
      },
      
      // Transitions
      transitionDuration: {
        instant: '0ms',
        fast: '100ms',
        DEFAULT: '200ms',
        slow: '300ms',
        slower: '500ms',
        slowest: '800ms',
      },
      
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enter: 'cubic-bezier(0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      
      // Animations
      animation: {
        'fade-in': 'fadeIn 200ms ease-out forwards',
        'fade-in-up': 'fadeInUp 200ms ease-out forwards',
        'fade-in-down': 'fadeInDown 200ms ease-out forwards',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-top': 'slideInFromTop 200ms ease-out forwards',
        'slide-in-bottom': 'slideInFromBottom 200ms ease-out forwards',
        'slide-in-left': 'slideInFromLeft 200ms ease-out forwards',
        'slide-in-right': 'slideInFromRight 200ms ease-out forwards',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 1s infinite',
        'gesture-detected': 'gestureDetected 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 1.5s infinite linear',
      },
      
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInFromTop: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromBottom: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInFromRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(-2%)' },
          '50%': { transform: 'translateY(0)' },
        },
        gestureDetected: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 hsl(248 70% 52%)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 0 10px transparent' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      // Z-index scale
      zIndex: {
        dropdown: '100',
        sticky: '200',
        overlay: '300',
        modal: '400',
        popover: '500',
        tooltip: '600',
        toast: '700',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
