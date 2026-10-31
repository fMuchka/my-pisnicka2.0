import { expect, type Page } from '@playwright/test';

export const TEST_CREDENTIALS = {
  email: 'test',
  password: 'test123',
};

// The cookie notice sits behind a full-screen backdrop while open, which
// blocks every other click on the page — dismiss it before anything else.
export async function dismissCookieConsent(page: Page) {
  const acceptButton = page.getByRole('button', { name: 'Přijmout' });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
    await expect(acceptButton).not.toBeVisible();
  }
}

export async function login(
  page: Page,
  { email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password, redirectTo = '/' } = {}
) {
  await page.goto('/login');
  await dismissCookieConsent(page);

  await page.getByLabel('Uživatel').fill(email);
  await page.getByLabel('Heslo', { exact: true }).fill(password);
  await page.getByRole('button', { name: /přihlásit se/i }).click();

  await page.waitForURL(redirectTo);
}
