import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('Host can log in with email/password and access library', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('host@host.com');
    await page.getByLabel('Heslo').fill('secret123');
    await page.getByRole('button', { name: /login as host/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('Invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('host@host.com');
    await page.getByLabel('Heslo').fill('wrong');
    await page.getByRole('button', { name: /login as host/i }).click();
    await expect(page.getByLabel(/invalid credentials/i).first()).toBeVisible();
  });

  test('Logout button clears session and redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('host@host.com');
    await page.getByLabel('Heslo').fill('secret123');
    await page.getByRole('button', { name: /login as host/i }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('button', { name: /user options/i }).click();
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Protected route / redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });
});
