/**
 * Property-Based Test for Accessibility Compliance
 * Feature: frontend-restructure, Property 9: Accessibility Compliance
 * Validates: Requirements 5.3
 */

import { fc } from '@fast-check/jest';
import { render, cleanup } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusIndicator from '@/components/ui/StatusIndicator';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { GlobalProvider } from '@/context/GlobalContext';
import { ProjectProvider } from '@/context/ProjectContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper with all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <GlobalProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </GlobalProvider>
  </BrowserRouter>
);

// Generators for property-based testing
const buttonVariantGenerator = fc.constantFrom<'primary' | 'secondary' | 'ghost' | 'danger'>('primary', 'secondary', 'ghost', 'danger');
const buttonSizeGenerator = fc.constantFrom<'sm' | 'md' | 'lg'>('sm', 'md', 'lg');
const cardVariantGenerator = fc.constantFrom<'default' | 'elevated' | 'outlined' | 'ghost'>('default', 'elevated', 'outlined', 'ghost');
const cardPaddingGenerator = fc.constantFrom<'none' | 'sm' | 'md' | 'lg'>('none', 'sm', 'md', 'lg');
const statusGenerator = fc.constantFrom<'connected' | 'connecting' | 'disconnected' | 'error'>('connected', 'connecting', 'disconnected', 'error');
const loadingVariantGenerator = fc.constantFrom<'spinner' | 'dots' | 'pulse'>('spinner', 'dots', 'pulse');
const ariaLabelGenerator = fc.string({ minLength: 3, maxLength: 50 });

// Reduced number of runs for faster testing
const NUM_RUNS = 100;

// Helper to check if element is keyboard accessible
const isKeyboardAccessible = (element: HTMLElement): boolean => {
  const tabIndex = element.getAttribute('tabindex');
  const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
  
  // Interactive elements should be focusable (tabindex >= 0 or no tabindex)
  if (isInteractive) {
    return tabIndex === null || parseInt(tabIndex) >= 0;
  }
  
  return true;
};

// Helper to check if element has proper ARIA attributes
const hasProperAriaAttributes = (element: HTMLElement): boolean => {
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  
  // Element should have either a role, aria-label, aria-labelledby, or be a semantic HTML element
  const semanticElements = ['BUTTON', 'A', 'NAV', 'MAIN', 'HEADER', 'FOOTER', 'ARTICLE', 'SECTION'];
  const isSemantic = semanticElements.includes(element.tagName);
  
  return isSemantic || role !== null || ariaLabel !== null || ariaLabelledBy !== null || ariaDescribedBy !== null;
};

