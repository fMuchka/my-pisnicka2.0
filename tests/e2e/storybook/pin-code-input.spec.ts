import { test, expect } from '@playwright/test';

// Ark rejects non-digits in a `beforeinput` handler, which React only wires up through real
// browser text input events; jsdom never fires them, so this lives here instead of a unit test.
const storyUrl = (id: string) => `/iframe.html?id=core-pincodeinput--${id}&viewMode=story`;

test.describe('PinCodeInput', () => {
  test('accepts digits and ignores letters', async ({ page }) => {
    await page.goto(storyUrl('default'));
    const first = page.getByRole('textbox', { name: 'pin číslice 1' });

    await first.click();
    await page.keyboard.type('a');
    await expect(first).toHaveValue('');

    await page.keyboard.type('12');
    await expect(first).toHaveValue('1');
    await expect(page.getByRole('textbox', { name: 'pin číslice 2' })).toHaveValue('2');
  });
});
