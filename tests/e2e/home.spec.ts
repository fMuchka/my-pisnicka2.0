import { test, expect, type Page } from '@playwright/test';

test.describe('Home Screen - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate as test user
    await navigateToLoginAndAuthenticate(page);
  });

  test('displays home view with nav items', async ({ page }) => {
    await expect(page.getByTestId('home-view')).toBeVisible();
    await expect(page.getByRole('button', { name: /písně/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /relace/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /informace/i })).toBeVisible();
  });

  test('navigates to songs from home nav', async ({ page }) => {
    await page.getByRole('button', { name: /písně/i }).click();

    await expect(page).toHaveURL(/\/songs/);
    await expect(page.getByTestId('song-library-view')).toBeVisible();
  });

  test('navigates to sessions from home nav', async ({ page }) => {
    await page.getByRole('button', { name: /relace/i }).click();

    await expect(page).toHaveURL(/\/sessionList/);
    await expect(page.getByTestId('session-list-view')).toBeVisible();
  });

  test('keeps info navigation item non-navigating', async ({ page }) => {
    const infoButton = page.getByRole('button', { name: /informace/i });
    await infoButton.click();

    await expect(page).toHaveURL('/');
  });
});
async function navigateToLoginAndAuthenticate(page: Page) {
  await page.goto('/login');

  // Login as test user
  await page.getByLabel('Email').fill('test@test.com');
  await page.getByLabel('Heslo').fill('test123');
  await page.getByRole('button', { name: /přihlásit se/i }).click();

  // Wait for redirect to home
  await page.waitForURL('/');
}
