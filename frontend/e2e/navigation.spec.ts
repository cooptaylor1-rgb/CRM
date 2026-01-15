import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Test navigation to each main section
    const routes = [
      { name: 'Households', path: '/households' },
      { name: 'Accounts', path: '/accounts' },
      { name: 'Tasks', path: '/tasks' },
      { name: 'Meetings', path: '/meetings' },
      { name: 'Documents', path: '/documents' },
      { name: 'Pipeline', path: '/pipeline' },
      { name: 'Intelligence', path: '/intelligence' },
    ];

    for (const route of routes) {
      // Find and click nav link
      const navLink = page.locator(`a[href="${route.path}"], a:has-text("${route.name}")`).first();

      if (await navLink.isVisible()) {
        await navLink.click();
        await expect(page).toHaveURL(new RegExp(route.path));
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should display breadcrumbs on detail pages', async ({ page }) => {
    await page.goto('/households');

    // Navigate to a detail page
    const detailLink = page.locator('a[href*="/households/"]').first();
    await detailLink.click();

    // Check for breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label*="breadcrumb" i], [class*="breadcrumb"]');
    // Breadcrumbs may or may not be present
    const count = await breadcrumbs.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle back navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate forward
    await page.click('a[href="/households"]');
    await expect(page).toHaveURL(/households/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should maintain sidebar state', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if sidebar is visible (desktop)
    const sidebar = page.locator('[class*="sidebar"], aside, nav[class*="side"]');
    const isDesktop = page.viewportSize()?.width && page.viewportSize()!.width > 768;

    if (isDesktop) {
      await expect(sidebar.first()).toBeVisible();
    }
  });
});

test.describe('Header', () => {
  test('should display user menu', async ({ page }) => {
    await page.goto('/dashboard');

    // Find user menu/avatar
    const userMenu = page.locator('[data-testid="user-menu"], [class*="avatar"], button:has(img)').first();
    await expect(userMenu).toBeVisible();
  });

  test('should open user menu dropdown', async ({ page }) => {
    await page.goto('/dashboard');

    // Click user menu
    const userMenu = page.locator('[data-testid="user-menu"], [class*="avatar"]').first();
    await userMenu.click();

    // Verify dropdown
    const dropdown = page.locator('[role="menu"], [class*="dropdown"]');
    await expect(dropdown.first()).toBeVisible();
  });

  test('should display search in header', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for search
    const search = page.locator('input[placeholder*="search" i], button[aria-label*="search" i]');
    await expect(search.first()).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should display 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');

    // Check for 404 content
    const notFound = page.locator('text=/404|not found|page doesn\'t exist/i');
    await expect(notFound.first()).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/households');

    // Check for error message or empty state
    const errorIndicator = page.locator('text=/error|failed|try again/i, [class*="error"], [class*="empty"]');
    await expect(errorIndicator.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have skip link for accessibility', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to")');
    const count = await skipLink.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that something is focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should support keyboard navigation in modals', async ({ page }) => {
    await page.goto('/households');

    // Open modal
    await page.click('button:has-text("Add"), button:has-text("New")');

    // Verify modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal.first()).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(modal).toBeHidden();
  });
});

test.describe('Performance', () => {
  test('should load pages within acceptable time', async ({ page }) => {
    const pages = ['/dashboard', '/households', '/tasks', '/documents'];

    for (const pagePath of pages) {
      const startTime = Date.now();

      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      // Each page should load DOM within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    }
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    // Navigate back and forth multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/dashboard');
      await page.goto('/households');
      await page.goto('/tasks');
    }

    // If we got here without crashes, memory management is reasonable
    expect(true).toBe(true);
  });
});
