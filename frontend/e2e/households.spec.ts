import { test, expect } from '@playwright/test';

test.describe('Households Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/households');
  });

  test('should display households list', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toContainText(/Household/i);

    // Check for search input
    await expect(page.locator('input[placeholder*="search" i], input[type="search"]').first()).toBeVisible();

    // Check for household cards or list items
    const householdItems = page.locator('[data-testid="household-item"], [class*="card"], tr').first();
    await expect(householdItems).toBeVisible({ timeout: 10000 });
  });

  test('should filter households by search', async ({ page }) => {
    // Get search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    // Type search query
    await searchInput.fill('Anderson');
    await page.waitForTimeout(500); // Wait for debounce

    // Verify filtered results
    const results = page.locator('text=/Anderson/i');
    await expect(results.first()).toBeVisible();
  });

  test('should open create household modal', async ({ page }) => {
    // Click add/create button
    await page.click('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');

    // Verify modal opened
    await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
    await expect(page.locator('text=/New Household|Create Household|Add Household/i').first()).toBeVisible();
  });

  test('should navigate to household detail page', async ({ page }) => {
    // Click on first household
    const householdLink = page.locator('a[href*="/households/"], [data-testid="household-item"]').first();
    await householdLink.click();

    // Verify navigation to detail page
    await expect(page).toHaveURL(/households\/.+/);
  });

  test('should display household statistics', async ({ page }) => {
    // Check for stat cards
    const stats = page.locator('text=/Total|AUM|Active/i');
    await expect(stats.first()).toBeVisible();
  });
});

test.describe('Household Detail', () => {
  test('should display household information', async ({ page }) => {
    // Navigate to a specific household (first one)
    await page.goto('/households');

    const householdLink = page.locator('a[href*="/households/"]').first();
    await householdLink.click();

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Check for household name in header
    const header = page.locator('h1, [data-testid="household-name"]').first();
    await expect(header).toBeVisible();
  });

  test('should display tabs for different sections', async ({ page }) => {
    await page.goto('/households');
    const householdLink = page.locator('a[href*="/households/"]').first();
    await householdLink.click();

    // Check for tab navigation
    const tabs = page.locator('[role="tablist"], [data-testid="tabs"]');
    await expect(tabs.first()).toBeVisible();
  });

  test('should display accounts associated with household', async ({ page }) => {
    await page.goto('/households');
    const householdLink = page.locator('a[href*="/households/"]').first();
    await householdLink.click();

    // Click accounts tab if available
    const accountsTab = page.locator('button:has-text("Accounts"), [role="tab"]:has-text("Accounts")');
    if (await accountsTab.count() > 0) {
      await accountsTab.click();
    }

    // Check for accounts section
    await expect(page.locator('text=/Account|Portfolio/i').first()).toBeVisible();
  });
});

test.describe('Household CRUD Operations', () => {
  test('should create a new household', async ({ page }) => {
    await page.goto('/households');

    // Open create modal
    await page.click('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');

    // Fill form fields
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Household E2E');

    // Submit form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

    // Verify success (either redirect or success message)
    const successIndicator = page.locator('text=/success|created|saved/i, [class*="toast"][class*="success"]');
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should edit a household', async ({ page }) => {
    await page.goto('/households');

    // Navigate to household detail
    const householdLink = page.locator('a[href*="/households/"]').first();
    await householdLink.click();

    // Click edit button
    await page.click('button:has-text("Edit"), [aria-label*="edit"]');

    // Modify a field
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Updated Household Name');
    }

    // Save changes
    await page.click('button[type="submit"], button:has-text("Save")');

    // Verify success
    const successIndicator = page.locator('text=/success|updated|saved/i');
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
  });
});
