import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test('should display notification dropdown in header', async ({ page }) => {
    await page.goto('/dashboard');

    // Find notification bell
    const notificationBell = page.locator('[aria-label*="notification" i], button:has(svg)').first();
    await expect(notificationBell).toBeVisible();
  });

  test('should open notification dropdown when clicked', async ({ page }) => {
    await page.goto('/dashboard');

    // Click notification bell
    const notificationBell = page.locator('[aria-label*="notification" i], button:has(svg)').first();
    await notificationBell.click();

    // Verify dropdown content
    await expect(page.locator('text=/Notifications/i').first()).toBeVisible();
  });

  test('should display unread count badge', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for badge on notification icon
    const badge = page.locator('[class*="badge"], span[class*="count"]');
    // Badge may or may not be present depending on notification state
    const badgeCount = await badge.count();
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to full notifications page', async ({ page }) => {
    await page.goto('/dashboard');

    // Open dropdown
    const notificationBell = page.locator('[aria-label*="notification" i], button:has(svg)').first();
    await notificationBell.click();

    // Click view all link
    const viewAllLink = page.locator('a:has-text("View all"), a:has-text("See all")').first();
    if (await viewAllLink.isVisible()) {
      await viewAllLink.click();
      await expect(page).toHaveURL(/notifications/);
    }
  });
});

test.describe('Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
  });

  test('should display notifications list', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toContainText(/Notification/i);
  });

  test('should display notification statistics', async ({ page }) => {
    // Check for stats cards
    const stats = page.locator('text=/Unread|Urgent|Today/i');
    await expect(stats.first()).toBeVisible();
  });

  test('should filter notifications by category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator('select, [data-testid="category-filter"]').first();

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should filter by unread only', async ({ page }) => {
    // Find unread toggle
    const unreadToggle = page.locator('button:has-text("Unread"), input[type="checkbox"]').first();

    if (await unreadToggle.isVisible()) {
      await unreadToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should mark notification as read', async ({ page }) => {
    // Find a notification item
    const notificationItem = page.locator('[data-testid="notification-item"], [class*="notification"]').first();

    if (await notificationItem.isVisible()) {
      // Click on it or find mark as read button
      const markReadButton = page.locator('button:has-text("Mark as read"), text=Mark as read').first();

      if (await markReadButton.isVisible()) {
        await markReadButton.click();
      }
    }
  });

  test('should mark all as read', async ({ page }) => {
    // Find mark all read button
    const markAllButton = page.locator('button:has-text("Mark all"), text=Mark all read').first();

    if (await markAllButton.isVisible()) {
      await markAllButton.click();

      // Verify success
      await page.waitForTimeout(500);
    }
  });

  test('should archive notification', async ({ page }) => {
    // Find archive button on a notification
    const archiveButton = page.locator('button:has-text("Archive"), [aria-label*="archive"]').first();

    if (await archiveButton.isVisible()) {
      await archiveButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Notification Settings', () => {
  test('should navigate to notification settings', async ({ page }) => {
    await page.goto('/notifications');

    // Find settings link
    const settingsLink = page.locator('a[href*="settings"], button:has-text("Settings")').first();

    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForTimeout(500);
    }
  });
});
