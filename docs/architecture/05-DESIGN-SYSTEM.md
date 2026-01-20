# Design System Principles

> **Document**: 05-DESIGN-SYSTEM.md  
> **Version**: 2.0.0  
> **Scope**: Color science, typography, spacing, and animation guidelines

---

## Overview

The Gesture Control Platform design system establishes visual consistency, accessibility, and a premium user experience. This document defines the foundational design tokens and principles that all UI components must follow.

---

## Design Philosophy

### Core Principles

| Principle          | Description                                       |
| ------------------ | ------------------------------------------------- |
| **Clarity**        | Interface elements are immediately understandable |
| **Responsiveness** | Real-time feedback for gesture interactions       |
| **Depth**          | Visual hierarchy guides attention naturally       |
| **Motion**         | Purposeful animations reinforce interactions      |
| **Accessibility**  | WCAG 2.1 AA compliance minimum                    |

### Visual Language

The design language balances **technical precision** with **approachable warmth**:

- **Clean geometry** for data visualization
- **Soft gradients** for depth and focus
- **Subtle motion** for state transitions
- **High contrast** for critical information

---

## Color System

### Color Science Approach

Colors are defined in **HSL** (Hue, Saturation, Lightness) for systematic manipulation:

```css
/* design-system/tokens/colors.css */

:root {
  /* ==========================================================================
     PRIMARY PALETTE
     Based on a vibrant purple-blue hue (248°) with high saturation
     Conveys technology, innovation, and trust
     ========================================================================== */

  --color-primary-50: hsl(248, 85%, 97%);
  --color-primary-100: hsl(248, 85%, 94%);
  --color-primary-200: hsl(248, 85%, 88%);
  --color-primary-300: hsl(248, 80%, 76%);
  --color-primary-400: hsl(248, 75%, 64%);
  --color-primary-500: hsl(248, 70%, 52%); /* Base primary */
  --color-primary-600: hsl(248, 70%, 44%);
  --color-primary-700: hsl(248, 65%, 36%);
  --color-primary-800: hsl(248, 60%, 28%);
  --color-primary-900: hsl(248, 55%, 20%);

  --color-primary: var(--color-primary-500);
  --color-primary-hover: var(--color-primary-600);
  --color-primary-active: var(--color-primary-700);

  /* Primary gradient for buttons and hero elements */
  --color-primary-gradient: linear-gradient(
    135deg,
    hsl(248, 70%, 52%) 0%,
    hsl(280, 65%, 48%) 100%
  );

  /* ==========================================================================
     ACCENT PALETTE
     Complementary pink-magenta (322°) for highlights and accents
     ========================================================================== */

  --color-accent-50: hsl(322, 90%, 97%);
  --color-accent-100: hsl(322, 90%, 94%);
  --color-accent-200: hsl(322, 85%, 86%);
  --color-accent-300: hsl(322, 80%, 74%);
  --color-accent-400: hsl(322, 75%, 62%);
  --color-accent-500: hsl(322, 70%, 50%); /* Base accent */
  --color-accent-600: hsl(322, 70%, 42%);
  --color-accent-700: hsl(322, 65%, 34%);

  --color-accent: var(--color-accent-500);

  /* ==========================================================================
     SEMANTIC COLORS
     Functional colors for status and feedback
     ========================================================================== */

  /* Success - Green with slight teal undertone */
  --color-success-50: hsl(152, 75%, 95%);
  --color-success-100: hsl(152, 70%, 88%);
  --color-success-500: hsl(152, 60%, 42%);
  --color-success-700: hsl(152, 55%, 32%);
  --color-success: var(--color-success-500);
  --color-success-hover: var(--color-success-700);

  /* Warning - Amber/Orange */
  --color-warning-50: hsl(38, 95%, 95%);
  --color-warning-100: hsl(38, 90%, 85%);
  --color-warning-500: hsl(38, 85%, 50%);
  --color-warning-700: hsl(38, 80%, 40%);
  --color-warning: var(--color-warning-500);

  /* Error/Danger - Red with slight coral undertone */
  --color-danger-50: hsl(0, 85%, 97%);
  --color-danger-100: hsl(0, 80%, 90%);
  --color-danger-500: hsl(0, 75%, 55%);
  --color-danger-700: hsl(0, 70%, 45%);
  --color-danger: var(--color-danger-500);
  --color-danger-hover: var(--color-danger-700);

  /* Info - Blue */
  --color-info-50: hsl(210, 85%, 96%);
  --color-info-100: hsl(210, 80%, 88%);
  --color-info-500: hsl(210, 75%, 50%);
  --color-info-700: hsl(210, 70%, 40%);
  --color-info: var(--color-info-500);

  /* ==========================================================================
     NEUTRAL PALETTE
     Gray scale with slight cool undertone (220° hue)
     ========================================================================== */

  --color-neutral-0: hsl(0, 0%, 100%);
  --color-neutral-50: hsl(220, 20%, 98%);
  --color-neutral-100: hsl(220, 18%, 96%);
  --color-neutral-200: hsl(220, 16%, 90%);
  --color-neutral-300: hsl(220, 14%, 80%);
  --color-neutral-400: hsl(220, 12%, 65%);
  --color-neutral-500: hsl(220, 10%, 50%);
  --color-neutral-600: hsl(220, 12%, 40%);
  --color-neutral-700: hsl(220, 14%, 30%);
  --color-neutral-800: hsl(220, 16%, 20%);
  --color-neutral-900: hsl(220, 18%, 12%);
  --color-neutral-950: hsl(220, 20%, 8%);
  --color-neutral-1000: hsl(220, 22%, 4%);
}
```

