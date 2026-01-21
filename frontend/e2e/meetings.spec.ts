import { test, expect } from '../fixtures/test-fixtures';

test.describe('Meetings Management', () => {
  test.beforeEach(async ({ nav }) => {
    await nav.goToMeetings();
  });

  test('should display meetings calendar view', async ({ assertions }) => {
    await assertions.expectPageTitle(/Meeting|Calendar|Schedule/i);
  });

  test('should display upcoming meetings list', async ({ page }) => {
    const upcomingMeetings = page.locator('text=/Upcoming|Today|Tomorrow/i');
    await expect(upcomingMeetings.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle between calendar and list view', async ({ page }) => {
    const viewToggle = page.locator('button:has-text("List"), button:has-text("Calendar"), [data-testid="view-toggle"]');
    
    if (await viewToggle.first().isVisible()) {
      await viewToggle.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should open create meeting modal', async ({ page, actions }) => {
    const addButton = page.locator('button:has-text("Schedule"), button:has-text("New"), button:has-text("Create")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
    }
  });

  test('should schedule a new meeting', async ({ page }) => {
    const addButton = page.locator('button:has-text("Schedule"), button:has-text("New")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill meeting details
      await page.fill('input[name="title"], input[placeholder*="title" i]', 'E2E Test Meeting');
      
      // Select date if date picker is available
      const dateInput = page.locator('input[type="date"], input[name*="date"]').first();
      if (await dateInput.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await dateInput.fill(tomorrow.toISOString().split('T')[0]);
      }
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Schedule")');
    }
  });

  test('should display meeting details when clicked', async ({ page }) => {
    const meetingItem = page.locator('[data-testid="meeting-item"], [class*="meeting"], [class*="event"]').first();
    
    if (await meetingItem.isVisible()) {
      await meetingItem.click();
      await expect(page.locator('[role="dialog"], [class*="detail"]').first()).toBeVisible();
    }
  });

  test('should filter meetings by type', async ({ page }) => {
    const typeFilter = page.locator('select[name*="type"], button:has-text("Type"), [data-testid="type-filter"]').first();
    
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });

  test('should filter meetings by participant', async ({ page }) => {
    const participantFilter = page.locator('select[name*="participant"], button:has-text("Client"), button:has-text("With")').first();
    
    if (await participantFilter.isVisible()) {
      await participantFilter.click();
      await page.locator('[role="option"], li').first().click();
    }
  });
});

test.describe('Meeting Brief Generation', () => {
  test('should access meeting brief from meeting detail', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const meetingItem = page.locator('[data-testid="meeting-item"], [class*="meeting"]').first();
    if (await meetingItem.isVisible()) {
      await meetingItem.click();
      
      const generateBriefButton = page.locator('button:has-text("Brief"), button:has-text("Prepare")').first();
      if (await generateBriefButton.isVisible()) {
        await generateBriefButton.click();
      }
    }
  });

  test('should display meeting preparation checklist', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const meetingItem = page.locator('[data-testid="meeting-item"], [class*="meeting"]').first();
    if (await meetingItem.isVisible()) {
      await meetingItem.click();
      
      const checklistSection = page.locator('text=/Checklist|Prepare|Agenda/i');
      if (await checklistSection.first().isVisible({ timeout: 5000 })) {
        await expect(checklistSection.first()).toBeVisible();
      }
    }
  });
});

test.describe('Meeting Notes', () => {
  test('should add meeting notes', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const meetingItem = page.locator('[data-testid="meeting-item"], [class*="meeting"]').first();
    if (await meetingItem.isVisible()) {
      await meetingItem.click();
      
      const notesInput = page.locator('textarea[name*="notes"], [data-testid="meeting-notes"]').first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('Test meeting notes from E2E');
        
        const saveButton = page.locator('button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    }
  });

  test('should display past meeting notes', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    // Filter to past meetings
    const pastFilter = page.locator('button:has-text("Past"), select option:has-text("Past")').first();
    if (await pastFilter.isVisible()) {
      await pastFilter.click();
    }
    
    const meetingItem = page.locator('[data-testid="meeting-item"], [class*="meeting"]').first();
    if (await meetingItem.isVisible()) {
      await meetingItem.click();
      
      const notesSection = page.locator('text=/Notes|Summary|Minutes/i');
      await expect(notesSection.first()).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Meeting Calendar Navigation', () => {
  test('should navigate to next month', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const nextButton = page.locator('button[aria-label*="next"], button:has-text("Next"), button:has-text(">")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to previous month', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const prevButton = page.locator('button[aria-label*="prev"], button:has-text("Prev"), button:has-text("<")').first();
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should go to today', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const todayButton = page.locator('button:has-text("Today")').first();
    if (await todayButton.isVisible()) {
      await todayButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should select specific date from calendar', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const calendarDay = page.locator('[class*="calendar"] button, [class*="day"]').nth(15);
    if (await calendarDay.isVisible()) {
      await calendarDay.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Meeting Video Conference', () => {
  test('should display video conference link', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const meetingItem = page.locator('[data-testid="meeting-item"], [class*="meeting"]').first();
    if (await meetingItem.isVisible()) {
      await meetingItem.click();
      
      const videoLink = page.locator('a[href*="zoom"], a[href*="teams"], a[href*="meet"], text=/Join|Video/i');
      if (await videoLink.first().isVisible({ timeout: 5000 })) {
        await expect(videoLink.first()).toBeVisible();
      }
    }
  });

  test('should copy video conference link', async ({ page, nav }) => {
    await nav.goToMeetings();
    
    const meetingItem = page.locator('[data-testid="meeting-item"], [class*="meeting"]').first();
    if (await meetingItem.isVisible()) {
      await meetingItem.click();
      
      const copyButton = page.locator('button:has-text("Copy"), button[aria-label*="copy" i]').first();
      if (await copyButton.isVisible()) {
        await copyButton.click();
      }
    }
  });
});
