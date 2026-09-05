import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

const captureScreenshots = async (page: any, stateName: string) => {
  const dir = `artifacts/lab-02/screenshots/extra-states/${stateName}`;
  
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/tablet.png`, fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/mobile.png`, fullPage: true });
};

test.describe('Capture Extra States for PDF', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Alice
    await page.goto(`${BASE}/login`);
    await page.waitForSelector('select', { timeout: 10_000 });
    const select = page.locator('select').first();
    await select.selectOption({ label: 'Alice Johnson' });
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test('Capture Validation Failure', async ({ page }) => {
    await page.goto(`${BASE}/create-ticket`);
    await page.waitForSelector('#submit-ticket-btn');
    
    // Click submit without filling required fields
    await page.click('#submit-ticket-btn');
    
    // Wait for validation errors to appear
    await page.waitForTimeout(500); // give UI time to render errors
    
    await captureScreenshots(page, 'validation-failure');
  });

  test('Capture Success State', async ({ page }) => {
    await page.goto(`${BASE}/create-ticket`);
    await page.waitForSelector('#submit-ticket-btn');
    
    await page.selectOption('#field-category', { label: 'Hardware' });
    await page.selectOption('#field-related-system', { label: 'Corporate Laptop' });
    await page.selectOption('#field-priority', 'HIGH');
    await page.fill('#field-summary', 'Screenshot Test Ticket');
    await page.fill('#field-description', 'Testing success state screenshot.');
    
    await page.click('#submit-ticket-btn');
    
    // Wait for success message
    await page.waitForSelector('#created-ticket-number', { timeout: 10_000 });
    await page.waitForTimeout(500); 
    
    await captureScreenshots(page, 'success-state');
  });

  test('Capture API Failure State', async ({ page }) => {
    // Intercept API call and force a failure
    await page.route('**/api/tickets', route => route.fulfill({
      status: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    }));
    
    await page.goto(`${BASE}/create-ticket`);
    await page.waitForSelector('#submit-ticket-btn');
    
    await page.selectOption('#field-category', { label: 'Hardware' });
    await page.selectOption('#field-related-system', { label: 'Corporate Laptop' });
    await page.selectOption('#field-priority', 'HIGH');
    await page.fill('#field-summary', 'API Failure Test Ticket');
    await page.fill('#field-description', 'Testing API failure state screenshot.');
    
    await page.click('#submit-ticket-btn');
    
    // Wait for error message alert
    await page.waitForTimeout(1000); 
    
    await captureScreenshots(page, 'api-failure');
  });
});
