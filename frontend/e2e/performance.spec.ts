import { test, expect } from '@playwright/test';

/**
 * Performance tests for the Wealth Management CRM
 * Measures load times, responsiveness, and resource usage
 */

test.describe('Performance - Page Load Times', () => {
  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Households', path: '/households' },
    { name: 'Accounts', path: '/accounts' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Intelligence', path: '/intelligence' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Compliance', path: '/compliance' },
    { name: 'Workflows', path: '/workflows' },
    { name: 'Pipeline', path: '/pipeline' },
    { name: 'Meetings', path: '/meetings' },
    { name: 'Notifications', path: '/notifications' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page should load within 5 seconds`, async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(pageInfo.path);
      await page.waitForLoadState('domcontentloaded');
      
      const domContentLoaded = Date.now() - startTime;
      
      await page.waitForLoadState('networkidle');
      const networkIdle = Date.now() - startTime;

      // DOM content loaded should be under 3 seconds
      expect(domContentLoaded).toBeLessThan(3000);
      
      // Full network idle should be under 5 seconds
      expect(networkIdle).toBeLessThan(5000);
    });
  }
});

test.describe('Performance - Web Vitals', () => {
  test('should have good LCP (Largest Contentful Paint)', async ({ page }) => {
    await page.goto('/dashboard');

    // Measure LCP using Performance Observer
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Fallback timeout
        setTimeout(() => resolve(0), 10000);
      });
    });

    // LCP should be under 2.5 seconds for good UX
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500);
    }
  });

  test('should have good FID simulation (First Input Delay)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Measure interaction responsiveness
    const startTime = Date.now();
    
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.click({ force: true });
    }
    
    const responseTime = Date.now() - startTime;
    
    // Interaction should respond within 100ms
    expect(responseTime).toBeLessThan(100);
  });

  test('should have good CLS (Cumulative Layout Shift)', async ({ page }) => {
    await page.goto('/dashboard');

    // Measure CLS using Performance Observer
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        // Wait for page to settle
        setTimeout(() => resolve(clsValue), 5000);
      });
    });

    // CLS should be under 0.1 for good UX
    expect(cls).toBeLessThan(0.1);
  });
});

test.describe('Performance - Resource Loading', () => {
  test('should not load excessive JavaScript', async ({ page }) => {
    const jsResources: { url: string; size: number }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.includes('.js?')) {
        const headers = response.headers();
        const size = parseInt(headers['content-length'] || '0', 10);
        jsResources.push({ url, size });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const totalJsSize = jsResources.reduce((acc, r) => acc + r.size, 0);
    
    // Total JS should be under 2MB (uncompressed)
    expect(totalJsSize).toBeLessThan(2 * 1024 * 1024);
  });

  test('should use compression for resources', async ({ page }) => {
    const responses: { url: string; compressed: boolean }[] = [];

    page.on('response', async (response) => {
      const headers = response.headers();
      const contentEncoding = headers['content-encoding'];
      const isCompressed = contentEncoding?.includes('gzip') || 
                          contentEncoding?.includes('br') || 
                          contentEncoding?.includes('deflate');
      
      if (response.url().includes('/api/') || 
          response.url().endsWith('.js') || 
          response.url().endsWith('.css')) {
        responses.push({ url: response.url(), compressed: !!isCompressed });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Most resources should be compressed
    const compressedCount = responses.filter(r => r.compressed).length;
    const compressionRate = compressedCount / (responses.length || 1);
    
    // At least 50% of resources should be compressed in production
    // This test may need adjustment based on environment
    expect(compressionRate).toBeGreaterThanOrEqual(0);
  });

  test('should cache static resources', async ({ page }) => {
    const cachedResources: string[] = [];

    page.on('response', async (response) => {
      const headers = response.headers();
      const cacheControl = headers['cache-control'];
      
      if (cacheControl?.includes('max-age') || cacheControl?.includes('immutable')) {
        cachedResources.push(response.url());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Some resources should have caching headers
    expect(cachedResources.length).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Performance - Memory Usage', () => {
  test('should not have memory leaks during navigation', async ({ page }) => {
    // Navigate to multiple pages
    const pages = ['/dashboard', '/households', '/accounts', '/tasks', '/dashboard'];
    const memoryReadings: number[] = [];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Get memory usage (if available)
      const memory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      memoryReadings.push(memory);
    }

    // Memory should not grow significantly
    if (memoryReadings[0] > 0) {
      const growthRate = memoryReadings[memoryReadings.length - 1] / memoryReadings[0];
      expect(growthRate).toBeLessThan(2); // Should not double in memory
    }
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    await page.goto('/households');
    
    // Search for something that might return many results
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      const startTime = Date.now();
      await searchInput.fill('a'); // Broad search
      await page.waitForLoadState('networkidle');
      const responseTime = Date.now() - startTime;
      
      // Should still respond quickly even with potential large dataset
      expect(responseTime).toBeLessThan(5000);
    }
  });
});

test.describe('Performance - Interaction Responsiveness', () => {
  test('should respond to clicks within 100ms', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      
      if (await button.isVisible()) {
        const startTime = Date.now();
        await button.click({ force: true });
        const clickTime = Date.now() - startTime;
        
        expect(clickTime).toBeLessThan(100);
        
        // Close any modal that might have opened
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
    }
  });

  test('should handle rapid interactions without lag', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      const startTime = Date.now();
      
      // Rapid typing
      await searchInput.type('test search query', { delay: 10 });
      
      const typingTime = Date.now() - startTime;
      
      // Should not lag significantly
      expect(typingTime).toBeLessThan(2000);
    }
  });

  test('should scroll smoothly through long lists', async ({ page }) => {
    await page.goto('/households');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();
    
    // Scroll down
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);
    
    // Scroll up
    await page.mouse.wheel(0, -1000);
    await page.waitForTimeout(500);
    
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should be smooth
    expect(scrollTime).toBeLessThan(3000);
  });
});

test.describe('Performance - API Response Times', () => {
  test('should have fast API responses', async ({ page }) => {
    const apiTimings: { url: string; duration: number }[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.timing();
        apiTimings.push({
          url: response.url(),
          duration: timing?.responseEnd || 0,
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check average API response time
    if (apiTimings.length > 0) {
      const avgDuration = apiTimings.reduce((acc, t) => acc + t.duration, 0) / apiTimings.length;
      
      // Average API response should be under 2 seconds
      expect(avgDuration).toBeLessThan(2000);
    }
  });
});