### Light Theme

```css
/* design-system/themes/light.css */

[data-theme="light"],
:root {
  /* Backgrounds */
  --color-background-primary: var(--color-neutral-0);
  --color-background-secondary: var(--color-neutral-50);
  --color-background-tertiary: var(--color-neutral-100);
  --color-background-quaternary: var(--color-neutral-200);
  --color-background-hover: hsla(220, 20%, 0%, 0.04);

  /* Surfaces */
  --color-card-background: var(--color-neutral-0);
  --color-glass-background: hsla(0, 0%, 100%, 0.8);
  --color-glass-border: hsla(0, 0%, 100%, 0.2);
  --color-overlay: hsla(220, 20%, 10%, 0.5);

  /* Text */
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-600);
  --color-text-tertiary: var(--color-neutral-500);
  --color-text-disabled: var(--color-neutral-400);
  --color-text-inverse: var(--color-neutral-0);

  /* Borders */
  --color-border: var(--color-neutral-200);
  --color-border-hover: var(--color-neutral-300);
  --color-border-focus: var(--color-primary-500);

  /* Component-specific */
  --color-skeleton: var(--color-neutral-200);
  --color-scrollbar: var(--color-neutral-300);
  --color-scrollbar-hover: var(--color-neutral-400);
}
```

### Dark Theme

```css
/* design-system/themes/dark.css */

[data-theme="dark"] {
  /* Backgrounds */
  --color-background-primary: var(--color-neutral-950);
  --color-background-secondary: var(--color-neutral-900);
  --color-background-tertiary: var(--color-neutral-800);
  --color-background-quaternary: var(--color-neutral-700);
  --color-background-hover: hsla(220, 20%, 100%, 0.06);

  /* Surfaces */
  --color-card-background: var(--color-neutral-900);
  --color-glass-background: hsla(220, 20%, 10%, 0.8);
  --color-glass-border: hsla(220, 20%, 100%, 0.1);
  --color-overlay: hsla(220, 20%, 0%, 0.7);

  /* Text */
  --color-text-primary: var(--color-neutral-50);
  --color-text-secondary: var(--color-neutral-400);
  --color-text-tertiary: var(--color-neutral-500);
  --color-text-disabled: var(--color-neutral-600);
  --color-text-inverse: var(--color-neutral-900);

  /* Borders */
  --color-border: var(--color-neutral-800);
  --color-border-hover: var(--color-neutral-700);
  --color-border-focus: var(--color-primary-400);

  /* Adjusted primary for dark mode */
  --color-primary: var(--color-primary-400);
  --color-primary-hover: var(--color-primary-300);

  /* Component-specific */
  --color-skeleton: var(--color-neutral-800);
  --color-scrollbar: var(--color-neutral-700);
  --color-scrollbar-hover: var(--color-neutral-600);
}
```

### Color Usage Guidelines

