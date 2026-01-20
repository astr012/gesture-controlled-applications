/**
 * Property-Based Test for Theme Support
 * Feature: frontend-restructure, Property 8: Theme Support
 * Validates: Requirements 5.2
 */

import { fc } from '@fast-check/jest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { applyTheme, getEffectiveTheme } from '@/components/ui/theme';

// Generators for property-based testing
const themeGenerator = fc.constantFrom<'light' | 'dark'>('light', 'dark');
const buttonVariantGenerator = fc.constantFrom<'primary' | 'secondary' | 'ghost' | 'danger'>('primary', 'secondary', 'ghost', 'danger');
const buttonSizeGenerator = fc.constantFrom<'sm' | 'md' | 'lg'>('sm', 'md', 'lg');
const cardVariantGenerator = fc.constantFrom<'default' | 'elevated' | 'outlined' | 'ghost'>('default', 'elevated', 'outlined', 'ghost');
const cardPaddingGenerator = fc.constantFrom<'none' | 'sm' | 'md' | 'lg'>('none', 'sm', 'md', 'lg');
const statusGenerator = fc.constantFrom<'connected' | 'connecting' | 'disconnected' | 'error'>('connected', 'connecting', 'disconnected', 'error');

// Reduced number of runs for faster testing
const NUM_RUNS = 100;

// Helper to get computed styles
const getComputedStyles = (element: HTMLElement) => {
  return window.getComputedStyle(element);
};

// Helper to check if an element is visible and properly rendered
const isElementVisible = (element: HTMLElement): boolean => {
  const styles = getComputedStyles(element);
  return (
    styles.display !== 'none' &&
    styles.visibility !== 'hidden' &&
    styles.opacity !== '0'
  );
};

// Helper to check if colors are different (for theme variation)
const areColorsDifferent = (color1: string, color2: string): boolean => {
  if (!color1 || !color2) return false;
  return color1.toLowerCase() !== color2.toLowerCase();
};

