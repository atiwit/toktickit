import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export const BASE_URL = 'http://localhost:5173';

export const USERS = {
  admin: {
    email: 'admin@toktickit.dev',
    password: 'P@ssw0rd1',
    name: 'Admin User',
    role: 'Administrator',
  },
  itAlpha: {
    email: 'it.alpha@toktickit.dev',
    password: 'P@ssw0rd1',
    name: 'IT Staff Alpha',
    role: 'IT Staff',
  },
  itBeta: {
    email: 'it.beta@toktickit.dev',
    password: 'P@ssw0rd1',
    name: 'IT Staff Beta',
    role: 'IT Staff',
  },
  itInactive: {
    email: 'it.inactive@toktickit.dev',
    password: 'P@ssw0rd1',
    name: 'IT Staff Inactive',
  },
  requesterAlice: {
    email: 'alice.johnson@example.com',
    password: 'P@ssw0rd1',
    name: 'Alice Johnson',
    role: 'Requester',
  },
  requesterBob: {
    email: 'bob.smith@example.com',
    password: 'P@ssw0rd1',
    name: 'Bob Smith',
    role: 'Requester',
  },
  requesterInactive: {
    email: 'robert.taylor@example.com',
    password: 'P@ssw0rd1',
    name: 'Robert Taylor',
  },
  newHireMustChange: {
    email: 'newhire@toktickit.dev',
    password: 'P@ssw0rd1',
    newPassword: 'P@ssw0rd2!',
    name: 'New Hire Staff',
  },
};

/**
 * Resets database to default seed state
 */
export function seedDatabase() {
  try {
    const serverDir = path.resolve(__dirname, '../../server');
    execSync('npx tsx prisma/seed.ts', {
      cwd: serverDir,
      stdio: 'pipe',
      timeout: 30_000,
    });
  } catch (err: any) {
    console.error('Failed to seed database:', err?.message || err);
  }
}

/**
 * Perform login via UI
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('#login-email', { timeout: 10_000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.status() === 200, { timeout: 10_000 }).catch(() => null),
    page.click('#login-submit'),
  ]);
  // Wait until either url leaves /login or change-password card appears
  await page.waitForFunction(() => {
    return !window.location.pathname.startsWith('/login') || !!document.querySelector('#change-password-submit');
  }, { timeout: 10_000 }).catch(() => null);
}

/**
 * Perform logout via UI AppShell
 */
export async function logoutUser(page: Page) {
  const profileToggle = page.locator('#profile-dropdown-toggle');
  if (await profileToggle.isVisible()) {
    await profileToggle.click();
    await page.waitForSelector('#logout-button', { timeout: 5_000 });
    await page.click('#logout-button');
  } else {
    // If on mobile where menu might be inside mobile toggle
    const mobileBtn = page.locator('.mobile-menu-btn');
    if (await mobileBtn.isVisible()) {
      await mobileBtn.click();
      await page.waitForTimeout(300);
    }
    await page.click('#logout-button');
  }
  await page.waitForURL(`${BASE_URL}/login`, { timeout: 10_000 });
}

/**
 * Checks that the page has no horizontal overflow/scrollbar
 */
export async function assertNoHorizontalOverflow(page: Page) {
  const isOverflowing = await page.evaluate(() => {
    const doc = document.documentElement;
    // Tolerance of 2px for browser sub-pixel rounding
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(isOverflowing).toBe(false);
}

/**
 * Captures responsive visual evidence screenshots for desktop, tablet, and mobile.
 */
export async function captureResponsiveScreenshots(
  page: Page,
  relDir: string,
  prefix: string = ''
) {
  const outDir = path.resolve(process.cwd(), relDir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Modals and dialogs are viewport overlays (position: fixed) - capturing them with fullPage
  // causes page scrolling stitch artifacts where overlays are truncated and sticky headers repeat.
  const isModal = Boolean(prefix && (prefix.includes('dialog') || prefix.includes('modal')));

  // Check if browser context is in mobile emulation mode (Pixel 5)
  // If in mobile emulation, setViewportSize might be constrained or throw
  const isMobileProject = page.viewportSize()?.width === 393;

  if (isMobileProject) {
    if (isModal) await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const fileName = prefix ? `${prefix}-mobile.png` : 'mobile.png';
    await page.screenshot({ path: path.join(outDir, fileName), fullPage: !isModal });
    return;
  }

  // Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  if (isModal) await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const desktopName = prefix ? `${prefix}-desktop.png` : 'desktop.png';
  await page.screenshot({ path: path.join(outDir, desktopName), fullPage: !isModal });

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  if (isModal) await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const tabletName = prefix ? `${prefix}-tablet.png` : 'tablet.png';
  await page.screenshot({ path: path.join(outDir, tabletName), fullPage: !isModal });

  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  if (isModal) await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const mobileName = prefix ? `${prefix}-mobile.png` : 'mobile.png';
  await page.screenshot({ path: path.join(outDir, mobileName), fullPage: !isModal });

  // Reset back to Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);
}
