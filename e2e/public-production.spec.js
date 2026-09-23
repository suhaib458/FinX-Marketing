import { test, expect } from '@playwright/test';

async function dismissMobileSplash(page) {
  await page.locator('.mobile-splash').waitFor({ state: 'detached', timeout: 7_000 }).catch(() => {});
}

test('landing page renders without horizontal overflow', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await dismissMobileSplash(page);
  await expect(page).toHaveTitle(/FinX/i);
  await expect(page.locator('body')).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('login page is reachable and exposes the auth form', async ({ page }) => {
  const response = await page.goto('/login');
  expect(response?.ok()).toBeTruthy();
  await dismissMobileSplash(page);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test('protected app route redirects anonymous visitors to login', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});

test('core production runtime dependencies are healthy', async ({ request }) => {
  const live = await request.get('/api/v1/health/live');
  expect(live.status()).toBe(200);
  expect(await live.json()).toMatchObject({ status: 'ok' });

  const ready = await request.get('/api/v1/health/ready');
  expect(ready.status()).toBe(200);
  expect(await ready.json()).toMatchObject({ status: 'ready', database: 'connected' });

  const storage = await request.get('/api/v1/health/storage');
  expect(storage.status()).toBe(200);
  expect(await storage.json()).toMatchObject({ status: 'ready', write: 'ok', delete: 'ok' });

});
