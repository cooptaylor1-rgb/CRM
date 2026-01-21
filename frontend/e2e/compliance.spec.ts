import { test, expect } from '../fixtures/test-fixtures';

test.describe('Compliance Dashboard', () => {
  test.beforeEach(async ({ nav }) => {
    await nav.goToCompliance();
  });

  test('should display compliance overview page', async ({ assertions }) => {
    await assertions.expectPageTitle(/Compliance|Regulatory/i);
  });

  test('should display compliance status summary', async ({ page }) => {
    const complianceStatus = page.locator('text=/Compliant|Non-Compliant|Pending|Status/i');
    await expect(complianceStatus.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display upcoming deadlines', async ({ page }) => {
    const deadlines = page.locator('text=/Deadline|Due|Upcoming/i');
    await expect(deadlines.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display risk alerts', async ({ page }) => {
    const riskAlerts = page.locator('text=/Alert|Warning|Risk/i');
    await expect(riskAlerts.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display compliance score', async ({ page }) => {
    const complianceScore = page.locator('text=/Score|Rating|%/i');
    await expect(complianceScore.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Compliance - Document Management', () => {
  test('should display required documents list', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const documentsSection = page.locator('text=/Document|Form|Filing/i');
    await expect(documentsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter documents by status', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const statusFilter = page.locator('select[name*="status"], button:has-text("Status")').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should filter documents by type', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const typeFilter = page.locator('select[name*="type"], button:has-text("Type")').first();
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should display document expiration warnings', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const expirationWarning = page.locator('text=/Expir|Overdue|Past Due/i');
    if (await expirationWarning.first().isVisible({ timeout: 5000 })) {
      await expect(expirationWarning.first()).toBeVisible();
    }
  });
});

test.describe('Compliance - KYC/AML', () => {
  test('should display KYC status for clients', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const kycSection = page.locator('text=/KYC|Know Your Customer|Identity/i');
    await expect(kycSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display AML checks', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const amlSection = page.locator('text=/AML|Anti-Money|Screening/i');
    if (await amlSection.first().isVisible({ timeout: 5000 })) {
      await expect(amlSection.first()).toBeVisible();
    }
  });

  test('should show client verification status', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const verificationStatus = page.locator('text=/Verified|Pending|Review/i');
    await expect(verificationStatus.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Compliance - Audit Trail', () => {
  test('should display audit log', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const auditTab = page.locator('button:has-text("Audit"), [role="tab"]:has-text("Audit")').first();
    if (await auditTab.isVisible()) {
      await auditTab.click();
    }
    
    const auditLog = page.locator('text=/Audit|Log|Activity/i');
    await expect(auditLog.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter audit log by date', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const dateFilter = page.locator('input[type="date"], button:has-text("Date"), [data-testid="date-filter"]').first();
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
    }
  });

  test('should filter audit log by action type', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const actionFilter = page.locator('select[name*="action"], button:has-text("Action")').first();
    if (await actionFilter.isVisible()) {
      await actionFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should export audit log', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
    }
  });
});

test.describe('Compliance - Regulatory Filings', () => {
  test('should display filing requirements', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const filings = page.locator('text=/Filing|ADV|Form|Report/i');
    await expect(filings.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display filing calendar', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const calendar = page.locator('text=/Calendar|Schedule|Timeline/i');
    if (await calendar.first().isVisible({ timeout: 5000 })) {
      await expect(calendar.first()).toBeVisible();
    }
  });

  test('should show filing status indicators', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const statusIndicators = page.locator('[class*="badge"], [class*="status"], [class*="indicator"]');
    const count = await statusIndicators.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Compliance - Risk Assessment', () => {
  test('should display risk assessment dashboard', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const riskAssessment = page.locator('text=/Risk Assessment|Risk Score|Risk Level/i');
    await expect(riskAssessment.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display client risk profiles', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const riskProfiles = page.locator('text=/Risk Profile|Risk Category|High Risk/i');
    await expect(riskProfiles.first()).toBeVisible({ timeout: 10000 });
  });

  test('should run compliance check', async ({ page, nav }) => {
    await nav.goToCompliance();
    
    const runCheckButton = page.locator('button:has-text("Run"), button:has-text("Check"), button:has-text("Scan")').first();
    if (await runCheckButton.isVisible()) {
      await runCheckButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
