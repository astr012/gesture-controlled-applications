# Enterprise Frontend Refactoring Plan

## Approach: Tailwind CSS Only

All components use **inline Tailwind CSS classes** - no separate CSS module files.

---

## Current Progress

### Completed

1. **Phase 1 - Foundation**
   - [x] Deleted all CSS module files
   - [x] Deleted duplicate folders (app/layout, design-system, styles/globals.css)
   - [x] Updated tailwind.config.js as single design system source
   - [x] Updated index.css with CSS variables and base utilities
   - [x] Configured absolute imports (@/)
   - [x] Removed CSS module declarations from vite-env.d.ts

2. **Phase 2 - Design System (UI Primitives)**
   - [x] Button component (Tailwind)
   - [x] Card component (Tailwind)
   - [x] Badge component (Tailwind)
   - [x] Input component (Tailwind)
   - [x] Modal component (Tailwind)
   - [x] Tabs component (Tailwind)
   - [x] LoadingSpinner component (Tailwind)
   - [x] StatusIndicator component (Tailwind)
   - [x] Error boundaries (Tailwind)
   - [x] SuspenseWrapper (Tailwind)

3. **Phase 3 - Navigation & Layout**
   - [x] AppShell layout (Tailwind)
   - [x] Sidebar with projects (Tailwind)
   - [x] Header with theme toggle (Tailwind)
   - [x] MainLayout wrapper

4. **Phase 4 - Pages & Features**
   - [x] Dashboard page (Tailwind)
   - [x] NotFound page (Tailwind)
   - [x] DashboardPage feature (Tailwind)
   - [x] DashboardLayout (Tailwind)
   - [x] ProjectGrid component (Tailwind)
   - [x] StatsPanel component (Tailwind)
   - [x] QuickActions component (Tailwind)
   - [x] SystemHealth component (Tailwind)

5. **Phase 5 - Project Components**
   - [x] ProjectLoader (Tailwind)
   - [x] ProjectSelector (Tailwind)
   - [x] GestureDisplay (Tailwind)
   - [x] FingerCountDisplay (Tailwind)
   - [x] VolumeControlDisplay (Tailwind)
   - [x] VirtualMouseDisplay (Tailwind)
   - [x] ConnectionStatus (Tailwind)

6. **Phase 6 - Debug Components**
   - [x] DebugPanel (Tailwind)
   - [x] DebugToggle (Tailwind)
   - [x] ErrorTestingPanel (Tailwind)

### Remaining

7. **Phase 7 - Project Modularization**
   - [ ] Create project showcase page template
   - [ ] Restructure finger-count project folder
   - [ ] Restructure volume-control project folder
   - [ ] Restructure virtual-mouse project folder

8. **Phase 8 - API Gateway**
   - [ ] Create service layer structure
   - [ ] Implement hook-service pattern

9. **Phase 9 - Polish**
   - [ ] Visual consistency audit
   - [ ] Dark mode testing across all pages

10. **Phase 10 - Cleanup**
    - [ ] Remove dead code
    - [ ] Document final folder structure

---

## Folder Structure (Current)

```
src/
├── components/
│   ├── layout/           # AppShell, Sidebar, Header, MainLayout
│   ├── ui/               # Button, Card, Badge, Input, Modal, Tabs, etc.
│   ├── debug/            # DebugPanel, DebugToggle, ErrorTestingPanel
│   ├── ConnectionStatus/ # WebSocket connection indicator
│   ├── GestureDisplay/   # Gesture visualization components
│   ├── ProjectLoader/    # Dynamic project loading
│   └── ProjectSelector/  # Project selection component
├── features/
│   └── dashboard/        # Dashboard-specific components
├── projects/
│   ├── finger-count/     # Finger count project module
│   ├── volume-control/   # Volume control project module
│   ├── virtual-mouse/    # Virtual mouse project module
│   └── registry.ts       # Project registry
├── hooks/                # Global hooks
├── services/             # API gateway layer
├── pages/                # Page components (Dashboard, NotFound)
├── types/                # TypeScript definitions
├── utils/                # Utility functions
├── context/              # React contexts
├── routes/               # Route definitions
├── index.css             # Global styles (Tailwind base)
└── App.tsx               # Root component
```

---

## Design Tokens (tailwind.config.js)

### Colors
- **Neutral**: Slate tones (50-950)
- **Primary**: Deep Indigo (enterprise)
- **Accent**: Violet
- **Success**: Emerald
- **Warning**: Amber
- **Error**: Rose
- **Info**: Sky

### Typography
- Font: Inter (sans), JetBrains Mono (mono)
- Scale: 2xs (10px) to 6xl (60px)

### Spacing
- 8pt grid system (4px increments)

### Border Radius
- sm (4px), md (8px), lg (12px), xl (16px), full (9999px)

---

## Component Patterns

### Button Variants
```tsx
<Button variant="primary" size="md">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
```

### Card Variants
```tsx
<Card variant="default">Default card</Card>
<Card variant="elevated">With shadow</Card>
<Card variant="outlined">With border</Card>
<Card variant="glass">Glass effect</Card>
<Card hoverable>Interactive card</Card>
```

### Badge Variants
```tsx
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
```

---

## Build Status

- TypeScript: PASS (no errors)
- Dev Server: RUNNING
- CSS Modules: REMOVED (using Tailwind only)

---

## Next Steps

1. Test all pages in browser
2. Visual consistency audit
3. Dark mode testing
4. Final cleanup pass