| Use Case             | Light Theme                  | Dark Theme                   |
| -------------------- | ---------------------------- | ---------------------------- |
| Page background      | `--color-background-primary` | `--color-background-primary` |
| Card background      | `--color-card-background`    | `--color-card-background`    |
| Primary text         | `--color-text-primary`       | `--color-text-primary`       |
| Secondary text       | `--color-text-secondary`     | `--color-text-secondary`     |
| Interactive elements | `--color-primary`            | `--color-primary`            |
| Success state        | `--color-success`            | `--color-success`            |
| Error state          | `--color-danger`             | `--color-danger`             |

### Contrast Requirements

All text must meet WCAG 2.1 AA standards:

| Text Type          | Minimum Contrast |
| ------------------ | ---------------- |
| Body text          | 4.5:1            |
| Large text (18px+) | 3:1              |
| UI components      | 3:1              |
| Focus indicators   | 3:1              |

---

## Typography

### Font Stack

```css
/* design-system/tokens/typography.css */

:root {
  /* Font Families */
  --font-sans:
    "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI",
    Roboto, Oxygen, Ubuntu, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;

  /* Font Sizes - Modular scale (1.25 ratio) */
  --font-size-2xs: 0.625rem; /* 10px */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-md: 1.125rem; /* 18px */
  --font-size-lg: 1.25rem; /* 20px */
  --font-size-xl: 1.5rem; /* 24px */
  --font-size-2xl: 1.875rem; /* 30px */
  --font-size-3xl: 2.25rem; /* 36px */
  --font-size-4xl: 3rem; /* 48px */
  --font-size-5xl: 3.75rem; /* 60px */

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Letter Spacing */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.02em;
  --letter-spacing-wider: 0.04em;
}
```

### Type Styles

```css
/* Typography utility classes */

/* Headings */
.heading-1 {
  font-family: var(--font-sans);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.heading-2 {
  font-family: var(--font-sans);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.heading-3 {
  font-family: var(--font-sans);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.heading-4 {
  font-family: var(--font-sans);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.heading-5 {
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}

.heading-6 {
  font-family: var(--font-sans);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}

/* Body text */
.body-lg {
  font-family: var(--font-sans);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
}

.body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
}

.body-sm {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
}

/* Captions and labels */
.caption {
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.label {
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

/* Code */
.code {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}
```

### Typography Usage

| Context         | Style       | Size           |
| --------------- | ----------- | -------------- |
| Page titles     | `heading-1` | 48px           |
| Section headers | `heading-2` | 36px           |
| Card titles     | `heading-4` | 24px           |
| Body text       | `body`      | 16px           |
| Secondary text  | `body-sm`   | 14px           |
| Labels/Tags     | `label`     | 12px uppercase |
| Code snippets   | `code`      | 14px mono      |

---

## Spacing System

### Spacing Scale

```css
/* design-system/tokens/spacing.css */

:root {
  /* Base unit: 4px */
  --spacing-unit: 4px;

  /* Spacing scale */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0.5: 2px; /* 0.5 units */
  --spacing-1: 4px; /* 1 unit */
  --spacing-1.5: 6px; /* 1.5 units */
  --spacing-2: 8px; /* 2 units */
  --spacing-2.5: 10px; /* 2.5 units */
  --spacing-3: 12px; /* 3 units */
  --spacing-4: 16px; /* 4 units */
  --spacing-5: 20px; /* 5 units */
  --spacing-6: 24px; /* 6 units */
  --spacing-8: 32px; /* 8 units */
  --spacing-10: 40px; /* 10 units */
  --spacing-12: 48px; /* 12 units */
  --spacing-16: 64px; /* 16 units */
  --spacing-20: 80px; /* 20 units */
  --spacing-24: 96px; /* 24 units */

  /* Semantic spacing aliases */
  --spacing-xs: var(--spacing-1); /* 4px */
  --spacing-sm: var(--spacing-2); /* 8px */
  --spacing-md: var(--spacing-4); /* 16px */
  --spacing-lg: var(--spacing-6); /* 24px */
  --spacing-xl: var(--spacing-8); /* 32px */
  --spacing-2xl: var(--spacing-12); /* 48px */
  --spacing-3xl: var(--spacing-16); /* 64px */
}
```

### Component Spacing Guidelines

