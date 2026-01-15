import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

/**
 * Authentication setup - runs once before all tests
 * Creates an authenticated session and saves it for other tests to reuse
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await page.waitForSelector('form', { timeout: 10000 });

  // Fill in login credentials
  await page.fill('input[name="email"], input[type="email"]', 'admin@wealth.com');
  await page.fill('input[name="password"], input[type="password"]', 'admin123');

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for successful redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  // Verify we're logged in by checking for user-specific element
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

/**
 * Alternative setup for scenarios that need a fresh login
 */
setup.describe('alternative auth', () => {
  setup('authenticate as advisor', async ({ page }) => {
    const advisorAuthFile = path.join(__dirname, '.auth/advisor.json');

    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'advisor@wealth.com');
    await page.fill('input[name="password"], input[type="password"]', 'advisor123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.context().storageState({ path: advisorAuthFile });
  });
});
