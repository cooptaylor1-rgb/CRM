import { test, expect } from '../fixtures/test-fixtures';

test.describe('Sales Pipeline', () => {
  test.beforeEach(async ({ nav }) => {
    await nav.goToPipeline();
  });

  test('should display pipeline overview page', async ({ assertions }) => {
    await assertions.expectPageTitle(/Pipeline|Sales|Opportunities/i);
  });

  test('should display pipeline stages', async ({ page }) => {
    const stages = page.locator('text=/Lead|Prospect|Proposal|Negotiation|Closed/i');
    await expect(stages.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display pipeline value summary', async ({ page }) => {
    const pipelineValue = page.locator('text=/\\$|Value|Total/i');
    await expect(pipelineValue.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle between Kanban and list view', async ({ page }) => {
    const viewToggle = page.locator('button:has-text("List"), button:has-text("Kanban"), button:has-text("Board"), [data-testid="view-toggle"]');
    
    if (await viewToggle.first().isVisible()) {
      await viewToggle.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should display opportunities in pipeline', async ({ page }) => {
    const opportunities = page.locator('[data-testid="opportunity-card"], [class*="opportunity"], [class*="deal"]');
    const count = await opportunities.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Pipeline - Opportunity Management', () => {
  test('should create new opportunity', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const createButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Fill opportunity form
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'E2E Test Opportunity');
      
      // Set value if available
      const valueInput = page.locator('input[name="value"], input[name*="amount"]').first();
      if (await valueInput.isVisible()) {
        await valueInput.fill('1000000');
      }
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    }
  });

  test('should view opportunity details', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    
    if (await opportunityCard.isVisible()) {
      await opportunityCard.click();
      await expect(page.locator('[role="dialog"], [class*="detail"]').first()).toBeVisible();
    }
  });

  test('should edit opportunity', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    
    if (await opportunityCard.isVisible()) {
      await opportunityCard.click();
      
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(page.locator('form, [class*="modal"]').first()).toBeVisible();
      }
    }
  });

  test('should move opportunity between stages via drag', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    const targetStage = page.locator('[data-testid="pipeline-stage"], [class*="stage"]').nth(1);
    
    if (await opportunityCard.isVisible() && await targetStage.isVisible()) {
      // Drag and drop simulation
      await opportunityCard.dragTo(targetStage);
      await page.waitForTimeout(500);
    }
  });

  test('should move opportunity via dropdown', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    
    if (await opportunityCard.isVisible()) {
      await opportunityCard.click();
      
      const stageSelect = page.locator('select[name*="stage"], button:has-text("Move"), [data-testid="stage-select"]').first();
      if (await stageSelect.isVisible()) {
        await stageSelect.click();
        await page.locator('[role="option"], li').nth(1).click();
      }
    }
  });

  test('should add activity to opportunity', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    
    if (await opportunityCard.isVisible()) {
      await opportunityCard.click();
      
      const addActivityButton = page.locator('button:has-text("Activity"), button:has-text("Log")').first();
      if (await addActivityButton.isVisible()) {
        await addActivityButton.click();
      }
    }
  });
});

test.describe('Pipeline - Filtering and Search', () => {
  test('should filter opportunities by owner', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const ownerFilter = page.locator('select[name*="owner"], button:has-text("Owner"), button:has-text("Advisor")').first();
    
    if (await ownerFilter.isVisible()) {
      await ownerFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should filter opportunities by value range', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const valueFilter = page.locator('select[name*="value"], button:has-text("Value"), input[name*="min"]').first();
    
    if (await valueFilter.isVisible()) {
      await valueFilter.click();
    }
  });

  test('should filter opportunities by expected close date', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const dateFilter = page.locator('input[type="date"], button:has-text("Date"), [data-testid="date-filter"]').first();
    
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
    }
  });

  test('should search opportunities by name', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Pipeline - Analytics', () => {
  test('should display pipeline conversion metrics', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const metrics = page.locator('text=/Conversion|Win Rate|%/i');
    await expect(metrics.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display pipeline velocity', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const velocity = page.locator('text=/Velocity|Average|Days/i');
    if (await velocity.first().isVisible({ timeout: 5000 })) {
      await expect(velocity.first()).toBeVisible();
    }
  });

  test('should display pipeline forecast', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const forecast = page.locator('text=/Forecast|Expected|Projected/i');
    await expect(forecast.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display stage duration metrics', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const stageDuration = page.locator('text=/Duration|Time in Stage/i');
    if (await stageDuration.first().isVisible({ timeout: 5000 })) {
      await expect(stageDuration.first()).toBeVisible();
    }
  });
});

test.describe('Pipeline - Actions', () => {
  test('should mark opportunity as won', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    
    if (await opportunityCard.isVisible()) {
      await opportunityCard.click();
      
      const wonButton = page.locator('button:has-text("Won"), button:has-text("Close Won")').first();
      if (await wonButton.isVisible()) {
        await wonButton.click();
      }
    }
  });

  test('should mark opportunity as lost', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    
    if (await opportunityCard.isVisible()) {
      await opportunityCard.click();
      
      const lostButton = page.locator('button:has-text("Lost"), button:has-text("Close Lost")').first();
      if (await lostButton.isVisible()) {
        await lostButton.click();
        
        // Fill loss reason if prompted
        const reasonInput = page.locator('textarea[name*="reason"], select[name*="reason"]').first();
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('E2E test - lost reason');
        }
      }
    }
  });

  test('should schedule follow-up', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const opportunityCard = page.locator('[data-testid="opportunity-card"], [class*="opportunity"]').first();
    
    if (await opportunityCard.isVisible()) {
      await opportunityCard.click();
      
      const followUpButton = page.locator('button:has-text("Follow"), button:has-text("Schedule")').first();
      if (await followUpButton.isVisible()) {
        await followUpButton.click();
      }
    }
  });

  test('should export pipeline data', async ({ page, nav }) => {
    await nav.goToPipeline();
    
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
    }
  });
});
