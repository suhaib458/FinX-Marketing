import { test, expect } from '@playwright/test';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const enabled = process.env.RUN_AUTH_E2E === 'true' && Boolean(email && password);

test.describe('authenticated production journey', () => {
  test.skip(!enabled, 'Set E2E_TEST_EMAIL, E2E_TEST_PASSWORD and RUN_AUTH_E2E=true to run the credit-consuming production journey.');

  test('login -> generate -> save -> library -> settings', async ({ page }) => {
    await page.goto('/login');
    await page.locator('.mobile-splash').waitFor({ state: 'detached', timeout: 7_000 }).catch(() => {});

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(app|onboarding|verify-email)(?:\/|\?|$)/, { timeout: 30_000 });

    if (!page.url().includes('/app')) {
      throw new Error('The E2E account must already be email-verified and onboarded.');
    }

    await page.goto('/app/create/social-post');
    await page.locator('#description').fill('اختبار إنتاج آلي محدود لمنصة FinX. لا يتضمن ادعاءات أو أسعار.');
    await page.locator('.create-generate-btn').click();
    await page.waitForURL(/\/app\/result\//, { timeout: 90_000 });

    await page.locator('button:has(svg.lucide-save)').click();
    await page.goto('/app/library');
    await expect(page.locator('.library-card')).toHaveCountGreaterThan(0);

    await page.goto('/app/settings');
    await expect(page.locator('.settings-page')).toBeVisible();
  });
});
