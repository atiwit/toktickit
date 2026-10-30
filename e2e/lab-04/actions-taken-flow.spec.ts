import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  USERS,
  seedDatabase,
  loginUser,
  assertNoHorizontalOverflow,
  captureResponsiveScreenshots,
} from './helpers';

test.describe('Actions Taken Flow — Lab 4 (AC-01, AC-02, AC-05)', () => {
  test.beforeEach(async () => {
    seedDatabase();
  });

  test('E2E-ACT-01: IT Staff creates, verifies auto-performedBy, and edits Action Taken (AC-01, AC-02)', async ({ page }) => {
    // 1. Login as IT Staff Alpha
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/tickets`);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible({ timeout: 10_000 });

    // 2. Filter to active OPEN ticket
    await page.selectOption('#queue-status-filter', 'OPEN');
    await page.waitForTimeout(400);

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    const firstTicketRow = isMobile
      ? page.locator('#queue-list-mobile > div').first()
      : page.locator('#queue-table-desktop tbody tr').first();
    await expect(firstTicketRow).toBeVisible({ timeout: 10_000 });
    await firstTicketRow.click();

    // 3. Wait for Staff Ticket Detail
    await expect(page.locator('#staff-ticket-detail')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#actions-taken-section')).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);

    // Capture responsive screenshots of Staff Ticket Detail
    await captureResponsiveScreenshots(page, 'artifacts/lab-04/screenshots/actions-taken', 'staff-ticket-detail');

    // 4. Click "+ Add Action Taken"
    const addActionBtn = page.locator('#btn-add-action-taken');
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    // 5. Verify modal opens
    const modal = page.locator('#action-taken-modal');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Capture modal dialog screenshot
    await captureResponsiveScreenshots(page, 'artifacts/lab-04/screenshots/actions-taken', 'add-action-modal');

    // 6. Fill Action Taken form
    await page.fill('#input-action-description', 'Inspected hardware connections and replaced faulty patch cord.');
    await page.fill('#input-action-result', 'Diagnostic ping passed 100/100 packets with 0% loss.');

    // Toggle follow-up
    await page.check('#checkbox-follow-up-required');
    await expect(page.locator('#input-follow-up-note')).toBeVisible();
    await page.fill('#input-follow-up-note', 'Monitor port error counters on switch 2 for next 24 hours.');
    await page.fill('#input-attachment-notes', 'cable-cert-report.pdf');

    // Verify Performed By is auto-populated and disabled
    const performedByInput = page.locator('#input-performed-by');
    await expect(performedByInput).toBeDisabled();
    await expect(performedByInput).toHaveValue(/IT Staff Alpha/i);

    // 7. Save Action
    await page.click('#btn-save-action');
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // 8. Assert new Action Taken appears in list
    const actionDesc = page.locator('#actions-taken-section').getByText('Inspected hardware connections and replaced faulty patch cord.');
    await expect(actionDesc).toBeVisible({ timeout: 5_000 });

    const actionResult = page.locator('#actions-taken-section').getByText('Diagnostic ping passed 100/100 packets with 0% loss.');
    await expect(actionResult).toBeVisible();

    const performerChip = page.locator('#actions-taken-section').getByText(/IT Staff Alpha/i).first();
    await expect(performerChip).toBeVisible();

    const followUpBadge = page.locator('#actions-taken-section').getByText(/Follow-up Required/i).first();
    await expect(followUpBadge).toBeVisible();

    // 9. Edit the newly created action
    const editBtn = page.locator('#actions-taken-section button[id^="btn-edit-action-"]').last();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(modal).toBeVisible({ timeout: 5_000 });
    await page.fill('#input-action-description', 'Updated: Inspected hardware connections and certified Cat6 patch cord.');
    await page.click('#btn-save-action');
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // Verify updated description is visible
    const updatedDesc = page.locator('#actions-taken-section').getByText('Updated: Inspected hardware connections and certified Cat6 patch cord.');
    await expect(updatedDesc).toBeVisible({ timeout: 5_000 });
  });

  test('E2E-ACT-02: Requester views Actions Taken in read-only mode (AC-05)', async ({ page }) => {
    // 1. Login as Requester Alice
    await loginUser(page, USERS.requesterAlice.email, USERS.requesterAlice.password);
    await page.goto(`${BASE_URL}/tickets`);
    await page.waitForTimeout(500);

    // 2. Open first ticket
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    const ticketRow = isMobile
      ? page.locator('#tickets-list-mobile > div').first()
      : page.locator('#tickets-table-desktop tbody tr').first();
    await expect(ticketRow).toBeVisible({ timeout: 10_000 });
    await ticketRow.click();

    // 3. Wait for Ticket Detail page
    await expect(page.locator('#ticket-detail-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#actions-taken-section')).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);

    // 4. Assert Read-Only mode: no "+ Add Action Taken" button, no edit buttons
    await expect(page.locator('#btn-add-action-taken')).not.toBeVisible();
    const editButtonsCount = await page.locator('#actions-taken-section button[id^="btn-edit-action-"]').count();
    expect(editButtonsCount).toBe(0);

    // Capture responsive screenshot for Requester read-only Actions Taken
    await captureResponsiveScreenshots(page, 'artifacts/lab-04/screenshots/actions-taken', 'requester-ticket-detail-readonly');
  });
});
