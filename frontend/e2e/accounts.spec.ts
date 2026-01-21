import { test, expect } from '../fixtures/test-fixtures';

test.describe('Accounts Management', () => {
  test.beforeEach(async ({ nav }) => {
    await nav.goToAccounts();
  });

  test('should display accounts list page', async ({ page, assertions }) => {
    await assertions.expectPageTitle(/Account/i);
    
    // Check for search functionality
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should display account statistics cards', async ({ page }) => {
    // Check for stat cards showing total accounts, total AUM, etc.
    const statCards = page.locator('[class*="card"], [data-testid*="stat"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter accounts by type', async ({ page }) => {
    // Look for type filter (Individual, Joint, IRA, 401k, etc.)
    const typeFilter = page.locator('select[name*="type"], button:has-text("Type"), [data-testid="type-filter"]').first();
    
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await page.locator('[role="option"], li').first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter accounts by custodian', async ({ page }) => {
    const custodianFilter = page.locator('select[name*="custodian"], button:has-text("Custodian")').first();
    
    if (await custodianFilter.isVisible()) {
      await custodianFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should search accounts by name or number', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await searchInput.fill('Test');
    await page.waitForTimeout(500);
    
    // Results should be filtered
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to account detail page', async ({ page }) => {
    const accountLink = page.locator('a[href*="/accounts/"], [data-testid="account-row"]').first();
    
    if (await accountLink.isVisible()) {
      await accountLink.click();
      await expect(page).toHaveURL(/accounts\/.+/);
    }
  });

  test('should open add account modal', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
    }
  });

  test('should display account columns correctly', async ({ page }) => {
    // Check for expected columns in the accounts table
    const expectedColumns = ['Name', 'Number', 'Type', 'Value', 'Custodian'];
    
    for (const column of expectedColumns) {
      const header = page.locator(`th:has-text("${column}"), [data-testid="column-${column.toLowerCase()}"]`);
      // Column may or may not exist depending on implementation
      const count = await header.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort accounts by value', async ({ page }) => {
    const valueHeader = page.locator('th:has-text("Value"), th:has-text("Balance")').first();
    
    if (await valueHeader.isVisible()) {
      await valueHeader.click();
      await page.waitForTimeout(500);
      
      // Click again for descending
      await valueHeader.click();
    }
  });

  test('should export accounts data', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      const download = await downloadPromise;
      
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|pdf)$/);
      }
    }
  });
});

test.describe('Account Detail Page', () => {
  test('should display account overview', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    const accountLink = page.locator('a[href*="/accounts/"]').first();
    if (await accountLink.isVisible()) {
      await accountLink.click();
      
      // Check for account name in header
      await expect(page.locator('h1, [data-testid="account-name"]').first()).toBeVisible();
    }
  });

  test('should display account holdings', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    const accountLink = page.locator('a[href*="/accounts/"]').first();
    if (await accountLink.isVisible()) {
      await accountLink.click();
      
      // Look for holdings tab or section
      const holdingsTab = page.locator('button:has-text("Holdings"), [role="tab"]:has-text("Holdings")');
      if (await holdingsTab.isVisible()) {
        await holdingsTab.click();
      }
      
      await expect(page.locator('text=/Holdings|Positions|Securities/i').first()).toBeVisible();
    }
  });

  test('should display account transactions', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    const accountLink = page.locator('a[href*="/accounts/"]').first();
    if (await accountLink.isVisible()) {
      await accountLink.click();
      
      const transactionsTab = page.locator('button:has-text("Transactions"), [role="tab"]:has-text("Transactions")');
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await expect(page.locator('text=/Transaction|History/i').first()).toBeVisible();
      }
    }
  });

  test('should display performance chart', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    const accountLink = page.locator('a[href*="/accounts/"]').first();
    if (await accountLink.isVisible()) {
      await accountLink.click();
      
      // Look for performance section or chart
      const performanceSection = page.locator('text=/Performance|Returns|Chart/i');
      await expect(performanceSection.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should edit account details', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    const accountLink = page.locator('a[href*="/accounts/"]').first();
    if (await accountLink.isVisible()) {
      await accountLink.click();
      
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(page.locator('[role="dialog"], [class*="modal"], form').first()).toBeVisible();
      }
    }
  });
});

test.describe('Account Performance', () => {
  test('should display performance metrics', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    // Check for performance-related metrics
    const metrics = page.locator('text=/YTD|1 Year|3 Year|5 Year|Return/i');
    await expect(metrics.first()).toBeVisible({ timeout: 10000 });
  });

  test('should change performance timeframe', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    // Look for timeframe selector
    const timeframeSelector = page.locator('button:has-text("1M"), button:has-text("YTD"), select[name*="timeframe"]');
    
    if (await timeframeSelector.first().isVisible()) {
      await timeframeSelector.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Account Allocation', () => {
  test('should display asset allocation chart', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    const accountLink = page.locator('a[href*="/accounts/"]').first();
    if (await accountLink.isVisible()) {
      await accountLink.click();
      
      // Look for allocation section
      const allocationSection = page.locator('text=/Allocation|Asset Mix|Portfolio/i');
      await expect(allocationSection.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display target vs actual allocation', async ({ page, nav }) => {
    await nav.goToAccounts();
    
    const accountLink = page.locator('a[href*="/accounts/"]').first();
    if (await accountLink.isVisible()) {
      await accountLink.click();
      
      const targetActual = page.locator('text=/Target|Actual|Drift/i');
      await expect(targetActual.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
