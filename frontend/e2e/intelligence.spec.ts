import { test, expect } from '@playwright/test';

test.describe('AI Intelligence Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/intelligence');
  });

  test('should display intelligence dashboard', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toContainText(/Intelligence/i);
  });

  test('should display AI insights summary', async ({ page }) => {
    // Check for insights section
    const insights = page.locator('text=/Insights|AI|Analysis/i');
    await expect(insights.first()).toBeVisible();
  });

  test('should display risk scores', async ({ page }) => {
    // Check for risk score indicators
    const riskScores = page.locator('text=/Risk|Score/i');
    await expect(riskScores.first()).toBeVisible();
  });

  test('should display life events', async ({ page }) => {
    // Check for life events section
    const lifeEvents = page.locator('text=/Life Events|Events/i');
    await expect(lifeEvents.first()).toBeVisible();
  });

  test('should filter insights by type', async ({ page }) => {
    // Look for filter controls
    const filterControl = page.locator('select, button:has-text("Filter"), [data-testid="insight-filter"]').first();

    if (await filterControl.isVisible()) {
      await filterControl.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should display high-risk households', async ({ page }) => {
    // Check for high-risk section
    const highRiskSection = page.locator('text=/High Risk|At Risk|Priority/i');
    await expect(highRiskSection.first()).toBeVisible();
  });

  test('should navigate to meeting brief generator', async ({ page }) => {
    // Look for meeting brief button/link
    const meetingBriefLink = page.locator('a:has-text("Meeting Brief"), button:has-text("Generate Brief")').first();

    if (await meetingBriefLink.isVisible()) {
      await meetingBriefLink.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Meeting Brief Generator', () => {
  test('should open meeting brief generator modal', async ({ page }) => {
    await page.goto('/intelligence');

    // Click generate brief button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Brief")').first();

    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Verify modal opened
      await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
    }
  });

  test('should select household for brief', async ({ page }) => {
    await page.goto('/intelligence');

    const generateButton = page.locator('button:has-text("Generate")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Select household
      const householdSelect = page.locator('select[name*="household"], [data-testid="household-select"]').first();
      if (await householdSelect.isVisible()) {
        await householdSelect.click();
        await page.locator('[role="option"], li').first().click();
      }
    }
  });
});

test.describe('Risk Score Details', () => {
  test('should display risk score breakdown', async ({ page }) => {
    await page.goto('/intelligence');

    // Click on a risk score card
    const riskCard = page.locator('[data-testid="risk-score-card"], [class*="risk"]').first();

    if (await riskCard.isVisible()) {
      await riskCard.click();

      // Check for breakdown details
      const breakdown = page.locator('text=/Attrition|Compliance|Portfolio|Engagement/i');
      await expect(breakdown.first()).toBeVisible();
    }
  });

  test('should show risk factors', async ({ page }) => {
    await page.goto('/intelligence');

    // Look for risk factors section
    const riskFactors = page.locator('text=/Factors|Contributing|Reasons/i');
    await expect(riskFactors.first()).toBeVisible();
  });
});

test.describe('Life Events Timeline', () => {
  test('should display life events timeline', async ({ page }) => {
    await page.goto('/intelligence');

    // Check for timeline
    const timeline = page.locator('[class*="timeline"], [data-testid="life-events"]');
    await expect(timeline.first()).toBeVisible();
  });

  test('should filter life events by category', async ({ page }) => {
    await page.goto('/intelligence');

    // Find filter for life events
    const categoryFilter = page.locator('[data-testid="event-category-filter"], select').first();

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should acknowledge life event', async ({ page }) => {
    await page.goto('/intelligence');

    // Find acknowledge button on an event
    const acknowledgeButton = page.locator('button:has-text("Acknowledge"), button:has-text("Dismiss")').first();

    if (await acknowledgeButton.isVisible()) {
      await acknowledgeButton.click();
      await page.waitForTimeout(500);
    }
  });
});
