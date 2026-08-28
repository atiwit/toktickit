import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Seed-dependent values — adjust if seed data differs
const REQUESTER_NAME = 'Alice Johnson';
const CATEGORY      = 'Hardware';
const SYSTEM        = 'Corporate Laptop';

test.describe('E2E-01: Requester Ticket Flow', () => {
  test('Select requester → Create ticket → Find in My Tickets → Open detail → See attachments section', async ({ page }) => {

    await page.goto(`${BASE}/login`);
    await page.waitForSelector('select', { timeout: 10_000 });

    const select = page.locator('select').first();
    await select.selectOption({ label: 'Alice Johnson (alice.johnson@example.com)' });
    await page.click('button:has-text("Continue")');

    await expect(page).toHaveURL(`${BASE}/`);
    await page.waitForSelector('#my-tickets-page', { timeout: 10_000 });

    await page.click('#btn-create-ticket');
    await expect(page).toHaveURL(`${BASE}/create-ticket`);

    const uniqueSummary = `E2E Test Ticket ${Date.now()}`;

    await page.selectOption('#field-category', { label: CATEGORY });
    await page.selectOption('#field-related-system', { label: SYSTEM });
    await page.selectOption('#field-priority', 'HIGH');
    await page.fill('#field-summary', uniqueSummary);
    await page.fill('#field-description', 'This is an automated E2E test ticket. Please ignore.');

    await page.click('#submit-ticket-btn');

    // Wait for success state (ticket number shown)
    const ticketNumberEl = await page.waitForSelector('#created-ticket-number', { timeout: 10_000 });
    const ticketNumber = await ticketNumberEl.textContent() ?? '';
    expect(ticketNumber).toMatch(/TKT-\d{8}-\d{4}/);

    await page.goto(`${BASE}/`);
    await page.waitForSelector('#my-tickets-page', { timeout: 10_000 });

    await page.fill('#search-input', uniqueSummary);
    await page.waitForSelector('#tickets-table-desktop', { timeout: 10_000 });

    await expect(page.locator('text=' + uniqueSummary).first()).toBeVisible({ timeout: 8_000 });

    await page.locator('text=' + uniqueSummary).first().click();
    await page.waitForSelector('#ticket-detail-page', { timeout: 10_000 });

    await expect(page.locator('#ticket-detail-number')).toContainText('TKT-');

    await expect(page.locator('text=' + uniqueSummary).first()).toBeVisible();

    // Verify all key fields are present as text (not inputs)
    await expect(page.locator('text=Hardware')).toBeVisible();
    await expect(page.locator(`text=${SYSTEM}`)).toBeVisible();

    await expect(page.locator('#attachment-section')).toBeVisible();
    // Upload input is present
    await expect(page.locator('#attachment-upload-input')).toBeAttached();

    const screenshotDir = 'artifacts/lab-02/screenshots';

    // 1280px — Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: `${screenshotDir}/ticket-detail-1280.png`, fullPage: true });

    // 768px — Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: `${screenshotDir}/ticket-detail-768.png`, fullPage: true });

    // 375px — Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: `${screenshotDir}/ticket-detail-375.png`, fullPage: true });
  });

  test('AC-03: Requester B cannot view Requester A\'s ticket detail', async ({ page, context }) => {

    // Set requester context to Requester 1 (Alice)
    await page.goto(`${BASE}/login`);
    await page.waitForSelector('select', { timeout: 10_000 });
    const select = page.locator('select').first();
    await select.selectOption({ label: 'Alice Johnson (alice.johnson@example.com)' });
    await page.click('button:has-text("Continue")');
    await page.waitForURL(`${BASE}/`);

    // Now switch to a different requester (Bob — id=2) in localStorage
    // while keeping the URL pointed at Alice's ticket (id=1)
    await page.evaluate(() => {
      localStorage.setItem(
        'selectedRequester',
        JSON.stringify({ id: 2, name: 'Bob Smith', email: 'bob@example.com' })
      );
    });

    // Navigate to ticket id=1 (owned by Alice, not Bob)
    await page.goto(`${BASE}/tickets/1`);
    await page.waitForSelector('#ticket-detail-page', { timeout: 10_000 });

    // Expect the 403 forbidden state
    await expect(page.locator('#ticket-detail-forbidden')).toBeVisible({ timeout: 8_000 });

    // Sensitive data must NOT be visible
    await expect(page.locator('#ticket-detail-description')).not.toBeAttached();
  });
});
