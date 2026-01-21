import { test as base, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/**
 * Custom test fixtures for the Wealth Management CRM
 * Provides reusable page objects and utilities
 */

// Test data interfaces
interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'advisor' | 'assistant' | 'viewer';
}

interface TestHousehold {
  name: string;
  primaryContact: string;
  aum?: number;
}

interface TestTask {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Page object for common navigation
class NavigationHelper {
  constructor(private page: Page) {}

  async goToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async goToHouseholds() {
    await this.page.goto('/households');
    await this.page.waitForLoadState('networkidle');
  }

  async goToAccounts() {
    await this.page.goto('/accounts');
    await this.page.waitForLoadState('networkidle');
  }

  async goToTasks() {
    await this.page.goto('/tasks');
    await this.page.waitForLoadState('networkidle');
  }

  async goToIntelligence() {
    await this.page.goto('/intelligence');
    await this.page.waitForLoadState('networkidle');
  }

  async goToAnalytics() {
    await this.page.goto('/analytics');
    await this.page.waitForLoadState('networkidle');
  }

  async goToCompliance() {
    await this.page.goto('/compliance');
    await this.page.waitForLoadState('networkidle');
  }

  async goToWorkflows() {
    await this.page.goto('/workflows');
    await this.page.waitForLoadState('networkidle');
  }

  async goToPipeline() {
    await this.page.goto('/pipeline');
    await this.page.waitForLoadState('networkidle');
  }

  async goToMeetings() {
    await this.page.goto('/meetings');
    await this.page.waitForLoadState('networkidle');
  }

  async goToDocuments() {
    await this.page.goto('/documents');
    await this.page.waitForLoadState('networkidle');
  }

  async goToNotifications() {
    await this.page.goto('/notifications');
    await this.page.waitForLoadState('networkidle');
  }

  async goToSettings() {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }
}

// Page object for common actions
class ActionHelper {
  constructor(private page: Page) {}

  async clickButton(text: string) {
    await this.page.click(`button:has-text("${text}")`);
  }

  async fillInput(name: string, value: string) {
    await this.page.fill(`input[name="${name}"], input[placeholder*="${name}" i]`, value);
  }

  async selectOption(name: string, value: string) {
    const select = this.page.locator(`select[name="${name}"], [data-testid="${name}-select"]`);
    await select.click();
    await this.page.click(`[role="option"]:has-text("${value}"), li:has-text("${value}")`);
  }

  async waitForToast(type: 'success' | 'error' = 'success') {
    const toastSelector = type === 'success' 
      ? 'text=/success|created|saved|updated/i'
      : 'text=/error|failed|invalid/i';
    await expect(this.page.locator(toastSelector).first()).toBeVisible({ timeout: 5000 });
  }

  async openModal(buttonText: string) {
    await this.clickButton(buttonText);
    await expect(this.page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
  }

  async closeModal() {
    const closeButton = this.page.locator('button[aria-label="Close"], button:has-text("Cancel"), button:has-text("×")').first();
    await closeButton.click();
    await expect(this.page.locator('[role="dialog"], [class*="modal"]')).not.toBeVisible();
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
  }

  async confirmDialog() {
    await this.page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
  }
}

// Page object for assertions
class AssertionHelper {
  constructor(private page: Page) {}

  async expectPageTitle(title: string | RegExp) {
    await expect(this.page.locator('h1, [data-testid="page-title"]').first()).toContainText(title);
  }

  async expectUrl(pattern: string | RegExp) {
    await expect(this.page).toHaveURL(pattern);
  }

  async expectVisible(selector: string) {
    await expect(this.page.locator(selector).first()).toBeVisible();
  }

  async expectNotVisible(selector: string) {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  async expectCount(selector: string, count: number) {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  async expectTableRows(minCount: number) {
    const rows = this.page.locator('tbody tr, [data-testid*="row"], [class*="item"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  async expectLoadingComplete() {
    // Wait for loading indicators to disappear
    await expect(this.page.locator('[class*="loading"], [class*="spinner"], [data-testid="loading"]')).not.toBeVisible({ timeout: 10000 });
  }
}

// API Helper for mocking and intercepting
class ApiHelper {
  constructor(private page: Page) {}

  async mockEndpoint(pattern: string, response: object, status = 200) {
    await this.page.route(`**/api/${pattern}`, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  async mockNetworkError(pattern: string) {
    await this.page.route(`**/api/${pattern}`, async (route) => {
      await route.abort('failed');
    });
  }

  async delayResponse(pattern: string, delayMs: number) {
    await this.page.route(`**/api/${pattern}`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  async interceptAndLog(pattern: string) {
    const requests: { url: string; method: string; body: any }[] = [];
    
    await this.page.route(`**/api/${pattern}`, async (route) => {
      const request = route.request();
      requests.push({
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON(),
      });
      await route.continue();
    });

    return requests;
  }
}

// Test data factory
class TestDataFactory {
  static createUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      email: `test-${Date.now()}@wealth.com`,
      password: 'TestPass123!',
      name: 'Test User',
      role: 'advisor',
      ...overrides,
    };
  }

  static createHousehold(overrides: Partial<TestHousehold> = {}): TestHousehold {
    return {
      name: `Test Household ${Date.now()}`,
      primaryContact: 'John Test',
      aum: 1000000,
      ...overrides,
    };
  }

  static createTask(overrides: Partial<TestTask> = {}): TestTask {
    return {
      title: `Test Task ${Date.now()}`,
      description: 'E2E test task description',
      priority: 'medium',
      ...overrides,
    };
  }

  static users = {
    admin: {
      email: 'admin@wealth.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin' as const,
    },
    advisor: {
      email: 'advisor@wealth.com',
      password: 'advisor123',
      name: 'Advisor User',
      role: 'advisor' as const,
    },
    assistant: {
      email: 'assistant@wealth.com',
      password: 'assistant123',
      name: 'Assistant User',
      role: 'assistant' as const,
    },
  };
}

// Extended test type with fixtures
type TestFixtures = {
  nav: NavigationHelper;
  actions: ActionHelper;
  assertions: AssertionHelper;
  api: ApiHelper;
  testData: typeof TestDataFactory;
};

// Create extended test with fixtures
export const test = base.extend<TestFixtures>({
  nav: async ({ page }, use) => {
    await use(new NavigationHelper(page));
  },
  actions: async ({ page }, use) => {
    await use(new ActionHelper(page));
  },
  assertions: async ({ page }, use) => {
    await use(new AssertionHelper(page));
  },
  api: async ({ page }, use) => {
    await use(new ApiHelper(page));
  },
  testData: async ({}, use) => {
    await use(TestDataFactory);
  },
});

export { expect };
export type { TestUser, TestHousehold, TestTask };