```css
:root {
  /* Layout spacing */
  --layout-gutter: var(--spacing-md); /* 16px */
  --layout-section: var(--spacing-2xl); /* 48px */
  --layout-page-margin: var(--spacing-lg); /* 24px */

  /* Component internal spacing */
  --component-padding-xs: var(--spacing-xs); /* 4px */
  --component-padding-sm: var(--spacing-sm); /* 8px */
  --component-padding-md: var(--spacing-md); /* 16px */
  --component-padding-lg: var(--spacing-lg); /* 24px */

  /* Stack spacing (vertical) */
  --stack-xs: var(--spacing-1); /* 4px */
  --stack-sm: var(--spacing-2); /* 8px */
  --stack-md: var(--spacing-4); /* 16px */
  --stack-lg: var(--spacing-6); /* 24px */

  /* Inline spacing (horizontal) */
  --inline-xs: var(--spacing-1); /* 4px */
  --inline-sm: var(--spacing-2); /* 8px */
  --inline-md: var(--spacing-3); /* 12px */
  --inline-lg: var(--spacing-4); /* 16px */
}
```

### Grid System

```css
:root {
  /* Grid configuration */
  --grid-columns: 12;
  --grid-gutter: var(--spacing-md);
  --grid-margin: var(--spacing-lg);

  /* Container max-widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;

  /* Layout fixed sizes */
  --header-height: 64px;
  --sidebar-width: 260px;
  --sidebar-width-collapsed: 72px;
  --status-bar-height: 36px;
}
```

---

## Elevation & Shadows

```css
/* design-system/tokens/shadows.css */

:root {
  /* Shadow color base */
  --shadow-color: 220 20% 10%;

  /* Shadow scale */
  --shadow-xs: 0 1px 2px 0 hsl(var(--shadow-color) / 0.05);

  --shadow-sm:
    0 1px 3px 0 hsl(var(--shadow-color) / 0.1),
    0 1px 2px -1px hsl(var(--shadow-color) / 0.1);

  --shadow-md:
    0 4px 6px -1px hsl(var(--shadow-color) / 0.1),
    0 2px 4px -2px hsl(var(--shadow-color) / 0.1);

  --shadow-lg:
    0 10px 15px -3px hsl(var(--shadow-color) / 0.1),
    0 4px 6px -4px hsl(var(--shadow-color) / 0.1);

  --shadow-xl:
    0 20px 25px -5px hsl(var(--shadow-color) / 0.1),
    0 8px 10px -6px hsl(var(--shadow-color) / 0.1);

  --shadow-2xl: 0 25px 50px -12px hsl(var(--shadow-color) / 0.25);

  /* Inner shadow */
  --shadow-inner: inset 0 2px 4px 0 hsl(var(--shadow-color) / 0.05);

  /* Glow effects for primary elements */
  --glow-primary:
    0 0 0 1px hsl(248, 70%, 52% / 0.1), 0 0 20px hsl(248, 70%, 52% / 0.15);

  --glow-success:
    0 0 0 1px hsl(152, 60%, 42% / 0.1), 0 0 20px hsl(152, 60%, 42% / 0.15);

  --glow-danger:
    0 0 0 1px hsl(0, 75%, 55% / 0.1), 0 0 20px hsl(0, 75%, 55% / 0.15);
}

/* Dark theme shadow adjustments */
[data-theme="dark"] {
  --shadow-color: 220 30% 5%;

  --shadow-md:
    0 4px 6px -1px hsl(var(--shadow-color) / 0.3),
    0 2px 4px -2px hsl(var(--shadow-color) / 0.3);

  --shadow-lg:
    0 10px 15px -3px hsl(var(--shadow-color) / 0.4),
    0 4px 6px -4px hsl(var(--shadow-color) / 0.3);
}
```

### Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}
```

---

## Animation & Motion

### Timing & Easing

```css
/* design-system/tokens/motion.css */

:root {
  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  --duration-slowest: 800ms;

  /* Easing curves */
  /* Standard - for most transitions */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

  /* Enter - elements entering the screen */
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);

  /* Exit - elements leaving the screen */
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* Spring - for bouncy, playful interactions */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Smooth - for subtle state changes */
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);

  /* Composite transitions */
  --transition-fast: var(--duration-fast) var(--ease-standard);
  --transition-normal: var(--duration-normal) var(--ease-standard);
  --transition-slow: var(--duration-slow) var(--ease-standard);

  /* Specific transitions */
  --transition-colors:
    color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
  --transition-opacity: opacity var(--duration-normal) var(--ease-standard);
  --transition-transform: transform var(--duration-normal) var(--ease-standard);
  --transition-shadow: box-shadow var(--duration-normal) var(--ease-standard);
}
```

### Animation Keyframes

```css
/* design-system/utilities/animations.css */

