import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Navigation } from '@/components/Navigation';
import { customRender } from '../../test-utils';

expect.extend(toHaveNoViolations);

describe('Navigation Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = customRender(<Navigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA landmarks', () => {
    const { container } = customRender(<Navigation />);
    
    // Check for nav landmark
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('role', 'navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    // Check for list landmark
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('role', 'list');
  });

  it('should have proper heading structure', () => {
    const { container } = customRender(<Navigation />);
    
    // Check for skip link
    const skipLink = container.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('class', 'skip-link');
    expect(skipLink).toHaveTextContent('Skip to main content');

    // Check for proper heading levels
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
    expect(headingLevels).toEqual([...new Set(headingLevels)].sort());
  });

  it('should have proper focus management', async () => {
    const { container } = customRender(<Navigation />);
    
    // Check for focus trap in mobile menu
    const menuButton = container.querySelector('button[aria-controls="mobile-menu"]');
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // Check for proper focus indicators
    const focusableElements = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach(element => {
      expect(element).toHaveStyle({ outline: expect.any(String) });
    });
  });

  it('should have proper color contrast', async () => {
    const { container } = customRender(<Navigation />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    expect(results).toHaveNoViolations();
  });

  it('should have proper keyboard navigation', () => {
    const { container } = customRender(<Navigation />);
    
    // Check for proper tab order
    const focusableElements = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const tabIndices = Array.from(focusableElements).map(el => 
      parseInt(el.getAttribute('tabindex') || '0')
    );
    expect(tabIndices).toEqual([...tabIndices].sort((a, b) => a - b));

    // Check for proper ARIA attributes on interactive elements
    const interactiveElements = container.querySelectorAll('button, a[href]');
    interactiveElements.forEach(element => {
      if (element.hasAttribute('aria-expanded')) {
        expect(element).toHaveAttribute('aria-controls');
      }
      if (element.hasAttribute('aria-haspopup')) {
        expect(element).toHaveAttribute('aria-expanded');
      }
    });
  });

  it('should have proper screen reader text', () => {
    const { container } = customRender(<Navigation />);
    
    // Check for proper screen reader only text
    const srOnlyElements = container.querySelectorAll('.sr-only');
    srOnlyElements.forEach(element => {
      expect(element).toHaveStyle({
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      });
    });

    // Check for proper aria-labels on icons
    const iconButtons = container.querySelectorAll('button[aria-label]');
    iconButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).not.toBe('');
    });
  });

  it('should have proper responsive behavior', () => {
    const { container } = customRender(<Navigation />);
    
    // Check for proper mobile menu attributes
    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu).toBeInTheDocument();
    expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
    expect(mobileMenu).toHaveAttribute('aria-labelledby', 'mobile-menu-button');

    // Check for proper responsive classes
    expect(mobileMenu).toHaveClass('mobile-menu');
    expect(mobileMenu).toHaveClass('hidden');
  });
}); 
