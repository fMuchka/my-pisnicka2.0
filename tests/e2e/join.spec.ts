import { test, expect } from '@playwright/test';

// Note: For a fully passing e2e, seed Firestore emulator with an active session.
// Collection: sessions { pin: string; isActive: boolean; hostId: string }

test.describe('Join by PIN', () => {
  test('shows error for invalid PIN', async ({ page }) => {
    await page.goto('/join');

    await page.getByLabel('pin číslice 1').fill('9');
    await page.getByLabel('pin číslice 2').fill('9');
    await page.getByLabel('pin číslice 3').fill('9');
    await page.getByLabel('pin číslice 4').fill('9');

    await page.getByRole('button', { name: /připojit/i }).click();

    await expect(page.getByText('Parta s tímto PINem neexistuje.')).toBeVisible();
  });

  test.skip('navigates to Session on valid PIN', async ({ page }) => {
    // Seed emulator with an active session first, e.g., pin 1234
    // Then this test should navigate to the Session view
    await page.goto('/join');

    await page.getByLabel('pin číslice 1').fill('1');
    await page.getByLabel('pin číslice 2').fill('2');
    await page.getByLabel('pin číslice 3').fill('3');
    await page.getByLabel('pin číslice 4').fill('4');

    await page.getByRole('button', { name: /připojit/i }).click();

    await expect(page).toHaveURL(/\/session$/);
  });
});
