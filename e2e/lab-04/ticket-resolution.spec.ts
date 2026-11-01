import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  USERS,
  seedDatabase,
  loginUser,
  logoutUser,
  assertNoHorizontalOverflow,
  captureResponsiveScreenshots,
} from './helpers';

test.describe('Ticket Workflow & Resolution Gate — Lab 4 (AC-03, AC-04, FR-10)', () => {
  test.beforeEach(async () => {
    seedDatabase();
  });

  test('E2E-RES-01 & E2E-RES-02: Resolution Gate blocks resolution with 0 actions, then allows resolution after adding Action Taken (AC-03, AC-04)', async ({ page }) => {
    // 1. Login as IT Staff Alpha
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/tickets`);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible({ timeout: 10_000 });

    // 2. Open TKT-SEED-0004 (status: WAITING_FOR_REQUESTER, 0 actions taken, can transition to RESOLVED)
    await page.selectOption('#queue-status-filter', 'WAITING_FOR_REQUESTER');
    await page.waitForTimeout(500);

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    const ticketRow = isMobile
      ? page.locator('#queue-list-mobile > div').first()
      : page.locator('#queue-table-desktop tbody tr').first();
    await expect(ticketRow).toBeVisible({ timeout: 10_000 });
    await ticketRow.click();

    // 3. Wait for Staff Ticket Detail
    await expect(page.locator('#staff-ticket-detail')).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);

    // Verify actions count is 0
    const countBadge = page.locator('#actions-taken-count');
    await expect(countBadge).toHaveText('0');

    // 4. Attempt to resolve by clicking "→ Resolved" button
    const resolveBtn = page.locator('#btn-status-resolved');
    await expect(resolveBtn).toBeVisible({ timeout: 5_000 });
    await resolveBtn.click();

    // 5. Intercepted by Resolution Gate — Alert banner appears
    const gateAlert = page.locator('#resolution-gate-alert');
    await expect(gateAlert).toBeVisible({ timeout: 5_000 });
    await expect(gateAlert).toContainText(/Cannot Resolve Ticket/i);
    await expect(gateAlert).toContainText(/You must record at least one Action Taken/i);

    // Capture responsive screenshots of Resolution Gate Alert
    await captureResponsiveScreenshots(page, 'artifacts/lab-04/screenshots/resolution-gate', 'resolution-gate-alert');

    // 6. Click "+ Add Action Taken Now" inside the alert banner
    const addActionNowBtn = page.locator('#btn-resolution-gate-add-action');
    await expect(addActionNowBtn).toBeVisible();
    await addActionNowBtn.click();

    // 7. Action Taken Modal opens directly
    const modal = page.locator('#action-taken-modal');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 8. Fill and submit action details
    await page.fill('#input-action-description', 'Resolution action: Reconfigured router ACL and verified routing tables.');
    await page.fill('#input-action-result', 'All subnets reachable, latency under 5ms, verified with user.');
    await page.click('#btn-save-action');
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // 9. Actions count updates to 1
    await expect(countBadge).toHaveText('1');

    // 10. Now click "→ Resolved" again
    await resolveBtn.click();

    // 11. Ticket successfully transitions to RESOLVED
    // Status badge turns green with text "Resolved"
    const resolvedBadge = page.locator('#staff-ticket-detail').getByText(/^Resolved$/).first();
    await expect(resolvedBadge).toBeVisible({ timeout: 5_000 });

    // Capture responsive screenshots of Resolved Ticket
    await captureResponsiveScreenshots(page, 'artifacts/lab-04/screenshots/resolution-gate', 'ticket-resolved');
  });

  test('E2E-RES-03: Requester indicates Problem Appears Resolved and IT Staff sees advisory flag (FR-10, BR-09)', async ({ page }) => {
    // 1. Login as Requester Bob (owner of TKT-SEED-0003 in progress)
    await loginUser(page, USERS.requesterBob.email, USERS.requesterBob.password);
    await page.goto(`${BASE_URL}/tickets`);
    await page.waitForTimeout(500);

    // Filter to IN_PROGRESS tickets
    await page.selectOption('#status-filter', 'IN_PROGRESS');
    await page.waitForTimeout(500);

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    const ticketRow = isMobile
      ? page.locator('#tickets-list-mobile > div').first()
      : page.locator('#tickets-table-desktop tbody tr').first();
    await expect(ticketRow).toBeVisible({ timeout: 10_000 });
    await ticketRow.click();

    // 2. Wait for Ticket Detail
    await expect(page.locator('#ticket-detail-page')).toBeVisible({ timeout: 10_000 });

    // 3. Click "Problem Appears Resolved"
    const markResolvedBtn = page.locator('#btn-problem-appears-resolved');
    await expect(markResolvedBtn).toBeVisible({ timeout: 10_000 });
    await markResolvedBtn.click();
    const confirmBtn = page.locator('#btn-confirm-resolved');
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    // Verify confirmed banner
    await expect(page.getByText(/Marked as Appears Resolved/i)).toBeVisible({ timeout: 5_000 });

    // 4. Logout Requester
    await logoutUser(page);

    // 5. Login as IT Staff Alpha to verify advisory flag
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/tickets`);
    await page.selectOption('#queue-status-filter', 'IN_PROGRESS');
    await page.waitForTimeout(500);

    const staffTicketRow = isMobile
      ? page.locator('#queue-list-mobile > div').first()
      : page.locator('#queue-table-desktop tbody tr').first();
    await expect(staffTicketRow).toBeVisible({ timeout: 10_000 });
    await staffTicketRow.click();

    await expect(page.locator('#staff-ticket-detail')).toBeVisible({ timeout: 10_000 });
    // Verify advisory indicator banner is displayed
    const advisoryFlag = page.locator('#advisory-requester-resolved');
    await expect(advisoryFlag).toBeVisible({ timeout: 5_000 });
  });
});
