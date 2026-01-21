/**
 * Global E2E test setup with API mocking
 * This enables tests to run without a real backend by mocking API responses
 */

import { test as base, expect, Page } from '@playwright/test';

/**
 * Helper to inject mock auth state into the page
 * Sets the localStorage values that the app checks for authentication
 */
async function injectMockAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Set the auth values that the app checks
    localStorage.setItem('accessToken', 'mock-jwt-token-for-testing');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      email: 'admin@example.com',
      firstName: 'Test',
      lastName: 'Admin',
      roles: ['admin'],
    }));
  });
}

/**
 * Helper to mock API responses in the browser
 */
async function mockAPIResponses(page: Page): Promise<void> {
  // Intercept API requests and return mock data
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-jwt-token',
        user: { id: '1', email: 'admin@example.com', name: 'Test Admin', role: 'admin' },
      }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: '1', email: 'admin@example.com', name: 'Test Admin', role: 'admin' }),
    });
  });

  await page.route('**/api/analytics/dashboard', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overview: {
          totalAUM: 125000000,
          totalClients: 150,
          activeHouseholds: 75,
          monthlyRevenue: 125000,
          aumGrowth: 8.5,
          clientGrowth: 12,
          revenueGrowth: 15.2,
        },
        recentActivity: [
          { id: '1', type: 'meeting', description: 'Client meeting scheduled', timestamp: new Date().toISOString() },
        ],
        goals: [{ id: '1', name: 'AUM Growth', target: 150000000, current: 125000000, progress: 83 }],
        topClients: [{ id: '1', name: 'Johnson Family Trust', aum: 5000000 }],
        upcomingMeetings: [{ id: '1', title: 'Quarterly Review', startTime: new Date(Date.now() + 86400000).toISOString(), householdName: 'Johnson Family' }],
        alerts: [{ id: '1', message: 'Compliance review required', severity: 'warning', count: 3 }],
      }),
    });
  });

  await page.route('**/api/households**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', name: 'Johnson Family Trust', totalValue: 5000000, members: 4, status: 'active' },
        { id: '2', name: 'Smith Investment Holdings', totalValue: 3500000, members: 2, status: 'active' },
      ]),
    });
  });

  await page.route('**/api/tasks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', title: 'Review Q4 Reports', dueDate: new Date(Date.now() + 86400000).toISOString(), status: 'pending', priority: 'high' },
        { id: '2', title: 'Client follow-up call', dueDate: new Date(Date.now() + 172800000).toISOString(), status: 'pending', priority: 'medium' },
      ]),
    });
  });

  await page.route('**/api/notifications**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', title: 'New task assigned', read: false, createdAt: new Date().toISOString() },
      ]),
    });
  });

  await page.route('**/api/documents**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', name: 'Q4 Report.pdf', type: 'report', uploadedAt: new Date().toISOString() },
      ]),
    });
  });

  // Catch-all for other API requests
  await page.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });
}

/**
 * Extended test fixture with mock auth and API
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    await injectMockAuth(page);
    await mockAPIResponses(page);
    await use(page);
  },
});

export { expect };

// Utility functions for tests
export const testUtils = {
  /**
   * Wait for page to be fully loaded and stable
   */
  async waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);
  },

  /**
   * Navigate to a route with authentication
   */
  async navigateAuthenticated(page: Page, route: string): Promise<void> {
    await injectMockAuth(page);
    await mockAPIResponses(page);
    await page.goto(route);
    await this.waitForPageLoad(page);
  },

  /**
   * Check if element is visible with retry
   */
  async isVisibleWithRetry(page: Page, selector: string, timeout = 5000): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  },
};
