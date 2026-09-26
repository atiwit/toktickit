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

test.describe('Authentication & Session E2E Tests (AC-01, AC-02, AC-05, AC-06, AC-14)', () => {
  test.beforeAll(async () => {
    // Seed database before suite runs
    seedDatabase();
  });

  test('E2E-01: Valid login flow for all roles (AC-01)', async ({ page }) => {
    // 1. Requester login
    await loginUser(page, USERS.requesterAlice.email, USERS.requesterAlice.password);
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.locator('#my-tickets-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#profile-dropdown-toggle')).toContainText(USERS.requesterAlice.name);

    // Verify role-based navigation (handled for desktop and mobile hamburger)
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.waitForTimeout(300);
      await expect(page.locator('a:visible:has-text("My Tickets")')).toBeVisible();
      await expect(page.locator('a:visible:has-text("Create Ticket")')).toBeVisible();
      await expect(page.locator('a:visible:has-text("Ticket Queue")')).not.toBeVisible();
      await expect(page.locator('a:visible:has-text("User Management")')).not.toBeVisible();
      await page.locator('.mobile-menu-btn').click();
      await page.waitForTimeout(300);
    } else {
      await expect(page.locator('.desktop-nav a:has-text("My Tickets")')).toBeVisible();
      await expect(page.locator('.desktop-nav a:has-text("Create Ticket")')).toBeVisible();
      await expect(page.locator('.desktop-nav a:has-text("Ticket Queue")')).not.toBeVisible();
      await expect(page.locator('.desktop-nav a:has-text("User Management")')).not.toBeVisible();
    }

    await logoutUser(page);

    // 2. IT Staff login
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await expect(page).toHaveURL(`${BASE_URL}/staff/tickets`);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#profile-dropdown-toggle')).toBeVisible();

    // Verify role-based navigation for IT Staff
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.waitForTimeout(300);
      await expect(page.locator('a:visible:has-text("Ticket Queue")')).toBeVisible();
      await expect(page.locator('a:visible:has-text("My Tickets")')).not.toBeVisible();
      await expect(page.locator('a:visible:has-text("User Management")')).not.toBeVisible();
      await page.locator('.mobile-menu-btn').click();
      await page.waitForTimeout(300);
    } else {
      await expect(page.locator('.desktop-nav a:has-text("Ticket Queue")')).toBeVisible();
      await expect(page.locator('.desktop-nav a:has-text("My Tickets")')).not.toBeVisible();
      await expect(page.locator('.desktop-nav a:has-text("User Management")')).not.toBeVisible();
    }

    await logoutUser(page);

    // 3. Administrator login
    await loginUser(page, USERS.admin.email, USERS.admin.password);
    await expect(page).toHaveURL(`${BASE_URL}/admin/users`);
    await expect(page.locator('#user-management')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#profile-dropdown-toggle')).toBeVisible();

    // Verify role-based navigation for Administrator
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.waitForTimeout(300);
      await expect(page.locator('a:visible:has-text("User Management")')).toBeVisible();
      await expect(page.locator('a:visible:has-text("Ticket Queue")')).not.toBeVisible();
      await expect(page.locator('a:visible:has-text("My Tickets")')).not.toBeVisible();
      await page.locator('.mobile-menu-btn').click();
      await page.waitForTimeout(300);
    } else {
      await expect(page.locator('.desktop-nav a:has-text("User Management")')).toBeVisible();
      await expect(page.locator('.desktop-nav a:has-text("Ticket Queue")')).not.toBeVisible();
      await expect(page.locator('.desktop-nav a:has-text("My Tickets")')).not.toBeVisible();
    }

    await logoutUser(page);
  });

  test('E2E-02: Initial password login and mandatory password change (AC-02)', async ({ page }) => {
    // Re-seed to ensure newhire has mustChangePassword=true
    seedDatabase();

    await page.goto(`${BASE_URL}/login`);
    await page.fill('#login-email', USERS.newHireMustChange.email);
    await page.fill('#login-password', USERS.newHireMustChange.password);
    await page.click('#login-submit');

    // User is presented with Change Password card
    const changePasswordSubmit = page.locator('#change-password-submit');
    await expect(changePasswordSubmit).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible();

    // Normal app routes should be blocked (redirected to /change-password)
    await page.goto(`${BASE_URL}/staff/tickets`);
    await expect(page).toHaveURL(`${BASE_URL}/change-password`, { timeout: 10_000 });
    await expect(page.locator('#change-password-submit')).toBeVisible({ timeout: 5_000 });

    // Validate password rules:
    // 1. Too short
    await page.fill('#current-password', USERS.newHireMustChange.password);
    await page.fill('#new-password', 'Short1!');
    await page.fill('#confirm-password', 'Short1!');
    await page.click('#change-password-submit');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();

    // 2. Mismatched passwords
    await page.fill('#new-password', USERS.newHireMustChange.newPassword);
    await page.fill('#confirm-password', 'Mism@tched123');
    await page.click('#change-password-submit');
    await expect(page.locator("text=Passwords don't match")).toBeVisible();

    // 3. Valid new password
    await page.fill('#current-password', USERS.newHireMustChange.password);
    await page.fill('#new-password', USERS.newHireMustChange.newPassword);
    await page.fill('#confirm-password', USERS.newHireMustChange.newPassword);
    await page.click('#change-password-submit');

    // Successfully navigated to role home
    await expect(page).toHaveURL(`${BASE_URL}/staff/tickets`, { timeout: 10_000 });
    await expect(page.locator('#staff-ticket-queue')).toBeVisible();

    // Verify session works and subsequent login with new password works
    await logoutUser(page);

    await loginUser(page, USERS.newHireMustChange.email, USERS.newHireMustChange.newPassword);
    await expect(page).toHaveURL(`${BASE_URL}/staff/tickets`);
    await expect(page.locator('#staff-ticket-queue')).toBeVisible();

    await logoutUser(page);
  });

  test('E2E-03: Invalid login credentials and validation (AC-05)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // 1. Client-side empty field validation
    await page.click('#login-submit');
    await expect(page.locator('#login-email-error')).toContainText('Email is required');
    await expect(page.locator('#login-password-error')).toContainText('Password is required');

    // 2. Invalid email format
    await page.fill('#login-email', 'not-an-email');
    await page.fill('#login-password', 'password123');
    await page.click('#login-submit');
    await expect(page.locator('#login-email-error')).toContainText('valid email');

    // 3. Wrong password for existing user
    await page.fill('#login-email', USERS.requesterAlice.email);
    await page.fill('#login-password', 'WrongPassw0rd!');
    await page.click('#login-submit');

    const errorBanner = page.locator('#login-error-banner');
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
    await expect(errorBanner).toContainText('Invalid email or password');

    // 4. Non-existent email
    await page.fill('#login-email', 'nonexistent.user@example.com');
    await page.fill('#login-password', 'AnyPassword123!');
    await page.click('#login-submit');

    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
    // Safe generic message must be identical (no information leakage)
    await expect(errorBanner).toContainText('Invalid email or password');
  });

  test('E2E-04: Inactive account login rejection (AC-05)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Inactive IT Staff
    await page.fill('#login-email', USERS.itInactive.email);
    await page.fill('#login-password', USERS.itInactive.password);
    await page.click('#login-submit');

    const errorBanner = page.locator('#login-error-banner');
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
    await expect(errorBanner).toContainText('Your account is inactive. Please contact an administrator.');
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    // Inactive Requester
    await page.fill('#login-email', USERS.requesterInactive.email);
    await page.fill('#login-password', USERS.requesterInactive.password);
    await page.click('#login-submit');

    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
    await expect(errorBanner).toContainText('Your account is inactive. Please contact an administrator.');
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('E2E-05: Logout and re-access blocked (AC-06)', async ({ page }) => {
    // Login as Alice
    await loginUser(page, USERS.requesterAlice.email, USERS.requesterAlice.password);
    await expect(page).toHaveURL(`${BASE_URL}/`);

    // Perform logout
    await logoutUser(page);

    // Try accessing protected routes directly
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    await page.goto(`${BASE_URL}/create-ticket`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    await page.goto(`${BASE_URL}/staff/tickets`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('E2E-12: Responsive check and screenshots for Authentication screens (AC-14)', async ({ page }) => {
    // 1. Login screen
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('#login-email', { timeout: 10_000 });

    // Verify responsiveness on login
    await assertNoHorizontalOverflow(page);
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/authentication');

    // 2. Change Password screen
    await page.goto(`${BASE_URL}/change-password`);
    await page.waitForSelector('#change-password-submit', { timeout: 10_000 });

    await assertNoHorizontalOverflow(page);
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/authentication', 'change-password');
  });
});