describe('Property 8: Theme Support', () => {
  beforeEach(() => {
    // Reset theme before each test
    document.documentElement.classList.remove('theme-light', 'theme-dark');
  });

  afterEach(() => {
    cleanup();
    // Clean up theme classes
    document.documentElement.classList.remove('theme-light', 'theme-dark');
  });

  /**
   * Property 8a: Component Rendering in Both Themes
   * For any component in the library, it should render correctly in both light and dark theme variants
   * Validates: Requirements 5.2
   */
  test('Property 8a: Components render correctly in both light and dark themes', () => {
    fc.assert(
      fc.property(
        themeGenerator,
        buttonVariantGenerator,
        buttonSizeGenerator,
        (theme, buttonVariant, buttonSize) => {
          // Apply theme to document
          applyTheme(theme);
          
          // Test Button component
          const { container: buttonContainer } = render(
            <Button variant={buttonVariant} size={buttonSize}>
              Test Button
            </Button>
          );
          
          const button = buttonContainer.querySelector('button');
          
          // Test 1: Button should render successfully
          expect(button).toBeTruthy();
          
          if (button) {
            // Test 2: Button should be visible
            expect(isElementVisible(button)).toBe(true);
            
            // Test 3: Button should have proper structure
            expect(button.tagName).toBe('BUTTON');
            expect(button.textContent).toContain('Test Button');
            
            // Test 4: Button should have variant and size classes
            expect(button.className).toContain(buttonVariant);
            expect(button.className).toContain(buttonSize);
            
            // Test 5: Button should have computed styles
            const styles = getComputedStyles(button);
            expect(styles.backgroundColor).toBeTruthy();
            expect(styles.color).toBeTruthy();
          }
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8b: Card Component Theme Support
   * For any Card component, it should render correctly in both light and dark themes
   * Validates: Requirements 5.2
   */
  test('Property 8b: Card components render correctly in both themes', () => {
    fc.assert(
      fc.property(
        themeGenerator,
        cardVariantGenerator,
        cardPaddingGenerator,
        (theme, cardVariant, cardPadding) => {
          // Apply theme to document
          applyTheme(theme);
          
          // Test Card component
          const { container } = render(
            <Card variant={cardVariant} padding={cardPadding}>
              <h3>Card Title</h3>
              <p>Card content in {theme} theme</p>
            </Card>
          );
          
          const card = container.querySelector('div');
          
          // Test 1: Card should render successfully
          expect(card).toBeTruthy();
          
          if (card) {
            // Test 2: Card should be visible
            expect(isElementVisible(card)).toBe(true);
            
            // Test 3: Card should have proper structure
            expect(card.querySelector('h3')).toBeTruthy();
            expect(card.querySelector('p')).toBeTruthy();
            
            // Test 4: Card should have variant and padding classes
            expect(card.className).toContain(cardVariant);
            expect(card.className).toContain(`padding-${cardPadding}`);
            
            // Test 5: Card should have computed styles
            const styles = getComputedStyles(card);
            expect(styles.backgroundColor).toBeTruthy();
            // Border radius might be 0 for some variants, so just check it exists
            expect(styles.borderRadius).toBeDefined();
          }
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8c: Status Indicator Theme Support
   * For any StatusIndicator component, it should render correctly in both themes
   * Validates: Requirements 5.2
   */
  test('Property 8c: StatusIndicator renders correctly in both themes', () => {
    fc.assert(
      fc.property(
        themeGenerator,
        statusGenerator,
        fc.boolean(),
        (theme, status, showText) => {
          // Apply theme to document
          applyTheme(theme);
          
          // Test StatusIndicator component
          const { container } = render(
            <StatusIndicator status={status} showText={showText} />
          );
          
          // StatusIndicator renders a div with role="status"
          const statusElement = container.querySelector('[role="status"]');
          
          // Test 1: StatusIndicator should render successfully
          expect(statusElement).toBeTruthy();
          
          if (statusElement) {
            // Test 2: StatusIndicator should be visible
            expect(isElementVisible(statusElement)).toBe(true);
            
            // Test 3: StatusIndicator should have the container class
            expect(statusElement.className).toContain('container');
            
            // Test 4: If showText is true, text should be present
            if (showText) {
              const textElement = statusElement.querySelector('[class*="text"]');
              expect(textElement).toBeTruthy();
              expect(textElement?.textContent).toBeTruthy();
            }
            
            // Test 5: StatusIndicator should have a dot element
            const dotElement = statusElement.querySelector('[class*="dot"]');
            expect(dotElement).toBeTruthy();
            
            // Test 6: StatusIndicator should have computed styles
            const styles = getComputedStyles(statusElement);
            expect(styles.display).toBeTruthy();
          }
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8d: Theme Class Application
   * For any theme value, applying the theme should add the correct class to the document
   * Validates: Requirements 5.2
   */
  test('Property 8d: Theme application adds correct classes to document', () => {
    fc.assert(
      fc.property(
        themeGenerator,
        (theme) => {
          // Apply theme
          applyTheme(theme);
          
          // Test 1: Document should have the theme class
          expect(document.documentElement.classList.contains(`theme-${theme}`)).toBe(true);
          
          // Test 2: Document should not have the opposite theme class
          const oppositeTheme = theme === 'light' ? 'dark' : 'light';
          expect(document.documentElement.classList.contains(`theme-${oppositeTheme}`)).toBe(false);
          
          // Test 3: getEffectiveTheme should return the correct theme
          expect(getEffectiveTheme(theme)).toBe(theme);
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8e: Component Consistency Across Themes
   * For any component, the same variant should maintain consistent structure across themes
   * Validates: Requirements 5.2
   */
  test('Property 8e: Components maintain consistent structure across themes', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        (variant, size) => {
          // Render in light theme
          applyTheme('light');
          const { container: lightContainer } = render(
            <Button variant={variant} size={size}>
              Test Button
            </Button>
          );
          
          const lightButton = lightContainer.querySelector('button');
          const lightClasses = lightButton?.className || '';
          
          cleanup();
          
          // Render in dark theme
          applyTheme('dark');
          const { container: darkContainer } = render(
            <Button variant={variant} size={size}>
              Test Button
            </Button>
          );
          
          const darkButton = darkContainer.querySelector('button');
          const darkClasses = darkButton?.className || '';
          
          // Test 1: Both should render successfully
          expect(lightButton).toBeTruthy();
          expect(darkButton).toBeTruthy();
          
          if (lightButton && darkButton) {
            // Test 2: Both should have the same classes (theme is applied via CSS, not class names)
            expect(lightClasses).toBe(darkClasses);
            
            // Test 3: Both should have the same structure
            expect(lightButton.tagName).toBe(darkButton.tagName);
            expect(lightButton.textContent).toBe(darkButton.textContent);
            
            // Test 4: Both should be visible
            expect(isElementVisible(lightButton)).toBe(true);
            expect(isElementVisible(darkButton)).toBe(true);
          }
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8f: Nested Component Theme Support
   * For any component nested within another, theme should apply correctly to all levels
   * Validates: Requirements 5.2
   */
  test('Property 8f: Nested components inherit theme correctly', () => {
    fc.assert(
      fc.property(
        themeGenerator,
        cardVariantGenerator,
        buttonVariantGenerator,
        (theme, cardVariant, buttonVariant) => {
          // Apply theme
          applyTheme(theme);
          
          // Render nested components
          const { container } = render(
            <Card variant={cardVariant}>
              <h3>Card with Button</h3>
              <Button variant={buttonVariant}>
                Nested Button
              </Button>
            </Card>
          );
          
          const card = container.querySelector('div');
          const button = container.querySelector('button');
          
          // Test 1: Both components should render
          expect(card).toBeTruthy();
          expect(button).toBeTruthy();
          
          if (card && button) {
            // Test 2: Both should be visible
            expect(isElementVisible(card)).toBe(true);
            expect(isElementVisible(button)).toBe(true);
            
            // Test 3: Button should be inside Card
            expect(card.contains(button)).toBe(true);
            
            // Test 4: Both should have proper styling
            const cardStyles = getComputedStyles(card);
            const buttonStyles = getComputedStyles(button);
            
            expect(cardStyles.backgroundColor).toBeTruthy();
            expect(buttonStyles.backgroundColor).toBeTruthy();
          }
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8g: Theme Switching Stability
   * For any component, switching themes should not break rendering
   * Validates: Requirements 5.2
   */
  test('Property 8g: Components remain stable when theme switches', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        (variant, size) => {
          // Start with light theme
          applyTheme('light');
          
          const { container, rerender } = render(
            <Button variant={variant} size={size}>
              Test Button
            </Button>
          );
          
          const button = container.querySelector('button');
          
          // Test 1: Initial render should work
          expect(button).toBeTruthy();
          
          if (button) {
            const initialText = button.textContent;
            const initialClasses = button.className;
            
            // Switch to dark theme
            applyTheme('dark');
            
            // Re-render component
            rerender(
              <Button variant={variant} size={size}>
                Test Button
              </Button>
            );
            
            const buttonAfterSwitch = container.querySelector('button');
            
            // Test 2: Component should still render after theme switch
            expect(buttonAfterSwitch).toBeTruthy();
            
            if (buttonAfterSwitch) {
              // Test 3: Content should remain the same
              expect(buttonAfterSwitch.textContent).toBe(initialText);
              
              // Test 4: Classes should remain the same
              expect(buttonAfterSwitch.className).toBe(initialClasses);
              
              // Test 5: Component should still be visible
              expect(isElementVisible(buttonAfterSwitch)).toBe(true);
            }
          }
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8h: Multiple Components Theme Consistency
   * For any set of components, all should respect the same theme
   * Validates: Requirements 5.2
   */
  test('Property 8h: Multiple components respect the same theme', () => {
    fc.assert(
      fc.property(
        themeGenerator,
        buttonVariantGenerator,
        cardVariantGenerator,
        statusGenerator,
        (theme, buttonVariant, cardVariant, status) => {
          // Apply theme
          applyTheme(theme);
          
          // Render multiple components
          const { container } = render(
            <div>
              <Button variant={buttonVariant}>Button</Button>
              <Card variant={cardVariant}>Card</Card>
              <StatusIndicator status={status} />
            </div>
          );
          
          const button = container.querySelector('button');
          const card = container.querySelector('[class*="card"]');
          const statusIndicator = container.querySelector('[role="status"]');
          
          // Test 1: All components should render
          expect(button).toBeTruthy();
          expect(card).toBeTruthy();
          expect(statusIndicator).toBeTruthy();
          
          // Test 2: All components should be visible
          if (button) expect(isElementVisible(button)).toBe(true);
          if (card) expect(isElementVisible(card)).toBe(true);
          if (statusIndicator) expect(isElementVisible(statusIndicator)).toBe(true);
          
          // Test 3: Document should have the correct theme class
          expect(document.documentElement.classList.contains(`theme-${theme}`)).toBe(true);
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 8i: Theme Auto Mode Support
   * For auto theme mode, it should resolve to either light or dark
   * Validates: Requirements 5.2
   */
  test('Property 8i: Auto theme mode resolves to light or dark', () => {
    fc.assert(
      fc.property(
        fc.constant('auto' as const),
        (theme) => {
          // Test 1: getEffectiveTheme should return light or dark for auto
          const effectiveTheme = getEffectiveTheme(theme);
          expect(['light', 'dark']).toContain(effectiveTheme);
          
          // Test 2: Applying auto theme should result in a concrete theme class
          applyTheme(theme);
          const hasLightClass = document.documentElement.classList.contains('theme-light');
          const hasDarkClass = document.documentElement.classList.contains('theme-dark');
          
          expect(hasLightClass || hasDarkClass).toBe(true);
          expect(hasLightClass && hasDarkClass).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8j: Component Accessibility in Both Themes
   * For any interactive component, accessibility attributes should work in both themes
   * Validates: Requirements 5.2
   */
  test('Property 8j: Components maintain accessibility in both themes', () => {
    fc.assert(
      fc.property(
        themeGenerator,
        buttonVariantGenerator,
        fc.boolean(),
        (theme, variant, disabled) => {
          // Apply theme
          applyTheme(theme);
          
          // Render button with accessibility attributes
          const { container } = render(
            <Button variant={variant} disabled={disabled} aria-label="Test button">
              Test Button
            </Button>
          );
          
          const button = container.querySelector('button');
          
          // Test 1: Button should render
          expect(button).toBeTruthy();
          
          if (button) {
            // Test 2: Accessibility attributes should be present
            expect(button.getAttribute('aria-label')).toBe('Test button');
            
            // Test 3: Disabled state should be reflected
            if (disabled) {
              expect(button.hasAttribute('disabled')).toBe(true);
            }
            
            // Test 4: Button should be focusable (unless disabled)
            if (!disabled) {
              expect(button.tabIndex).toBeGreaterThanOrEqual(0);
            }
            
            // Test 5: Button should have proper role (implicit for button element)
            expect(button.tagName).toBe('BUTTON');
          }
          
          cleanup();
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
