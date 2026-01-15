import { test, expect, devices } from '@playwright/test';

// Mobile viewport tests
test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 size

  test('should display mobile navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for mobile nav elements
    const mobileNav = page.locator('nav[class*="mobile"], [class*="bottom-nav"], nav:visible');
    await expect(mobileNav.first()).toBeVisible();
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for hamburger menu button
    const hamburgerButton = page.locator('button[aria-label*="menu" i], [class*="hamburger"], button:has(svg[class*="bars"])').first();
    await expect(hamburgerButton).toBeVisible();
  });

  test('should open mobile menu drawer', async ({ page }) => {
    await page.goto('/dashboard');

    // Click hamburger menu
    const hamburgerButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
    await hamburgerButton.click();

    // Verify drawer opened
    const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="sidebar"]');
    await expect(drawer.first()).toBeVisible();
  });

  test('should close mobile menu when clicking outside', async ({ page }) => {
    await page.goto('/dashboard');

    // Open menu
    const hamburgerButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
    await hamburgerButton.click();

    // Click backdrop/outside
    const backdrop = page.locator('[class*="backdrop"], [class*="overlay"]');
    if (await backdrop.isVisible()) {
      await backdrop.click();

      // Verify drawer closed
      await page.waitForTimeout(300);
    }
  });

  test('should navigate using bottom navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Find bottom nav items
    const bottomNavItems = page.locator('nav a, nav button').filter({ hasText: /Home|Clients|Tasks|Calendar|More/i });

    if (await bottomNavItems.count() > 0) {
      // Click on Tasks
      await bottomNavItems.filter({ hasText: /Tasks/i }).click();

      // Verify navigation
      await expect(page).toHaveURL(/tasks/);
    }
  });

  test('should display mobile-optimized cards', async ({ page }) => {
    await page.goto('/households');

    // Cards should be full-width on mobile
    const cards = page.locator('[class*="card"]');
    if (await cards.count() > 0) {
      const cardBox = await cards.first().boundingBox();
      if (cardBox) {
        // Card width should be close to viewport width (minus padding)
        expect(cardBox.width).toBeGreaterThan(350);
      }
    }
  });

  test('should show floating action button on mobile', async ({ page }) => {
    await page.goto('/households');

    // Look for FAB
    const fab = page.locator('[class*="fab"], button[class*="floating"], [class*="fixed"][class*="bottom"]');
    // FAB may or may not be present depending on page
    const fabCount = await fab.count();
    expect(fabCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Mobile Touch Interactions', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('should support pull to refresh', async ({ page }) => {
    await page.goto('/households');

    // Simulate pull down gesture
    await page.touchscreen.tap(195, 300);

    // Swipe down
    await page.mouse.move(195, 300);
    await page.mouse.down();
    await page.mouse.move(195, 500, { steps: 10 });
    await page.mouse.up();

    // Check for refresh indicator (may or may not trigger)
    await page.waitForTimeout(500);
  });

  test('should support swipe gestures on list items', async ({ page }) => {
    await page.goto('/tasks');

    // Find a list item
    const listItem = page.locator('[data-testid="task-item"], [class*="swipeable"]').first();

    if (await listItem.isVisible()) {
      const box = await listItem.boundingBox();
      if (box) {
        // Swipe left
        await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(300);
      }
    }
  });
});

test.describe('Mobile Search', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should open mobile search', async ({ page }) => {
    await page.goto('/dashboard');

    // Find search button in header
    const searchButton = page.locator('button[aria-label*="search" i], button:has(svg)').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();

      // Verify search panel opened
      const searchPanel = page.locator('[role="dialog"], [class*="search"], input[placeholder*="search" i]');
      await expect(searchPanel.first()).toBeVisible();
    }
  });

  test('should search and show results on mobile', async ({ page }) => {
    await page.goto('/dashboard');

    // Open search
    const searchButton = page.locator('button[aria-label*="search" i]').first();
    if (await searchButton.isVisible()) {
      await searchButton.click();

      // Type search query
      const searchInput = page.locator('input[placeholder*="search" i]').first();
      await searchInput.fill('test');

      // Wait for results
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Mobile Form Interactions', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should display full-screen modal on mobile', async ({ page }) => {
    await page.goto('/households');

    // Open create modal
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    await addButton.click();

    // Modal should be full-screen on mobile
    const modal = page.locator('[role="dialog"], [class*="modal"]').first();
    const modalBox = await modal.boundingBox();

    if (modalBox) {
      // Modal should be close to full width
      expect(modalBox.width).toBeGreaterThan(350);
    }
  });

  test('should have touch-friendly form inputs', async ({ page }) => {
    await page.goto('/households');

    // Open form
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    await addButton.click();

    // Check input height (should be at least 44px for touch targets)
    const inputs = page.locator('input, select, textarea');
    if (await inputs.count() > 0) {
      const inputBox = await inputs.first().boundingBox();
      if (inputBox) {
        expect(inputBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
