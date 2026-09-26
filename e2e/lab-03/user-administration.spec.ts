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

test.describe('User Administration & Safety Controls (AC-12, AC-13, AC-17, AC-06, AC-14)', () => {
  test.beforeEach(async () => {
    seedDatabase();
  });

  test('E2E-10: Admin creates user, searches/filters, edits role, and resets password (AC-12, AC-13, AC-17, AC-14)', async ({ page }) => {
    // 1. Log in as Administrator
    await loginUser(page, USERS.admin.email, USERS.admin.password);
    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page.locator('#user-management')).toBeVisible({ timeout: 10_000 });
    const isMobile = (page.viewportSize()?.width ?? 1280) <= 768;
    if (isMobile) {
      await expect(page.locator('.um-card-stack')).toBeVisible();
    } else {
      await expect(page.locator('#users-table')).toBeVisible();
    }

    // Check responsive layout & capture screenshots
    await assertNoHorizontalOverflow(page);
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/user-management');

    const uniqueId = Date.now().toString().slice(-4);
    const newUserName = `Evan Support ${uniqueId}`;
    const newUserEmail = `evan.${uniqueId}@toktickit.dev`;
    const initialPassword = 'InitialPass123!';

    // 2. Open Create User modal
    await page.click('#btn-create-user');
    await expect(page.locator('#modal-title')).toHaveText('Create User');
    await expect(page.locator('#modal-name')).toBeVisible();

    // Capture modal screenshot
    await captureResponsiveScreenshots(page, 'artifacts/lab-03/screenshots/user-management', 'create-modal');

    // Test client validation: empty form submission
    await page.click('#modal-save-btn');
    await expect(page.locator('#modal-error-name')).toBeVisible();
    await expect(page.locator('#modal-error-email')).toBeVisible();
    await expect(page.locator('#modal-error-password')).toBeVisible();

    // Fill new user details (AC-12)
    await page.fill('#modal-name', newUserName);
    await page.fill('#modal-email', newUserEmail);
    await page.selectOption('#modal-role', 'IT_STAFF');
    await page.fill('#modal-password', initialPassword);
    await page.fill('#modal-confirm-password', initialPassword);

    await page.click('#modal-save-btn');
    // Modal should close
    await expect(page.locator('#modal-title')).not.toBeVisible({ timeout: 5_000 });

    const listContainer = isMobile ? page.locator('.um-card-stack') : page.locator('#users-table');

    // Verify user appears in table or card stack
    await expect(listContainer.getByText(newUserEmail)).toBeVisible();

    // 3. Search and filter users
    await page.fill('#user-search', newUserEmail);
    await page.waitForTimeout(300);
    await expect(listContainer.getByText(newUserEmail)).toBeVisible();
    await expect(listContainer.getByText(USERS.requesterAlice.email)).not.toBeVisible();

    // Filter by role: IT_STAFF
    await page.selectOption('#user-role-filter', 'IT_STAFF');
    await page.waitForTimeout(300);
    await expect(listContainer.getByText(newUserEmail)).toBeVisible();

    // Clear filters
    await page.fill('#user-search', '');
    await page.selectOption('#user-role-filter', '');
    await page.waitForTimeout(300);

    // 4. Edit User: Change name and promote to ADMINISTRATOR (AC-13)
    const userContainer = isMobile
      ? page.locator('.um-card-stack > div', { hasText: newUserEmail })
      : page.locator(`tr:has-text("${newUserEmail}")`);
    await expect(userContainer).toBeVisible();
    const editBtn = userContainer.locator('button:has-text("Edit")');
    await editBtn.click();

    await expect(page.locator('#modal-title')).toContainText('Edit User');
    const updatedName = `${newUserName} Promoted`;
    await page.fill('#modal-name', updatedName);
    await page.selectOption('#modal-role', 'ADMINISTRATOR');
    await page.click('#modal-save-btn');

    await expect(page.locator('#modal-title')).not.toBeVisible({ timeout: 5_000 });
    // Verify updated details
    const updatedContainer = isMobile
      ? page.locator('.um-card-stack > div', { hasText: newUserEmail })
      : page.locator(`tr:has-text("${newUserEmail}")`);
    await expect(updatedContainer).toContainText(updatedName);
    await expect(updatedContainer).toContainText('Administrator');

    // 5. Reset Password for User (AC-17)
    const resetBtn = updatedContainer.locator('button:has-text("Reset PW")');
    await resetBtn.click();

    await expect(page.locator('#modal-title')).toHaveText('Reset Password');
    // Test mismatch validation
    await page.fill('#modal-password', 'NewTempPass456!');
    await page.fill('#modal-confirm-password', 'MismatchPass456!');
    await page.click('#modal-save-btn');
    await expect(page.locator('#modal-error-confirm-password')).toHaveText('Passwords do not match');

    // Fill matching valid password
    const resetPassword = 'NewTempPass456!';
    await page.fill('#modal-confirm-password', resetPassword);
    await page.click('#modal-save-btn');
    await expect(page.locator('#modal-title')).not.toBeVisible({ timeout: 5_000 });

    await logoutUser(page);

    // 6. Verify user can log in with reset password and must change password (AC-02, AC-17)
    await loginUser(page, newUserEmail, resetPassword);

    // User is presented with Change Password card
    const changePasswordSubmit = page.locator('#change-password-submit');
    await expect(changePasswordSubmit).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible();

    // Normal app routes should be blocked (redirected to /change-password)
    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page).toHaveURL(`${BASE_URL}/change-password`, { timeout: 10_000 });
    await expect(page.locator('#change-password-submit')).toBeVisible({ timeout: 5_000 });

    // Complete password change
    const finalPassword = 'FinalPass789!';
    await page.fill('#current-password', resetPassword);
    await page.fill('#new-password', finalPassword);
    await page.fill('#confirm-password', finalPassword);
    await page.click('#change-password-submit');

    // Lands on /admin/users because user was promoted to ADMINISTRATOR
    await expect(page).toHaveURL(`${BASE_URL}/admin/users`, { timeout: 10_000 });
    await expect(page.locator('#user-management')).toBeVisible();

    await logoutUser(page);
  });

  test('E2E-11: Safety controls: duplicate email rejected, self-deactivation blocked, last admin protected, and role guards (AC-12, AC-13, AC-06)', async ({ page }) => {
    // 1. Log in as Administrator
    await loginUser(page, USERS.admin.email, USERS.admin.password);
    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page.locator('#user-management')).toBeVisible({ timeout: 10_000 });

    // --- Safety Rule 1: Duplicate Email Rejection (AC-12, BR-16) ---
    await page.click('#btn-create-user');
    await expect(page.locator('#modal-title')).toHaveText('Create User');
    await page.fill('#modal-name', 'Duplicate Tester');
    await page.fill('#modal-email', USERS.requesterAlice.email); // Existing email
    await page.selectOption('#modal-role', 'REQUESTER');
    await page.fill('#modal-password', 'SomeValidPass123!');
    await page.fill('#modal-confirm-password', 'SomeValidPass123!');
    await page.click('#modal-save-btn');

    // Expect server error rejection
    await expect(page.locator('#modal-api-error')).toContainText(/already in use/i, { timeout: 5_000 });
    await page.click('#modal-close-btn');
    await expect(page.locator('#modal-title')).not.toBeVisible();

    // --- Safety Rule 2: Admin cannot deactivate own account (AC-13, BR-21, UI-14) ---
    const isMobileE11 = (page.viewportSize()?.width ?? 1280) <= 768;
    const adminContainer = isMobileE11
      ? page.locator('.um-card-stack > div', { hasText: USERS.admin.email })
      : page.locator(`tr:has-text("${USERS.admin.email}")`);
    await expect(adminContainer).toBeVisible();
    await adminContainer.locator('button:has-text("Edit")').click();

    await expect(page.locator('#modal-title')).toContainText('Edit User');
    // Active checkbox is disabled and explanation text is visible (UI-14, BR-21)
    await expect(page.locator('#modal-active')).toBeDisabled();
    await expect(page.locator('text=You cannot deactivate your own account')).toBeVisible();
    await page.click('#modal-close-btn');
    await expect(page.locator('#modal-title')).not.toBeVisible();

    // --- Safety Rule 3: Last active Administrator protection (AC-13, BR-22) ---
    await adminContainer.locator('button:has-text("Edit")').click();
    await expect(page.locator('#modal-title')).toContainText('Edit User');
    // Attempt to change role away from ADMINISTRATOR to IT_STAFF
    await page.selectOption('#modal-role', 'IT_STAFF');
    await page.click('#modal-save-btn');

    // Expect rejection error: Cannot deactivate or change role of the last active Administrator
    await expect(page.locator('#modal-api-error')).toContainText(/last active administrator/i, { timeout: 5_000 });
    await page.click('#modal-close-btn');
    await expect(page.locator('#modal-title')).not.toBeVisible();

    await logoutUser(page);

    // --- Safety Rule 4: Role-based Access Control (AC-06, FR-06) ---
    // Requester accessing /admin/users directly
    await loginUser(page, USERS.requesterAlice.email, USERS.requesterAlice.password);
    await page.goto(`${BASE_URL}/admin/users`);
    // Should render ForbiddenPage ("Access Denied")
    await expect(page.locator('text=Access Denied')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('#user-management')).not.toBeVisible();
    await logoutUser(page);

    // IT Staff accessing /admin/users directly
    await loginUser(page, USERS.itAlpha.email, USERS.itAlpha.password);
    await page.goto(`${BASE_URL}/admin/users`);
    // Should render ForbiddenPage ("Access Denied")
    await expect(page.locator('text=Access Denied')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('#user-management')).not.toBeVisible();
    await logoutUser(page);
  });
});
