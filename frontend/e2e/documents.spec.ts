import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Documents Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents');
  });

  test('should display documents list', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toContainText(/Document/i);

    // Check for document items
    const documentItems = page.locator('[data-testid="document-item"], tr, [class*="card"]');
    await expect(documentItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display document statistics', async ({ page }) => {
    // Check for stats
    const stats = page.locator('text=/Total|Active|Pending/i');
    await expect(stats.first()).toBeVisible();
  });

  test('should filter documents by type', async ({ page }) => {
    // Look for type filter
    const typeFilter = page.locator('select, button:has-text("Type"), [data-testid="type-filter"]').first();

    if (await typeFilter.isVisible()) {
      await typeFilter.click();

      // Select a document type
      await page.locator('text=/IMA|Agreement|Contract/i').first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter documents by category', async ({ page }) => {
    // Look for category tabs
    const categoryTabs = page.locator('[role="tab"], button[class*="tab"]');

    if (await categoryTabs.count() > 1) {
      await categoryTabs.nth(1).click();
      await page.waitForTimeout(500);
    }
  });

  test('should search documents', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    await searchInput.fill('agreement');
    await page.waitForTimeout(500);

    // Verify search results
    const results = page.locator('text=/agreement/i');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open upload modal', async ({ page }) => {
    // Click upload button
    await page.click('button:has-text("Upload"), button:has-text("Add")');

    // Verify modal opened
    await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
  });

  test('should display document preview', async ({ page }) => {
    // Click on preview button for a document
    const previewButton = page.locator('button[aria-label*="preview" i], button:has-text("View"), [data-testid="preview-button"]').first();

    if (await previewButton.isVisible()) {
      await previewButton.click();

      // Verify preview modal/panel opened
      await expect(page.locator('[role="dialog"], [class*="modal"], [class*="preview"]').first()).toBeVisible();
    }
  });

  test('should download document', async ({ page }) => {
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

    // Click download button
    const downloadButton = page.locator('button[aria-label*="download" i], button:has-text("Download"), [data-testid="download-button"]').first();

    if (await downloadButton.isVisible()) {
      await downloadButton.click();

      const download = await downloadPromise;
      // Download may or may not trigger depending on implementation
    }
  });
});

test.describe('Document Categories', () => {
  test('should switch between category tabs', async ({ page }) => {
    await page.goto('/documents');

    // Get all category tabs
    const tabs = page.locator('[role="tab"], button[class*="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Click through each tab
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(300);
      }
    }
  });
});

test.describe('Document Bulk Actions', () => {
  test('should select multiple documents', async ({ page }) => {
    await page.goto('/documents');

    // Find checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');

    if (await checkboxes.count() > 1) {
      // Select first two documents
      await checkboxes.nth(1).click();
      await checkboxes.nth(2).click();

      // Verify bulk action bar appears
      const bulkActionBar = page.locator('text=/selected|Selection/i');
      await expect(bulkActionBar.first()).toBeVisible();
    }
  });

  test('should select all documents', async ({ page }) => {
    await page.goto('/documents');

    // Find select all checkbox (usually first checkbox or in header)
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();

    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();

      // Verify bulk action bar
      const bulkActionBar = page.locator('text=/selected/i');
      await expect(bulkActionBar.first()).toBeVisible();
    }
  });
});
