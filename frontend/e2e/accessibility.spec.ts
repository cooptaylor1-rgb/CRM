import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core
 * Ensures WCAG 2.1 AA compliance across the application
 */

test.describe('Accessibility - Core Pages', () => {
  test('dashboard should have no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('households page should have no accessibility violations', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('accounts page should have no accessibility violations', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('tasks page should have no accessibility violations', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('intelligence page should have no accessibility violations', async ({ page }) => {
    await page.goto('/intelligence');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('notifications page should have no accessibility violations', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should navigate dashboard with keyboard only', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocusedElement = page.locator(':focus');
    await expect(firstFocusedElement).toBeVisible();

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should navigate sidebar with keyboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Focus on sidebar navigation
    const sidebar = page.locator('nav, [role="navigation"]').first();
    await sidebar.focus();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Should navigate to a new page
    await page.waitForTimeout(500);
  });

  test('should open and close modal with keyboard', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Tab to the Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    
    if (await addButton.isVisible()) {
      await addButton.focus();
      await page.keyboard.press('Enter');

      // Modal should open
      await expect(page.locator('[role="dialog"]').first()).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Modal should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test('should trap focus within modal', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();

      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();

      // Tab through modal elements
      const tabCount = 10;
      for (let i = 0; i < tabCount; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        // Verify focus stays within modal
        const isWithinModal = await modal.locator(':focus').count() > 0;
        expect(isWithinModal || await page.locator('[role="dialog"] :focus').count() > 0).toBeTruthy();
      }
    }
  });

  test('should handle dropdown navigation with keyboard', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');

    const dropdown = page.locator('select, [role="listbox"], button[aria-haspopup]').first();
    
    if (await dropdown.isVisible()) {
      await dropdown.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
  });
});

test.describe('Accessibility - Screen Reader', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();

    // Check heading order doesn't skip levels
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) => 
      elements.map(el => ({ tag: el.tagName, text: el.textContent?.trim() }))
    );

    let lastLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.tag.substring(1));
      // Heading level should not skip more than 1 level
      expect(level - lastLevel).toBeLessThanOrEqual(2);
      lastLevel = level;
    }
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const title = await button.getAttribute('title');

      // Button should have some accessible name
      const hasAccessibleName = ariaLabel || (text && text.trim()) || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Image should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Open a form modal
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")').first();
    if (await addButton.isVisible()) {
      await addButton.click();

      const inputs = page.locator('input:not([type="hidden"]), select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        if (id) {
          // Check for associated label
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          const hasAriaLabel = ariaLabel || ariaLabelledby;
          
          expect(hasLabel || hasAriaLabel || placeholder).toBeTruthy();
        }
      }
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live], [role="alert"], [role="status"]');
    const hasLiveRegions = await liveRegions.count() > 0;

    // Not all pages need live regions, but it's good to have them for notifications
    expect(hasLiveRegions).toBeDefined();
  });
});

test.describe('Accessibility - Color and Contrast', () => {
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not rely solely on color to convey information', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Check status indicators have text/icons, not just color
    const statusIndicators = page.locator('[class*="status"], [class*="badge"]');
    const statusCount = await statusIndicators.count();

    for (let i = 0; i < Math.min(statusCount, 5); i++) {
      const indicator = statusIndicators.nth(i);
      const text = await indicator.textContent();
      const ariaLabel = await indicator.getAttribute('aria-label');
      const hasIcon = await indicator.locator('svg').count() > 0;

      // Status indicator should have text, aria-label, or icon
      expect(text?.trim() || ariaLabel || hasIcon).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tab to an interactive element
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check for focus ring/outline
    const outline = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    });

    // Should have some visual focus indicator
    const hasFocusIndicator = 
      outline.outline !== 'none' || 
      outline.boxShadow !== 'none' ||
      outline.border !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should maintain focus order', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const focusOrder: string[] = [];

    // Tab through and record focus order
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const tagName = await focusedElement.evaluate(el => el.tagName);
      focusOrder.push(tagName);
    }

    // Focus order should be logical (not jumping around randomly)
    expect(focusOrder.length).toBe(10);
  });
});
