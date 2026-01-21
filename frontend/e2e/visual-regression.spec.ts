import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * Captures screenshots and compares against baseline for visual changes
 */

test.describe('Visual Regression - Core Pages', () => {
  test('dashboard should match visual baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2, // Allow 20% difference for dynamic content
    });
  });

  test('households page should match visual baseline', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('households.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });

  test('accounts page should match visual baseline', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('accounts.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });

  test('tasks page should match visual baseline', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('tasks.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });

  test('intelligence page should match visual baseline', async ({ page }) => {
    await page.goto('/intelligence');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('intelligence.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });

  test('notifications page should match visual baseline', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('notifications.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Components', () => {
  test('sidebar navigation should match visual baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first();
    
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('sidebar.png', {
        animations: 'disabled',
      });
    }
  });

  test('header should match visual baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('header, [data-testid="header"]').first();
    
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('header.png', {
        animations: 'disabled',
      });
    }
  });

  test('data table should match visual baseline', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table, [data-testid="data-table"]').first();
    
    if (await table.isVisible()) {
      await expect(table).toHaveScreenshot('data-table.png', {
        animations: 'disabled',
        threshold: 0.3, // Higher threshold for data tables
      });
    }
  });

  test('card component should match visual baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const card = page.locator('[class*="card"], [data-testid="stat-card"]').first();
    
    if (await card.isVisible()) {
      await expect(card).toHaveScreenshot('card-component.png', {
        animations: 'disabled',
      });
    }
  });
});

test.describe('Visual Regression - Modals', () => {
  test('create task modal should match visual baseline', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('create-task-modal.png', {
          animations: 'disabled',
        });
      }
    }
  });

  test('confirmation dialog should match visual baseline', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Try to delete something to trigger confirmation
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      const dialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
      
      if (await dialog.isVisible()) {
        await expect(dialog).toHaveScreenshot('confirmation-dialog.png', {
          animations: 'disabled',
        });
        
        // Close dialog
        await page.keyboard.press('Escape');
      }
    }
  });
});

test.describe('Visual Regression - Responsive Design', () => {
  test('dashboard should look correct on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });

  test('dashboard should look correct on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });

  test('households page should look correct on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('households-tablet.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });

  test('households page should look correct on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('households-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - States', () => {
  test('empty state should match visual baseline', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/households*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('empty-state.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('loading state should match visual baseline', async ({ page }) => {
    // Delay API response to show loading state
    await page.route('**/api/households*', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.continue();
    });

    await page.goto('/households');
    
    // Capture loading state quickly
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('loading-state.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3,
    });
  });

  test('error state should match visual baseline', async ({ page }) => {
    // Mock error response
    await page.route('**/api/households*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('error-state.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Theme', () => {
  test('dark mode should match visual baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Toggle dark mode if available
    const themeToggle = page.locator('button[aria-label*="theme" i], button[aria-label*="dark" i], [data-testid="theme-toggle"]').first();
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('dashboard-dark.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2,
      });
    }
  });

  test('light mode should match visual baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-light.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Interactive Elements', () => {
  test('button hover state should match visual baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const button = page.locator('button').first();
    
    if (await button.isVisible()) {
      await button.hover();
      await page.waitForTimeout(500);
      
      await expect(button).toHaveScreenshot('button-hover.png');
    }
  });

  test('input focus state should match visual baseline', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('input').first();
    
    if (await input.isVisible()) {
      await input.focus();
      await page.waitForTimeout(500);
      
      await expect(input).toHaveScreenshot('input-focus.png');
    }
  });

  test('dropdown open state should match visual baseline', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');
    
    const dropdown = page.locator('select, [role="listbox"], button[aria-haspopup]').first();
    
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('[role="listbox"], [class*="dropdown"]').first()).toHaveScreenshot('dropdown-open.png');
    }
  });
});
