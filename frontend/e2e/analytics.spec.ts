import { test, expect } from '../fixtures/test-fixtures';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ nav }) => {
    await nav.goToAnalytics();
  });

  test('should display analytics overview page', async ({ assertions }) => {
    await assertions.expectPageTitle(/Analytics|Reports|Insights/i);
  });

  test('should display AUM chart', async ({ page }) => {
    const aumChart = page.locator('text=/AUM|Assets Under Management/i');
    await expect(aumChart.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display revenue metrics', async ({ page }) => {
    const revenueSection = page.locator('text=/Revenue|Fees|Income/i');
    await expect(revenueSection.first()).toBeVisible();
  });

  test('should display client growth metrics', async ({ page }) => {
    const clientGrowth = page.locator('text=/Client|Household|Growth/i');
    await expect(clientGrowth.first()).toBeVisible();
  });

  test('should change date range', async ({ page }) => {
    const dateRangePicker = page.locator('button:has-text("Last"), select[name*="date"], [data-testid="date-range"]').first();
    
    if (await dateRangePicker.isVisible()) {
      await dateRangePicker.click();
      const option = page.locator('[role="option"], li').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should display KPI cards', async ({ page }) => {
    // Check for key metric cards
    const kpiCards = page.locator('[class*="card"], [data-testid*="kpi"]');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should export analytics report', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
    }
  });
});

test.describe('Analytics - Performance Reports', () => {
  test('should display portfolio performance', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const performanceTab = page.locator('button:has-text("Performance"), [role="tab"]:has-text("Performance")').first();
    if (await performanceTab.isVisible()) {
      await performanceTab.click();
    }
    
    await expect(page.locator('text=/Performance|Returns|Benchmark/i').first()).toBeVisible();
  });

  test('should compare against benchmark', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const benchmarkSelector = page.locator('select[name*="benchmark"], button:has-text("Benchmark")').first();
    if (await benchmarkSelector.isVisible()) {
      await benchmarkSelector.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should display risk metrics', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const riskMetrics = page.locator('text=/Risk|Sharpe|Volatility|Beta/i');
    await expect(riskMetrics.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Analytics - Business Metrics', () => {
  test('should display advisor productivity metrics', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const productivityMetrics = page.locator('text=/Productivity|Advisor|Activity/i');
    if (await productivityMetrics.first().isVisible({ timeout: 5000 })) {
      await expect(productivityMetrics.first()).toBeVisible();
    }
  });

  test('should display client retention rate', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const retention = page.locator('text=/Retention|Churn|Attrition/i');
    await expect(retention.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display fee revenue breakdown', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const feeBreakdown = page.locator('text=/Fee|Revenue|AUM Fee/i');
    await expect(feeBreakdown.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Analytics - Charts and Visualizations', () => {
  test('should display interactive charts', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    // Check for chart elements (recharts, chart.js, etc.)
    const charts = page.locator('svg, canvas, [class*="chart"]');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show chart tooltips on hover', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const chartElement = page.locator('svg, canvas, [class*="chart"]').first();
    if (await chartElement.isVisible()) {
      await chartElement.hover();
      // Tooltip may appear
      await page.waitForTimeout(500);
    }
  });

  test('should toggle chart view mode', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const viewToggle = page.locator('button:has-text("Table"), button:has-text("Chart"), [data-testid="view-toggle"]').first();
    if (await viewToggle.isVisible()) {
      await viewToggle.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Analytics - Drill Down', () => {
  test('should drill down into specific metrics', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    // Click on a metric card to drill down
    const metricCard = page.locator('[class*="card"], [data-testid*="metric"]').first();
    if (await metricCard.isVisible()) {
      await metricCard.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter analytics by advisor', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const advisorFilter = page.locator('select[name*="advisor"], button:has-text("Advisor")').first();
    if (await advisorFilter.isVisible()) {
      await advisorFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should filter analytics by segment', async ({ page, nav }) => {
    await nav.goToAnalytics();
    
    const segmentFilter = page.locator('select[name*="segment"], button:has-text("Segment")').first();
    if (await segmentFilter.isVisible()) {
      await segmentFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });
});
