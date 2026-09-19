import { test, expect, type Page } from '@playwright/test';

// Renders each story in isolation, the same way Storybook's own tooling does,
// so real computed styles and real pointer/keyboard interactions are
// exercised against the actual @ark-ui/vue drawer machine — not a mock.
const storyUrl = (id: string) => `/iframe.html?id=core-drawer--${id}&viewMode=story`;

async function openDrawer(page: Page, storyId = 'default') {
  await page.goto(storyUrl(storyId));
  const content = page.getByTestId('drawer-content');
  await expect(content).not.toBeVisible();

  await page.getByRole('button', { name: 'Otevřít filtry' }).click();
  await expect(content).toBeVisible();

  return content;
}

async function dragDownPastThreshold(page: Page, content: ReturnType<Page['getByTestId']>) {
  const box = await content.boundingBox();
  if (!box) throw new Error('drawer content has no bounding box');

  const x = box.x + box.width / 2;
  const startY = box.y + 20;

  await page.mouse.move(x, startY);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(x, startY + i * 40, { steps: 2 });
  }
  await page.mouse.up();
}

test.describe('Drawer styling and behavior', () => {
  test('is closed by default and opens on trigger click with the expected sheet chrome', async ({
    page,
  }) => {
    const content = await openDrawer(page);

    const styles = await content.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        borderTopLeftRadius: parseFloat(computed.borderTopLeftRadius),
        boxShadow: computed.boxShadow,
        backgroundColor: computed.backgroundColor,
      };
    });
    expect(styles.borderTopLeftRadius).toBeGreaterThan(0);
    expect(styles.boxShadow).not.toBe('none');
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('closes when the close button is clicked', async ({ page }) => {
    const content = await openDrawer(page);

    await page.getByRole('button', { name: 'Zavřít' }).click();
    await expect(content).not.toBeVisible();
  });

  test('closes on Escape and on outside click by default', async ({ page }) => {
    const content = await openDrawer(page);

    await page.keyboard.press('Escape');
    await expect(content).not.toBeVisible();

    await page.getByRole('button', { name: 'Otevřít filtry' }).click();
    await expect(content).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(content).not.toBeVisible();
  });

  test('closes when dragged past the dismiss threshold', async ({ page }) => {
    const content = await openDrawer(page);

    await dragDownPastThreshold(page, content);

    await expect(content).not.toBeVisible();
  });

  test('keepOpen blocks Escape, outside click and dragging — only the confirm action closes it', async ({
    page,
  }) => {
    const content = await openDrawer(page, 'keep-open');

    await expect(page.getByRole('button', { name: 'Zavřít' })).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(content).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(content).toBeVisible();

    await dragDownPastThreshold(page, content);
    await expect(content).toBeVisible();

    await page.getByRole('button', { name: 'Potvrdit' }).click();
    await expect(content).not.toBeVisible();
  });
});
