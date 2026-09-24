import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import {
  BASE_URL,
  USERS,
  seedDatabase,
  loginUser,
  logoutUser,
  assertNoHorizontalOverflow,
  captureResponsiveScreenshots,
} from './helpers';

test.describe('IT Staff Ticket Flow & Requester Continuation (AC-07..11, AC-14..16)', () => {
  test.beforeEach(async () => {
    seedDatabase();
  });

  test('E2E-06: IT Staff Queue search, filter, sort, pagination (AC-07, AC-14)', async ({ page }) => {
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/tickets`);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible({ timeout: 10_000 });

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;

    // Check responsive layout
    if (isMobile) {
      await expect(page.locator('#queue-list-mobile')).toBeVisible();
      await expect(page.locator('#queue-table-desktop')).not.toBeVisible();
    } else {
      await expect(page.locator('#queue-table-desktop')).toBeVisible();
      await expect(page.locator('#queue-list-mobile')).not.toBeVisible();
    }
    await assertNoHorizontalOverflow(page);
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/staff-queue');

    // 1. Search by ticket number
    await page.fill('#queue-search', 'TKT-SEED-0001');
    await page.waitForTimeout(400);
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0001' }).first()).toBeVisible();
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0002' })).not.toBeVisible();

    // 2. Clear filters
    await page.click('#btn-clear-filters');
    await page.waitForTimeout(400);
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0001' }).first()).toBeVisible();
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0002' }).first()).toBeVisible();

    // 3. Filter by Status: NEW
    await page.selectOption('#queue-status-filter', 'NEW');
    await page.waitForTimeout(400);
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0001' }).first()).toBeVisible();
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0002' })).not.toBeVisible();

    // Capture filtered state screenshot
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/staff-queue', 'filtered');

    // 4. Filter by IT Priority: HIGH
    await page.selectOption('#queue-status-filter', '');
    await page.selectOption('#queue-priority-filter', 'HIGH');
    await page.waitForTimeout(400);
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0001' }).first()).toBeVisible();

    // 5. Filter by Owner: unassigned
    await page.selectOption('#queue-priority-filter', '');
    await page.selectOption('#queue-owner-filter', 'unassigned');
    await page.waitForTimeout(400);
    await expect(page.locator(':visible').filter({ hasText: 'TKT-SEED-0001' }).first()).toBeVisible();

    // 6. Reset filters
    await page.click('#btn-clear-filters');
    await page.waitForTimeout(400);

    // 7. Sort toggling (desktop)
    if (!isMobile) {
      await page.click('th:has-text("Ticket #")');
      await page.waitForTimeout(300);
      await page.click('th:has-text("Status")');
      await page.waitForTimeout(300);
    }

    await logoutUser(page);
  });

  test('E2E-07: IT Staff claims ticket, sets IT priority, changes status with confirmation (AC-08, AC-09, AC-10)', async ({ page }) => {
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/tickets`);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible({ timeout: 10_000 });

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;

    // Open TKT-SEED-0001 (which is NEW and Unassigned) by clicking in the queue
    if (isMobile) {
      await page.locator('#queue-list-mobile div:has-text("TKT-SEED-0001")').first().click();
    } else {
      await page.locator('tr:has-text("TKT-SEED-0001") button:has-text("Open")').click();
    }

    await expect(page.locator('#staff-ticket-detail')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#staff-ticket-number')).toContainText('TKT-SEED-0001');

    await assertNoHorizontalOverflow(page);
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/staff-ticket-detail');

    // 1. Claim ticket (AC-08)
    const claimBtn = page.locator('#btn-claim-ticket');
    await expect(claimBtn).toBeVisible();
    await claimBtn.click();
    await expect(page.locator('text=You are the current owner')).toBeVisible({ timeout: 5_000 });

    // 2. Set IT Priority to CRITICAL (AC-09)
    await page.selectOption('#select-it-priority', 'CRITICAL');
    await expect(page.locator('text=IT Priority updated')).toBeVisible({ timeout: 5_000 });

    // 3. Status Transition: NEW -> OPEN (AC-10)
    const openBtn = page.locator('#btn-status-open');
    await expect(openBtn).toBeVisible();
    await openBtn.click();
    await expect(page.locator('text=Status updated to "Open"')).toBeVisible({ timeout: 5_000 });

    // 4. Status Transition: OPEN -> IN_PROGRESS
    const inProgressBtn = page.locator('#btn-status-in_progress');
    await expect(inProgressBtn).toBeVisible();
    await inProgressBtn.click();
    await expect(page.locator('text=Status updated to "In Progress"')).toBeVisible({ timeout: 5_000 });

    // 5. Destructive transition: IN_PROGRESS -> CANCELLED with confirmation dialog
    const cancelBtn = page.locator('#btn-status-cancelled');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Verify confirmation dialog appears
    const dialog = page.locator('#confirm-transition-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Are you sure you want to cancel this ticket?');

    // Capture screenshot of confirmation dialog
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/staff-ticket-detail', 'cancel-dialog');

    // Dismiss dialog first (Keep Ticket)
    await page.click('#btn-confirm-dialog-dismiss');
    await expect(dialog).not.toBeVisible();

    // Click cancel again and proceed
    await cancelBtn.click();
    await expect(dialog).toBeVisible();
    await page.click('#btn-confirm-dialog-proceed');

    // Verify status updated to Cancelled
    await expect(page.locator('text=Status updated to "Cancelled"')).toBeVisible({ timeout: 5_000 });
    // Cancelled is terminal, no transition buttons should be available
    await expect(page.locator('text=No status transitions available.')).toBeVisible();

    await logoutUser(page);
  });

  test('E2E-08: IT Staff comments, notes, and authorization visibility (AC-11, AC-04)', async ({ page }) => {
    // 1. IT Staff posts comment and internal note on TKT-SEED-0002 (owned by Alice)
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/tickets`);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible({ timeout: 10_000 });

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (isMobile) {
      await page.locator('#queue-list-mobile div:has-text("TKT-SEED-0002")').first().click();
    } else {
      await page.locator('tr:has-text("TKT-SEED-0002") button:has-text("Open")').click();
    }

    await expect(page.locator('#staff-ticket-detail')).toBeVisible({ timeout: 10_000 });

    // Save ticket URL/ID to use for Alice
    const staffDetailUrl = page.url();
    const ticketIdMatch = staffDetailUrl.match(/\/staff\/tickets\/(\d+)/);
    const ticketId = ticketIdMatch ? ticketIdMatch[1] : null;
    expect(ticketId).not.toBeNull();

    const commentText = `IT Staff public update ${Date.now()}`;
    const noteText = `Secret IT note internal only ${Date.now()}`;

    // Post Public Comment
    await page.fill('#comment-input-staff', commentText);
    await page.click('#btn-post-comment-staff');
    await expect(page.locator(`text=${commentText}`)).toBeVisible({ timeout: 5_000 });

    // Post Internal Note
    await page.fill('#note-input-staff', noteText);
    await page.click('#btn-post-note-staff');
    await expect(page.locator(`text=${noteText}`)).toBeVisible({ timeout: 5_000 });

    await logoutUser(page);

    // 2. Requester (Alice) views ticket
    await loginUser(page, USERS.requesterAlice.email, USERS.requesterAlice.password);
    await page.goto(`${BASE_URL}/tickets/${ticketId}`);
    await expect(page.locator('#ticket-detail-page')).toBeVisible({ timeout: 10_000 });

    // Public comment MUST be visible to Requester
    await expect(page.locator(`text=${commentText}`)).toBeVisible();

    // Internal note MUST NOT be visible to Requester (AC-04)
    await expect(page.locator(`text=${noteText}`)).not.toBeAttached();
    await expect(page.locator('text=Internal Notes')).not.toBeAttached();

    await logoutUser(page);
  });

  test('E2E-09: Requester indicates "Problem Appears Resolved" (AC-16)', async ({ page }) => {
    // TKT-SEED-0003 is IN_PROGRESS and owned by Bob Smith
    await loginUser(page, USERS.requesterBob.email, USERS.requesterBob.password);
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('#my-tickets-page')).toBeVisible({ timeout: 10_000 });

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;

    // Click TKT-SEED-0003
    await page.fill('#search-input', 'TKT-SEED-0003');
    await page.waitForTimeout(400);
    if (isMobile) {
      await page.locator('#tickets-list-mobile div:has-text("TKT-SEED-0003")').first().click();
    } else {
      await page.locator('tr:has-text("TKT-SEED-0003")').click();
    }

    await expect(page.locator('#ticket-detail-page')).toBeVisible({ timeout: 10_000 });

    // Grab ticket ID
    const bobUrl = page.url();
    const bobIdMatch = bobUrl.match(/\/tickets\/(\d+)/);
    const bobTicketId = bobIdMatch ? bobIdMatch[1] : null;
    expect(bobTicketId).not.toBeNull();

    // Button should be visible for IN_PROGRESS ticket
    const appearsResolvedBtn = page.locator('#btn-problem-appears-resolved');
    await expect(appearsResolvedBtn).toBeVisible();

    await appearsResolvedBtn.click();

    // Confirmation prompt appears
    await expect(page.locator('text=Are you sure? This indicates to IT Staff that the issue appears resolved.')).toBeVisible();
    await page.click('#btn-confirm-resolved');

    // Indicator updates
    await expect(page.locator('text=Marked as Appears Resolved')).toBeVisible({ timeout: 5_000 });

    // Status MUST NOT be Resolved or Closed directly (BR-05, AC-16)
    // The status badge must still be In Progress
    await expect(page.locator('#ticket-detail-page')).toContainText('In Progress');

    await logoutUser(page);

    // IT Staff logs in and sees requester indication on staff ticket detail
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/tickets/${bobTicketId}`);
    await expect(page.locator('text=Requester indicated: problem appears resolved')).toBeVisible({ timeout: 5_000 });

    await logoutUser(page);
  });

  test('E2E-13: Requester Lab 2 functions continue to work after migration (AC-15, AC-03)', async ({ page }) => {
    await loginUser(page, USERS.requesterAlice.email, USERS.requesterAlice.password);

    // 1. Create ticket as authenticated Requester
    await page.goto(`${BASE_URL}/create-ticket`);
    await expect(page.locator('#create-ticket-form')).toBeVisible({ timeout: 10_000 });

    const uniqueSummary = `E2E Migration Ticket ${Date.now()}`;
    await page.selectOption('#field-category', { label: 'Hardware' });
    await page.selectOption('#field-related-system', { label: 'Corporate Laptop' });
    await page.selectOption('#field-priority', 'HIGH');
    await page.fill('#field-summary', uniqueSummary);
    await page.fill('#field-description', 'Automated test verifying Requester Lab 2 features in Lab 3.');

    await page.click('#submit-ticket-btn');

    // Wait for success
    const ticketNumberEl = await page.waitForSelector('#created-ticket-number', { timeout: 10_000 });
    const ticketNumber = (await ticketNumberEl.textContent()) ?? '';
    expect(ticketNumber).toMatch(/TKT-\d{8}-\d{4}/);

    // 2. Find in My Tickets
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('#my-tickets-page', { timeout: 10_000 });
    await page.fill('#search-input', uniqueSummary);
    await page.waitForTimeout(400);

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (isMobile) {
      await page.locator(`#tickets-list-mobile div:has-text("${uniqueSummary}")`).first().click();
    } else {
      await page.locator(`tr:has-text("${uniqueSummary}")`).click();
    }

    // 3. Detail page & Attachments
    await expect(page.locator('#ticket-detail-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#attachment-section')).toBeVisible();

    // Create a temporary PNG file to upload (JPG, PNG, WEBP, PDF allowed)
    const tempFilePath = path.resolve(process.cwd(), 'temp-test-attachment.png');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    fs.writeFileSync(tempFilePath, pngBuffer);

    try {
      await page.setInputFiles('#attachment-upload-input', tempFilePath);
      await page.click('#upload-btn');
      await expect(page.locator('text=temp-test-attachment.png')).toBeVisible({ timeout: 10_000 });
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    // Grab ticket ID from URL
    const url = page.url();
    const match = url.match(/\/tickets\/(\d+)/);
    const createdTicketId = match ? match[1] : null;
    expect(createdTicketId).not.toBeNull();

    await logoutUser(page);

    // 4. Requester B (Bob) cannot view Alice's ticket (AC-03)
    await loginUser(page, USERS.requesterBob.email, USERS.requesterBob.password);
    await page.goto(`${BASE_URL}/tickets/${createdTicketId}`);

    // Expect 404/Forbidden state or Ticket not found
    await expect(page.locator('#ticket-detail-error')).toBeVisible({ timeout: 8_000 });
    // Alice's summary/description must not be exposed
    await expect(page.locator(`text=${uniqueSummary}`)).not.toBeAttached();

    await logoutUser(page);
  });
});