/* Fade animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Scale animations */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Slide animations */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Feedback animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(-5%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

/* Skeleton loading */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Animation utility classes */
.animate-fadeIn {
  animation: fadeIn var(--duration-normal) var(--ease-enter) forwards;
}

.animate-scaleIn {
  animation: scaleIn var(--duration-normal) var(--ease-spring) forwards;
}

.animate-slideInTop {
  animation: slideInFromTop var(--duration-normal) var(--ease-enter) forwards;
}

.animate-slideInBottom {
  animation: slideInFromBottom var(--duration-normal) var(--ease-enter) forwards;
}

.animate-pulse {
  animation: pulse 2s var(--ease-smooth) infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Motion Guidelines

| Action              | Duration       | Easing   |
| ------------------- | -------------- | -------- |
| Button hover        | Fast (100ms)   | Standard |
| Modal open          | Normal (200ms) | Spring   |
| Modal close         | Fast (100ms)   | Exit     |
| Page transition     | Slow (300ms)   | Standard |
| Loading spinner     | 800ms          | Linear   |
| Notification appear | Normal (200ms) | Enter    |
| Status change       | Fast (100ms)   | Standard |

---

## Component Patterns

### Interactive States

```css
/* Button state progression example */
.button {
  /* Base state */
  background: var(--color-primary);
  transition: var(--transition-fast);

  /* Hover */
  &:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  /* Active/Pressed */
  &:active {
    background: var(--color-primary-active);
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  /* Focus */
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Disabled */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}
```

### Loading States

```css
/* Skeleton loading pattern */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-skeleton) 25%,
    var(--color-background-tertiary) 50%,
    var(--color-skeleton) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: var(--radius-md);
}

/* Spinner pattern */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-neutral-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### Focus Management

```css
/* Focus ring utility */
.focus-ring {
  --focus-ring-color: var(--color-primary);
  --focus-ring-offset: 2px;
  --focus-ring-width: 2px;
}

.focus-ring:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* For elements that shouldn't have focus ring (skip links handled differently) */
.focus-ring-inset:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--color-primary);
}
```

---

## Responsive Design

### Breakpoints

```css
:root {
  /* Breakpoint values */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Usage with CSS Container Queries (preferred) */
@container (min-width: 640px) {
  /* ... */
}
@container (min-width: 768px) {
  /* ... */
}

/* Fallback with media queries */
@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
@media (min-width: 1536px) {
  /* 2xl */
}
```

### Responsive Typography

```css
/* Fluid typography with clamp() */
:root {
  --font-size-fluid-sm: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
  --font-size-fluid-base: clamp(1rem, 0.9rem + 0.35vw, 1.125rem);
  --font-size-fluid-lg: clamp(1.25rem, 1rem + 0.75vw, 1.5rem);
  --font-size-fluid-xl: clamp(1.5rem, 1.1rem + 1.25vw, 2rem);
  --font-size-fluid-2xl: clamp(2rem, 1.5rem + 1.75vw, 3rem);
}
```

---

## Accessibility

### Color Contrast Verification

Every color combination should be tested against WCAG 2.1 AA requirements:

| Foreground               | Background                   | Ratio Required | Use Case       |
| ------------------------ | ---------------------------- | -------------- | -------------- |
| `--color-text-primary`   | `--color-background-primary` | 4.5:1          | Body text      |
| `--color-text-secondary` | `--color-background-primary` | 4.5:1          | Secondary text |
| `--color-neutral-0`      | `--color-primary`            | 4.5:1          | Button text    |
| `--color-text-primary`   | `--color-card-background`    | 4.5:1          | Card content   |

### Focus Indicators

```css
/* All interactive elements must have visible focus */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* Don't remove outlines - style them instead */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Motion Preferences

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Implementation Checklist

When implementing a new component, verify:

- [ ] Uses design tokens, not hardcoded values
- [ ] Supports both light and dark themes
- [ ] Has proper focus states
- [ ] Meets contrast requirements
- [ ] Includes loading and error states
- [ ] Respects reduced motion preferences
- [ ] Is responsive across breakpoints
- [ ] Uses appropriate animation durations
- [ ] Has semantic HTML structure
- [ ] Includes ARIA attributes where needed

---

This design system provides the foundation for a consistent, accessible, and visually premium user experience across the Gesture Control Platform.
