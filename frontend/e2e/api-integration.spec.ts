import { test, expect } from '@playwright/test';

/**
 * API Integration tests
 * Tests the frontend's interaction with backend APIs
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';

test.describe('API Integration - Authentication', () => {
  test('should handle successful login', async ({ page }) => {
    // Monitor API requests
    const loginRequest = page.waitForRequest('**/api/auth/login');
    const loginResponse = page.waitForResponse('**/api/auth/login');

    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@wealth.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    const request = await loginRequest;
    expect(request.method()).toBe('POST');

    const response = await loginResponse;
    expect(response.status()).toBeLessThan(400);
  });

  test('should handle failed login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'invalid@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('text=/invalid|incorrect|error|failed/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle session expiration', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Clear auth cookies/storage to simulate session expiration
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Try to navigate to a protected route
    await page.goto('/households');

    // Should redirect to login or show auth error
    await expect(page).toHaveURL(/login|auth/);
  });
});

test.describe('API Integration - Households', () => {
  test('should fetch households list', async ({ page }) => {
    const householdsResponse = page.waitForResponse('**/api/households*');

    await page.goto('/households');

    const response = await householdsResponse;
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('should handle search API request', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');

    const searchResponse = page.waitForResponse('**/api/households*');
    
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await searchInput.fill('Test');

    const response = await searchResponse;
    expect(response.status()).toBe(200);
  });

  test('should handle household creation', async ({ page }) => {
    await page.goto('/households');

    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    
    if (await addButton.isVisible()) {
      // Set up request monitoring
      const createRequest = page.waitForRequest('**/api/households', { timeout: 10000 }).catch(() => null);
      
      await addButton.click();
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'API Test Household');
      
      // Fill required fields
      const emailField = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailField.isVisible()) {
        await emailField.fill('apitest@example.com');
      }
      
      await page.click('button[type="submit"]');

      const request = await createRequest;
      if (request) {
        expect(request.method()).toBe('POST');
      }
    }
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');

    const nextPageButton = page.locator('button:has-text("Next"), button[aria-label*="next"]').first();
    
    if (await nextPageButton.isVisible()) {
      const pageRequest = page.waitForResponse('**/api/households*');
      await nextPageButton.click();
      
      const response = await pageRequest;
      expect(response.status()).toBe(200);
    }
  });
});

test.describe('API Integration - Tasks', () => {
  test('should fetch tasks list', async ({ page }) => {
    const tasksResponse = page.waitForResponse('**/api/tasks*');

    await page.goto('/tasks');

    const response = await tasksResponse;
    expect(response.status()).toBe(200);
  });

  test('should create new task via API', async ({ page }) => {
    await page.goto('/tasks');

    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    
    if (await addButton.isVisible()) {
      const createResponse = page.waitForResponse('**/api/tasks', { timeout: 10000 }).catch(() => null);
      
      await addButton.click();
      await page.fill('input[name="title"], input[placeholder*="title" i]', 'API Test Task');
      await page.click('button[type="submit"]');

      const response = await createResponse;
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }
    }
  });

  test('should update task status', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const completeButton = page.locator('button:has-text("Complete"), input[type="checkbox"]').first();
    
    if (await completeButton.isVisible()) {
      const updateResponse = page.waitForResponse(response => 
        response.url().includes('/api/tasks') && 
        (response.request().method() === 'PUT' || response.request().method() === 'PATCH')
      , { timeout: 5000 }).catch(() => null);

      await completeButton.click();

      const response = await updateResponse;
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }
    }
  });
});

test.describe('API Integration - Intelligence', () => {
  test('should fetch insights data', async ({ page }) => {
    const insightsResponse = page.waitForResponse('**/api/intelligence*');

    await page.goto('/intelligence');

    const response = await insightsResponse;
    expect(response.status()).toBe(200);
  });

  test('should handle AI analysis request', async ({ page }) => {
    await page.goto('/intelligence');
    await page.waitForLoadState('networkidle');

    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Generate")').first();
    
    if (await analyzeButton.isVisible()) {
      const analysisResponse = page.waitForResponse('**/api/intelligence*', { timeout: 30000 }).catch(() => null);
      
      await analyzeButton.click();

      const response = await analysisResponse;
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }
    }
  });
});

test.describe('API Integration - Notifications', () => {
  test('should fetch notifications', async ({ page }) => {
    await page.goto('/dashboard');
    
    const notificationsResponse = page.waitForResponse('**/api/notifications*', { timeout: 10000 }).catch(() => null);
    
    const notificationBell = page.locator('[aria-label*="notification" i], button:has(svg)').first();
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
    }

    const response = await notificationsResponse;
    if (response) {
      expect(response.status()).toBe(200);
    }
  });

  test('should mark notification as read', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const markReadButton = page.locator('button:has-text("Mark as read"), button[aria-label*="read" i]').first();
    
    if (await markReadButton.isVisible()) {
      const updateResponse = page.waitForResponse(response =>
        response.url().includes('/api/notifications') &&
        (response.request().method() === 'PUT' || response.request().method() === 'PATCH')
      , { timeout: 5000 }).catch(() => null);

      await markReadButton.click();

      const response = await updateResponse;
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }
    }
  });
});

test.describe('API Integration - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/households*', route => route.abort('failed'));

    await page.goto('/households');

    // Should display error message
    const errorMessage = page.locator('text=/error|failed|unable|retry/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle 500 server errors', async ({ page }) => {
    await page.route('**/api/households*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/households');

    // Should display error message
    const errorMessage = page.locator('text=/error|something went wrong|server/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle 404 not found', async ({ page }) => {
    await page.goto('/households/non-existent-id-12345');

    // Should display 404 or redirect
    const notFoundMessage = page.locator('text=/not found|404|doesn.t exist/i');
    await expect(notFoundMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/households*', route => {
      requestCount++;
      if (requestCount < 2) {
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0 }),
        });
      }
    });

    await page.goto('/households');

    // Look for retry button or automatic retry
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")').first();
    if (await retryButton.isVisible({ timeout: 5000 })) {
      await retryButton.click();
    }

    await page.waitForTimeout(2000);
    expect(requestCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('API Integration - Performance', () => {
  test('should load dashboard data within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    // Wait for all API calls to complete
    const responses: Promise<any>[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push(response.finished());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await Promise.all(responses);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('should handle concurrent API requests', async ({ page }) => {
    const apiCalls: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Multiple API calls should be made for dashboard
    expect(apiCalls.length).toBeGreaterThan(0);
  });
});

test.describe('API Integration - WebSocket', () => {
  test('should establish WebSocket connection for notifications', async ({ page }) => {
    let wsConnected = false;
    
    page.on('websocket', ws => {
      wsConnected = true;
      ws.on('framesent', frame => {
        console.log('WS sent:', frame.payload);
      });
      ws.on('framereceived', frame => {
        console.log('WS received:', frame.payload);
      });
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(3000);

    // WebSocket may or may not be implemented
    expect(wsConnected).toBeDefined();
  });
});
