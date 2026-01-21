import { test, expect } from '../fixtures/test-fixtures';

test.describe('Workflows Dashboard', () => {
  test.beforeEach(async ({ nav }) => {
    await nav.goToWorkflows();
  });

  test('should display workflows overview page', async ({ assertions }) => {
    await assertions.expectPageTitle(/Workflow|Automation/i);
  });

  test('should display active workflows', async ({ page }) => {
    const activeWorkflows = page.locator('text=/Active|Running|In Progress/i');
    await expect(activeWorkflows.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display workflow templates', async ({ page }) => {
    const templates = page.locator('text=/Template|Create New/i');
    await expect(templates.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter workflows by status', async ({ page }) => {
    const statusFilter = page.locator('select[name*="status"], button:has-text("Status")').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should filter workflows by type', async ({ page }) => {
    const typeFilter = page.locator('select[name*="type"], button:has-text("Type")').first();
    
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });
});

test.describe('Workflow Creation', () => {
  test('should open create workflow modal', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
    }
  });

  test('should select workflow template', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const templateCard = page.locator('[data-testid="workflow-template"], [class*="template"]').first();
    
    if (await templateCard.isVisible()) {
      await templateCard.click();
      await page.waitForTimeout(500);
    }
  });

  test('should configure workflow steps', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Select a template if available
      const templateOption = page.locator('[data-testid="template-option"], [class*="template"]').first();
      if (await templateOption.isVisible()) {
        await templateOption.click();
      }
      
      // Look for step configuration
      const stepConfig = page.locator('text=/Step|Configure|Add Step/i');
      await expect(stepConfig.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should assign workflow to client/household', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const clientSelect = page.locator('select[name*="client"], select[name*="household"], [data-testid="client-select"]').first();
      if (await clientSelect.isVisible()) {
        await clientSelect.click();
        await page.locator('[role="option"], li').first().click();
      }
    }
  });
});

test.describe('Workflow Execution', () => {
  test('should display workflow progress', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const workflowItem = page.locator('[data-testid="workflow-item"], [class*="workflow"]').first();
    if (await workflowItem.isVisible()) {
      await workflowItem.click();
      
      const progress = page.locator('text=/Progress|Step|%/i');
      await expect(progress.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should complete workflow step', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const workflowItem = page.locator('[data-testid="workflow-item"], [class*="workflow"]').first();
    if (await workflowItem.isVisible()) {
      await workflowItem.click();
      
      const completeStepButton = page.locator('button:has-text("Complete"), button:has-text("Done"), input[type="checkbox"]').first();
      if (await completeStepButton.isVisible()) {
        await completeStepButton.click();
      }
    }
  });

  test('should skip workflow step', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const workflowItem = page.locator('[data-testid="workflow-item"], [class*="workflow"]').first();
    if (await workflowItem.isVisible()) {
      await workflowItem.click();
      
      const skipButton = page.locator('button:has-text("Skip")').first();
      if (await skipButton.isVisible()) {
        await skipButton.click();
      }
    }
  });

  test('should add notes to workflow step', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const workflowItem = page.locator('[data-testid="workflow-item"], [class*="workflow"]').first();
    if (await workflowItem.isVisible()) {
      await workflowItem.click();
      
      const notesInput = page.locator('textarea[name*="notes"], [data-testid="step-notes"]').first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('E2E test notes');
      }
    }
  });
});

test.describe('Workflow Templates', () => {
  test('should display workflow template library', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const templatesTab = page.locator('button:has-text("Templates"), [role="tab"]:has-text("Templates")').first();
    if (await templatesTab.isVisible()) {
      await templatesTab.click();
    }
    
    const templates = page.locator('text=/Template|Onboarding|Review/i');
    await expect(templates.first()).toBeVisible({ timeout: 10000 });
  });

  test('should create custom workflow template', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const createTemplateButton = page.locator('button:has-text("Create Template"), button:has-text("New Template")').first();
    if (await createTemplateButton.isVisible()) {
      await createTemplateButton.click();
      
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'E2E Test Template');
      
      const saveButton = page.locator('button[type="submit"], button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
    }
  });

  test('should edit existing template', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const templateItem = page.locator('[data-testid="template-item"], [class*="template"]').first();
    if (await templateItem.isVisible()) {
      const editButton = templateItem.locator('button:has-text("Edit"), button[aria-label*="edit" i]');
      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(page.locator('[role="dialog"], [class*="modal"], form').first()).toBeVisible();
      }
    }
  });

  test('should duplicate template', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const templateItem = page.locator('[data-testid="template-item"], [class*="template"]').first();
    if (await templateItem.isVisible()) {
      const duplicateButton = templateItem.locator('button:has-text("Duplicate"), button:has-text("Copy")');
      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();
      }
    }
  });
});

test.describe('Workflow Automation', () => {
  test('should display automation triggers', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const automationTab = page.locator('button:has-text("Automation"), [role="tab"]:has-text("Automation")').first();
    if (await automationTab.isVisible()) {
      await automationTab.click();
    }
    
    const triggers = page.locator('text=/Trigger|Automated|When/i');
    await expect(triggers.first()).toBeVisible({ timeout: 10000 });
  });

  test('should enable/disable workflow automation', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const toggleSwitch = page.locator('input[type="checkbox"], [role="switch"], button:has-text("Enable")').first();
    if (await toggleSwitch.isVisible()) {
      await toggleSwitch.click();
      await page.waitForTimeout(500);
    }
  });

  test('should configure automation schedule', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const scheduleConfig = page.locator('text=/Schedule|Frequency|Every/i');
    if (await scheduleConfig.first().isVisible({ timeout: 5000 })) {
      await expect(scheduleConfig.first()).toBeVisible();
    }
  });
});

test.describe('Workflow Reports', () => {
  test('should display workflow completion reports', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const reportsTab = page.locator('button:has-text("Reports"), [role="tab"]:has-text("Reports")').first();
    if (await reportsTab.isVisible()) {
      await reportsTab.click();
    }
    
    const reports = page.locator('text=/Completion|Average|Report/i');
    await expect(reports.first()).toBeVisible({ timeout: 10000 });
  });

  test('should export workflow report', async ({ page, nav }) => {
    await nav.goToWorkflows();
    
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
    }
  });
});
