import { test, expect, type Locator } from '@playwright/test';

// Renders each story in isolation, the same way Storybook's own tooling does,
// so a broken CSS custom property (e.g. a var() pointing at a token that no
// longer exists) shows up as a real computed-style failure instead of
// silently collapsing the button to invisible/bare text.
const storyUrl = (id: string) => `/iframe.html?id=core-styled-button--${id}&viewMode=story`;

async function getButtonStyles(button: Locator) {
  return button.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor,
      borderStyle: computed.borderStyle,
      borderWidth: parseFloat(computed.borderWidth),
      paddingLeft: parseFloat(computed.paddingLeft),
    };
  });
}

test.describe('Button styling', () => {
  test('primary filled button has a solid brand background and white text', async ({ page }) => {
    await page.goto(storyUrl('primary'));
    const button = page.getByRole('button', { name: 'Uložit' });
    await expect(button).toBeVisible();

    const styles = await getButtonStyles(button);
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.color).toBe('rgb(255, 255, 255)');
    expect(styles.borderStyle).toBe('solid');
    expect(styles.borderWidth).toBeGreaterThan(0);
  });

  test('secondary button has a visible fill and border, not bare text', async ({ page }) => {
    await page.goto(storyUrl('secondary'));
    const button = page.getByRole('button', { name: 'Uložit' });
    await expect(button).toBeVisible();

    const styles = await getButtonStyles(button);
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.borderStyle).toBe('solid');
    expect(styles.borderWidth).toBeGreaterThan(0);
    expect(styles.paddingLeft).toBeGreaterThan(0);
  });

  test('outlined button has a colored border matching its text, not default black', async ({
    page,
  }) => {
    await page.goto(storyUrl('outlined'));
    const button = page.getByRole('button', { name: 'Uložit' });
    await expect(button).toBeVisible();

    const styles = await getButtonStyles(button);
    expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(styles.borderStyle).toBe('solid');
    expect(styles.borderWidth).toBeGreaterThanOrEqual(2);
    expect(styles.color).not.toBe('rgb(0, 0, 0)');
    expect(styles.color).toBe(styles.borderColor);
  });

  test('text (ghost) button has no chrome but a colored, non-default label', async ({ page }) => {
    await page.goto(storyUrl('text'));
    const button = page.getByRole('button', { name: 'Uložit' });
    await expect(button).toBeVisible();

    const styles = await getButtonStyles(button);
    expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(styles.color).not.toBe('rgb(0, 0, 0)');
    expect(styles.paddingLeft).toBeLessThan(24);
  });
});