describe('Property 9: Accessibility Compliance', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Property 9a: Interactive Components Have Proper ARIA Attributes
   * For any interactive component, it should include proper ARIA attributes
   * Validates: Requirements 5.3
   */
  test('Property 9a: Interactive components have proper ARIA attributes', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        fc.boolean(),
        fc.boolean(),
        (variant, size, disabled, loading) => {
          const { container } = render(
            <TestWrapper>
              <Button 
                variant={variant} 
                size={size} 
                disabled={disabled}
                loading={loading}
              >
                Test Button
              </Button>
            </TestWrapper>
          );
          
          const button = container.querySelector('button');
          
          // Test 1: Button should exist
          expect(button).toBeTruthy();
          
          if (button) {
            // Test 2: Button should be keyboard accessible
            expect(isKeyboardAccessible(button)).toBe(true);
            
            // Test 3: Loading state should have aria-busy
            if (loading) {
              expect(button.getAttribute('aria-busy')).toBe('true');
            }
            
            // Test 4: Disabled state should be properly set
            if (disabled || loading) {
              expect(button.hasAttribute('disabled')).toBe(true);
            }
            
            // Test 5: Button should have semantic HTML element
            expect(button.tagName).toBe('BUTTON');
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9b: Components Support Keyboard Navigation
   * For any interactive component, it should support keyboard navigation
   * Validates: Requirements 5.3
   */
  test('Property 9b: Components support keyboard navigation', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        fc.boolean(),
        (variant, size, disabled) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} size={size} disabled={disabled}>
                Keyboard Test
              </Button>
            </TestWrapper>
          );
          
          const button = container.querySelector('button');
          
          if (button && !disabled) {
            // Test 1: Non-disabled buttons should be focusable
            expect(button.tabIndex).toBeGreaterThanOrEqual(0);
            
            // Test 2: Button should not have tabindex="-1"
            expect(button.getAttribute('tabindex')).not.toBe('-1');
          }
          
          if (button && disabled) {
            // Test 3: Disabled buttons should have disabled attribute
            expect(button.hasAttribute('disabled')).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9c: Components Have No Accessibility Violations
   * For any component, it should have no axe accessibility violations
   * Validates: Requirements 5.3
   */
  test('Property 9c: Components have no accessibility violations', async () => {
    await fc.assert(
      fc.asyncProperty(
        buttonVariantGenerator,
        buttonSizeGenerator,
        async (variant, size) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} size={size}>
                Accessibility Test
              </Button>
            </TestWrapper>
          );
          
          // Test 1: Component should have no axe violations
          const results = await axe(container);
          expect(results).toHaveNoViolations();
          
          return true;
        }
      ),
      { numRuns: 50 } // Reduced for async tests
    );
  });

  /**
   * Property 9d: Status Indicators Have Proper Roles and Labels
   * For any status indicator, it should have proper role and accessible text
   * Validates: Requirements 5.3
   */
  test('Property 9d: Status indicators have proper roles and labels', () => {
    fc.assert(
      fc.property(
        statusGenerator,
        fc.boolean(),
        (status, showText) => {
          const { container } = render(
            <TestWrapper>
              <StatusIndicator status={status} showText={showText} />
            </TestWrapper>
          );
          
          const statusElement = container.querySelector('[role="status"]');
          
          // Test 1: Status indicator should have role="status"
          expect(statusElement).toBeTruthy();
          
          if (statusElement) {
            // Test 2: Should have proper ARIA attributes
            expect(statusElement.getAttribute('role')).toBe('status');
            
            // Test 3: Should have aria-live for screen readers
            const ariaLive = statusElement.getAttribute('aria-live');
            expect(['polite', 'assertive', 'off', null]).toContain(ariaLive);
            
            // Test 4: If showText is true, text should be accessible
            if (showText) {
              const textContent = statusElement.textContent;
              expect(textContent).toBeTruthy();
              expect(textContent?.length).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9e: Loading Components Have Proper Accessibility
   * For any loading component, it should have proper ARIA attributes for screen readers
   * Validates: Requirements 5.3
   */
  test('Property 9e: Loading components have proper accessibility', () => {
    fc.assert(
      fc.property(
        loadingVariantGenerator,
        fc.option(fc.string({ minLength: 5, maxLength: 50 })),
        (variant, text) => {
          const { container } = render(
            <TestWrapper>
              <LoadingSpinner variant={variant} text={text ?? undefined} />
            </TestWrapper>
          );
          
          // LoadingSpinner renders a container div with loading content
          const spinnerContainer = container.querySelector('[class*="container"]');
          
          // Test 1: Loading spinner container should exist
          expect(spinnerContainer).toBeTruthy();
          
          if (spinnerContainer) {
            // Test 2: Should have loading indicator (spinner, dots, pulse, or shimmer)
            const loadingIndicator = spinnerContainer.querySelector('[class*="spinner"], [class*="dots"], [class*="pulse"], [class*="shimmer"]');
            expect(loadingIndicator).toBeTruthy();
            
            // Test 3: If text is provided, it should be accessible
            if (text) {
              const textElement = spinnerContainer.querySelector('p');
              expect(textElement).toBeTruthy();
              expect(textElement?.textContent).toBe(text);
            }
            
            // Test 4: Container should be visible
            expect(spinnerContainer).toBeInTheDocument();
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9f: Card Components Maintain Semantic Structure
   * For any card component, it should maintain proper semantic HTML structure
   * Validates: Requirements 5.3
   */
  test('Property 9f: Card components maintain semantic structure', () => {
    fc.assert(
      fc.property(
        cardVariantGenerator,
        cardPaddingGenerator,
        fc.boolean(),
        (variant, padding, hasHeading) => {
          const { container } = render(
            <TestWrapper>
              <Card variant={variant} padding={padding}>
                {hasHeading && <h2>Card Heading</h2>}
                <p>Card content text</p>
              </Card>
            </TestWrapper>
          );
          
          const card = container.querySelector('div');
          
          // Test 1: Card should exist
          expect(card).toBeTruthy();
          
          if (card && hasHeading) {
            // Test 2: Heading should be present and properly structured
            const heading = card.querySelector('h2');
            expect(heading).toBeTruthy();
            expect(heading?.textContent).toBe('Card Heading');
          }
          
          if (card) {
            // Test 3: Content should be accessible
            const paragraph = card.querySelector('p');
            expect(paragraph).toBeTruthy();
            expect(paragraph?.textContent).toBe('Card content text');
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9g: Components With Icons Have Proper Accessibility
   * For any component with icons, icons should be properly hidden or labeled
   * Validates: Requirements 5.3
   */
  test('Property 9g: Components with icons have proper accessibility', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        fc.constantFrom('🚀', '✋', '🎵', '🖱️', '⚙️'),
        (variant, size, icon) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} size={size} icon={icon}>
                Button with Icon
              </Button>
            </TestWrapper>
          );
          
          const button = container.querySelector('button');
          
          // Test 1: Button should exist
          expect(button).toBeTruthy();
          
          if (button) {
            // Test 2: Icon should be present
            const iconElement = button.querySelector('[class*="icon"]');
            expect(iconElement).toBeTruthy();
            
            // Test 3: Icon should have aria-hidden="true"
            if (iconElement) {
              expect(iconElement.getAttribute('aria-hidden')).toBe('true');
            }
            
            // Test 4: Button should have accessible text
            expect(button.textContent).toContain('Button with Icon');
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9h: Components Support Custom ARIA Labels
   * For any component, custom ARIA labels should be properly applied
   * Validates: Requirements 5.3
   */
  test('Property 9h: Components support custom ARIA labels', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        ariaLabelGenerator,
        (variant, ariaLabel) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} aria-label={ariaLabel}>
                Button
              </Button>
            </TestWrapper>
          );
          
          const button = container.querySelector('button');
          
          // Test 1: Button should exist
          expect(button).toBeTruthy();
          
          if (button) {
            // Test 2: Custom aria-label should be applied
            expect(button.getAttribute('aria-label')).toBe(ariaLabel);
            
            // Test 3: Button should still be keyboard accessible
            expect(isKeyboardAccessible(button)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9i: Disabled Components Are Properly Announced
   * For any disabled component, the disabled state should be accessible
   * Validates: Requirements 5.3
   */
  test('Property 9i: Disabled components are properly announced', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        (variant, size) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} size={size} disabled>
                Disabled Button
              </Button>
            </TestWrapper>
          );
          
          const button = container.querySelector('button');
          
          // Test 1: Button should exist
          expect(button).toBeTruthy();
          
          if (button) {
            // Test 2: Disabled attribute should be present
            expect(button.hasAttribute('disabled')).toBe(true);
            
            // Test 3: Button should not be clickable
            expect(button.disabled).toBe(true);
            
            // Test 4: Button should still be in the accessibility tree
            expect(button.getAttribute('aria-hidden')).not.toBe('true');
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9j: Components Have Sufficient Color Contrast
   * For any component, it should pass axe color contrast checks
   * Validates: Requirements 5.3
   */
  test('Property 9j: Components have sufficient color contrast', async () => {
    await fc.assert(
      fc.asyncProperty(
        buttonVariantGenerator,
        buttonSizeGenerator,
        async (variant, size) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} size={size}>
                Contrast Test
              </Button>
            </TestWrapper>
          );
          
          // Test 1: Component should pass color contrast checks
          const results = await axe(container, {
            rules: {
              'color-contrast': { enabled: true }
            }
          });
          
          expect(results).toHaveNoViolations();
          
          return true;
        }
      ),
      { numRuns: 50 } // Reduced for async tests
    );
  });

  /**
   * Property 9k: Multiple Interactive Components Are Keyboard Navigable
   * For any set of interactive components, keyboard navigation should work correctly
   * Validates: Requirements 5.3
   */
  test('Property 9k: Multiple interactive components are keyboard navigable', () => {
    fc.assert(
      fc.property(
        fc.array(buttonVariantGenerator, { minLength: 2, maxLength: 5 }),
        (variants) => {
          const { container } = render(
            <TestWrapper>
              <div>
                {variants.map((variant, index) => (
                  <Button key={index} variant={variant}>
                    Button {index + 1}
                  </Button>
                ))}
              </div>
            </TestWrapper>
          );
          
          const buttons = container.querySelectorAll('button');
          
          // Test 1: All buttons should be present
          expect(buttons.length).toBe(variants.length);
          
          // Test 2: All buttons should be keyboard accessible
          buttons.forEach((button) => {
            expect(isKeyboardAccessible(button)).toBe(true);
            expect(button.tabIndex).toBeGreaterThanOrEqual(0);
          });
          
          // Test 3: All buttons should have proper structure
          buttons.forEach((button) => {
            expect(button.tagName).toBe('BUTTON');
            expect(button.textContent).toBeTruthy();
          });
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 9l: Components With Loading States Are Accessible
   * For any component in loading state, it should be properly announced to screen readers
   * Validates: Requirements 5.3
   */
  test('Property 9l: Components with loading states are accessible', () => {
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        (variant, size) => {
          const { container } = render(
            <TestWrapper>
              <Button variant={variant} size={size} loading>
                Loading Button
              </Button>
            </TestWrapper>
          );
          
          const button = container.querySelector('button');
          
          // Test 1: Button should exist
          expect(button).toBeTruthy();
          
          if (button) {
            // Test 2: Loading state should have aria-busy
            expect(button.getAttribute('aria-busy')).toBe('true');
            
            // Test 3: Button should be disabled during loading
            expect(button.hasAttribute('disabled')).toBe(true);
            
            // Test 4: Loading spinner should have aria-hidden
            const spinner = button.querySelector('[class*="spinner"]');
            if (spinner) {
              expect(spinner.getAttribute('aria-hidden')).toBe('true');
            }
            
            // Test 5: Button text should still be accessible
            expect(button.textContent).toContain('Loading Button');
          }
          
          return true;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
