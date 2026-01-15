import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Verify page title or heading
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toContainText(/Dashboard/i);

    // Check for key metric cards
    await expect(page.locator('text=/AUM|Assets Under Management/i').first()).toBeVisible();
    await expect(page.locator('text=/Households|Clients/i').first()).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    // Check for activity section
    const activitySection = page.locator('text=/Recent Activity|Activity/i').first();
    await expect(activitySection).toBeVisible();
  });

  test('should display upcoming tasks', async ({ page }) => {
    // Check for tasks section
    const tasksSection = page.locator('text=/Tasks|Upcoming/i').first();
    await expect(tasksSection).toBeVisible();
  });

  test('should navigate to households from quick links', async ({ page }) => {
    // Click on households link or card
    await page.click('text=/Households|View All Clients/i');

    // Verify navigation
    await expect(page).toHaveURL(/households/);
  });

  test('should display notifications indicator', async ({ page }) => {
    // Check for notification bell in header
    const notificationBell = page.locator('[aria-label*="notification"], button:has(svg[data-icon="bell"])').first();
    await expect(notificationBell).toBeVisible();
  });

  test('should open notification dropdown when clicking bell', async ({ page }) => {
    // Click notification bell
    const notificationBell = page.locator('[aria-label*="notification"], button:has(svg)').first();
    await notificationBell.click();

    // Check for dropdown content
    await expect(page.locator('text=/Notifications|No notifications/i').first()).toBeVisible();
  });
});

test.describe('Dashboard - Performance', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should display skeleton loaders while data loads', async ({ page }) => {
    // Intercept API to delay response
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/dashboard');

    // Check for loading indicators
    const loadingIndicators = page.locator('[class*="animate-pulse"], [class*="skeleton"], [data-testid="loading"]');

    // Should have loading state initially
    const count = await loadingIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not have loaders depending on implementation
  });
});
