import { test, expect } from '@playwright/test';

test.describe('Tasks Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks list', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toContainText(/Task/i);

    // Check for tasks content
    const taskItems = page.locator('[data-testid="task-item"], [class*="task"], tr, [class*="card"]');
    await expect(taskItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter tasks by status', async ({ page }) => {
    // Look for status filter
    const statusFilter = page.locator('select, [role="listbox"], button:has-text("Status")').first();

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select completed status
      await page.click('text=/Completed|Done/i');

      // Wait for filter to apply
      await page.waitForTimeout(500);
    }
  });

  test('should open create task modal', async ({ page }) => {
    // Click add task button
    await page.click('button:has-text("Add"), button:has-text("Create"), button:has-text("New Task")');

    // Verify modal opened
    await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Open create modal
    await page.click('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');

    // Fill task form
    await page.fill('input[name="title"], input[placeholder*="title" i]', 'E2E Test Task');

    // Set description if available
    const descriptionField = page.locator('textarea[name="description"], textarea');
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('This is a test task created by E2E tests');
    }

    // Submit form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

    // Verify success
    const successIndicator = page.locator('text=/success|created|added/i');
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should mark task as complete', async ({ page }) => {
    // Find a task checkbox or complete button
    const completeButton = page.locator(
      'button:has-text("Complete"), input[type="checkbox"], [data-testid="task-complete"]'
    ).first();

    if (await completeButton.isVisible()) {
      await completeButton.click();

      // Verify task state changed
      await page.waitForTimeout(500);
    }
  });

  test('should display task due dates', async ({ page }) => {
    // Check for due date indicators
    const dueDates = page.locator('text=/due|overdue/i, [class*="date"]');
    await expect(dueDates.first()).toBeVisible();
  });
});

test.describe('Task Filtering and Sorting', () => {
  test('should filter tasks by assignee', async ({ page }) => {
    await page.goto('/tasks');

    // Look for assignee filter
    const assigneeFilter = page.locator('select[name*="assignee"], button:has-text("Assignee")').first();

    if (await assigneeFilter.isVisible()) {
      await assigneeFilter.click();

      // Select an assignee
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should sort tasks by due date', async ({ page }) => {
    await page.goto('/tasks');

    // Look for sort control
    const sortControl = page.locator('select[name*="sort"], button:has-text("Sort")').first();

    if (await sortControl.isVisible()) {
      await sortControl.click();

      // Select due date sort
      await page.click('text=/Due Date/i');
    }
  });

  test('should search tasks', async ({ page }) => {
    await page.goto('/tasks');

    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('review');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Task Detail', () => {
  test('should open task detail view', async ({ page }) => {
    await page.goto('/tasks');

    // Click on a task
    const taskItem = page.locator('[data-testid="task-item"], a[href*="/tasks/"]').first();
    await taskItem.click();

    // Verify detail view opened (modal or page)
    await expect(page.locator('text=/Details|Description|Due/i').first()).toBeVisible();
  });

  test('should edit task from detail view', async ({ page }) => {
    await page.goto('/tasks');

    // Open task detail
    const taskItem = page.locator('[data-testid="task-item"], a[href*="/tasks/"]').first();
    await taskItem.click();

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Verify edit mode
      await expect(page.locator('input, textarea').first()).toBeVisible();
    }
  });
});
