import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  USERS,
  seedDatabase,
  loginUser,
  assertNoHorizontalOverflow,
  captureResponsiveScreenshots,
} from './helpers';

test.describe('Role-Based Dashboards & Navigation — Lab 4 (AC-06, AC-07, AC-08)', () => {
  test.beforeEach(async () => {
    seedDatabase();
  });

  test('E2E-DSH-01: IT Staff Dashboard metrics, drill-down links, and quick actions (AC-07, AC-08)', async ({ page }) => {
    // 1. Login as IT Staff Alpha
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/staff/dashboard`);

    // 2. Verify Staff Dashboard elements
    await expect(page.locator('#staff-dashboard-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#staff-dashboard-header-banner')).toBeVisible();
    await expect(page.getByText(/Welcome back, IT Staff Alpha!/i)).toBeVisible();

    // 3. Verify all 5 operational metric cards
    await expect(page.locator('#card-new')).toBeVisible();
    await expect(page.locator('#card-open')).toBeVisible();
    await expect(page.locator('#card-in-progress')).toBeVisible();
    await expect(page.locator('#card-waiting-for-requester')).toBeVisible();
    await expect(page.locator('#card-my-assigned')).toBeVisible();

    // Verify recent tickets widget and quick actions box
    await expect(page.locator('#staff-quick-actions-box')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Capture responsive screenshots of IT Staff Dashboard
    await captureResponsiveScreenshots(page, 'artifacts/lab-04/screenshots/dashboards', 'staff-dashboard');

    // 4. Click Drill-down: My Assigned card
    await page.click('#card-my-assigned');
    await expect(page).toHaveURL(/status=open-group/);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible({ timeout: 10_000 });

    // Verify dropdowns synced
    const statusSelect = page.locator('#queue-status-filter');
    await expect(statusSelect).toHaveValue('open-group');
    const ownerSelect = page.locator('#queue-owner-filter');
    await expect(ownerSelect).toHaveValue('me');

    // 5. Navigate back to Dashboard
    await page.goto(`${BASE_URL}/staff/dashboard`);
    await expect(page.locator('#staff-dashboard-page')).toBeVisible({ timeout: 10_000 });

    // 6. Test Quick Action: My Queue
    await page.click('#btn-staff-quick-my-queue');
    await expect(page).toHaveURL(/status=open-group/);

    // 7. Test Refresh button
    await page.goto(`${BASE_URL}/staff/dashboard`);
    const refreshBtn = page.locator('#btn-refresh-staff-dashboard');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('#card-my-assigned')).toBeVisible();
  });

  test('E2E-DSH-02: Requester Dashboard metrics, drill-down, and quick actions (AC-06, AC-08)', async ({ page }) => {
    // 1. Login as Requester Alice
    await loginUser(page, USERS.requesterAlice.email, USERS.requesterAlice.password);
    await page.goto(`${BASE_URL}/requester/dashboard`);

    // 2. Verify Requester Dashboard elements
    await expect(page.locator('#requester-dashboard-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#dashboard-header-banner')).toBeVisible();
    await expect(page.getByText(/Welcome, Alice Johnson!/i)).toBeVisible();

    // 3. Verify all 4 status metric cards
    await expect(page.locator('#card-my-open-tickets')).toBeVisible();
    await expect(page.locator('#card-in-progress')).toBeVisible();
    await expect(page.locator('#card-resolved')).toBeVisible();
    await expect(page.locator('#card-closed')).toBeVisible();

    // Verify Quick Actions box
    await expect(page.locator('#requester-quick-actions-box')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Capture responsive screenshots of Requester Dashboard
    await captureResponsiveScreenshots(page, 'artifacts/lab-04/screenshots/dashboards', 'requester-dashboard');

    // 4. Click Drill-down: My Open Tickets card
    await page.click('#card-my-open-tickets');
    await expect(page).toHaveURL(/status=open-group/);
    await expect(page.locator('#status-filter')).toHaveValue('open-group');

    // 5. Navigate back to Requester Dashboard
    await page.goto(`${BASE_URL}/requester/dashboard`);
    await expect(page.locator('#requester-dashboard-page')).toBeVisible({ timeout: 10_000 });

    // 6. Test Quick Action: Create Ticket
    await page.click('#btn-quick-create-ticket');
    await expect(page).toHaveURL(/create-ticket/);

    // 7. Test Refresh button
    await page.goto(`${BASE_URL}/requester/dashboard`);
    const refreshBtn = page.locator('#btn-refresh-dashboard');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('#card-my-open-tickets')).toBeVisible();
  });

  test('E2E-DSH-03: Administrator has full access to Staff Dashboard (A-01, Section 6)', async ({ page }) => {
    // 1. Login as Admin
    await loginUser(page, USERS.admin.email, USERS.admin.password);

    // Should redirect to staff dashboard
    await expect(page).toHaveURL(/staff\/dashboard/);
    await expect(page.locator('#staff-dashboard-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Welcome back, Admin User!/i)).toBeVisible();

    // 2. Verify all operational cards are accessible
    await expect(page.locator('#card-new')).toBeVisible();
    await expect(page.locator('#card-open')).toBeVisible();
    await expect(page.locator('#card-in-progress')).toBeVisible();
    await expect(page.locator('#card-waiting-for-requester')).toBeVisible();
    await expect(page.locator('#card-my-assigned')).toBeVisible();
  });
});
