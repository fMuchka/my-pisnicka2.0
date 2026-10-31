import { test, expect } from '@playwright/test';
import { dismissCookieConsent, login, TEST_CREDENTIALS } from './support/login';

test.describe('Login flow', () => {
  test('shows the cookie consent notice on first visit and remembers acceptance', async ({
    page,
  }) => {
    await page.goto('/login');

    const notice = page.getByText('Sušenky, co nešmírují');
    await expect(notice).toBeVisible();

    await page.getByRole('button', { name: 'Přijmout' }).click();
    await expect(notice).not.toBeVisible();

    await page.reload();
    await expect(page.getByText('Sušenky, co nešmírují')).not.toBeVisible();
  });

  test('logs in with valid credentials and lands on home', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/\/$/);
  });

  test('shows an error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieConsent(page);

    await page.getByLabel('Uživatel').fill(TEST_CREDENTIALS.email);
    await page.getByLabel('Heslo', { exact: true }).fill('wrong');
    await page.getByRole('button', { name: /přihlásit se/i }).click();

    await expect(page.getByText(/špatné údaje/i).first()).toBeVisible();
  });

  test('logout clears the session and redirects back to login', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: /uživatelské možnosti/i }).click();
    await page.getByRole('menuitem', { name: /odhlásit se/i }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('protected route redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
  });
});
