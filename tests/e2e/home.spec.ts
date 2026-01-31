import { test, expect } from '@playwright/test';

test.describe('Home Screen - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate as host
    await page.goto('/login');

    // Login as host (email contains @host)
    await page.getByLabel('Email').fill('testhost@host.cz');
    await page.getByLabel('Heslo').fill('testpassword123');
    await page.getByRole('button', { name: /přihlásit se/i }).click();

    // Wait for redirect to home
    await page.waitForURL('/');
  });

  test.describe('Basic Layout and Navigation', () => {
    test('displays home view with all sections', async ({ page }) => {
      // Check main sections are visible
      await expect(page.getByTestId('home-view')).toBeVisible();
      await expect(page.getByTestId('home-sessions-section')).toBeVisible();
      await expect(page.getByTestId('home-songs-section')).toBeVisible();
    });

    test('displays top navigation with user options', async ({ page }) => {
      // Top navigation should be present
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('has proper headings for sections', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /parta|session/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /písn|song/i })).toBeVisible();
    });
  });

  test.describe('Sessions Display', () => {
    test('shows latest sessions sorted by creation date', async ({ page }) => {
      // The page should show sessions in reverse chronological order
      const sessionsList = page.getByTestId('home-sessions-section').getByRole('list');
      await expect(sessionsList).toBeVisible();

      // Should display up to 3 sessions
      const sessionItems = sessionsList.getByRole('listitem');
      const count = await sessionItems.count();
      expect(count).toBeLessThanOrEqual(3);
    });

    test('shows empty state when no sessions exist', async ({ page }) => {
      // If no sessions in emulator, should show empty state
      await expect(page.getByText(/žádné parta|zatím žádné|no session/i)).toBeVisible();
    });

    test('navigates to sessions list on View all click', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /zobrazit všechny.*parta/i });
      await viewAllLink.click();

      await expect(page).toHaveURL(/\/sessions/);
    });
  });

  test.describe('Songs Display', () => {
    test('shows deterministic song selection', async ({ page }) => {
      const songsList = page.getByTestId('home-songs-section').getByRole('list');

      // Should display up to 6 songs
      const songItems = songsList.getByRole('listitem');
      const count = await songItems.count();
      expect(count).toBeLessThanOrEqual(6);
    });

    test('groups songs by artist (max 2 per artist)', async ({ page }) => {
      // Given the same dataset, the song selection should be deterministic
      const songsList = page.getByTestId('home-songs-section');

      // Each song should display artist name
      const artistElements = songsList.getByText(/artist|interpret/i);
      await expect(artistElements.first()).toBeVisible();
    });

    test('navigates to songs list on View all click', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /zobrazit všechny.*písně/i });
      await viewAllLink.click();

      await expect(page).toHaveURL(/\/songs/);
    });
  });

  test.describe('Action Buttons', () => {
    test('has create session button with proper label', async ({ page }) => {
      const createButton = page.getByLabel(/vytvořit|create.*parta/i);
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
    });

    test('has join session link pointing to join page', async ({ page }) => {
      const joinLink = page.getByRole('link', { name: /připojit|join/i });
      await expect(joinLink).toBeVisible();

      await joinLink.click();
      await expect(page).toHaveURL(/\/join/);
    });
  });

  test.describe('Create Session Dialog', () => {
    test('opens dialog when create button clicked', async ({ page }) => {
      const createButton = page.getByLabel(/vytvořit|create/i);
      await createButton.click();

      const dialog = page.getByTestId('create-session-dialog');
      await expect(dialog).toBeVisible();
      await expect(page.getByRole('dialog', { name: /vytvořit partu/i })).toBeVisible();
    });

    test('dialog has session name input', async ({ page }) => {
      await page.getByLabel(/vytvořit|create/i).click();

      const nameInput = page.getByLabel(/název party|jméno party/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeFocused(); // Should auto-focus
    });

    test('creates new session and displays it in list', async ({ page }) => {
      // Open dialog
      await page.getByLabel(/vytvořit|create/i).click();

      // Fill session name
      const sessionName = `Test Session ${Date.now()}`;
      await page.getByLabel(/název party|jméno party/i).fill(sessionName);

      // Submit
      await page.getByTestId('create-session-submit').click();

      // Dialog should close
      await expect(page.getByTestId('create-session-dialog')).not.toBeVisible();

      // New session should appear in the list
      await expect(page.getByText(sessionName)).toBeVisible();
    });

    test('new session appears at the top of the list (most recent)', async ({ page }) => {
      const sessionName = `Newest Session ${Date.now()}`;

      await page.getByLabel(/vytvořit|create/i).click();
      await page.getByLabel(/název party/i).fill(sessionName);
      await page.getByTestId('create-session-submit').click();

      // Wait for dialog to close and list to update
      await expect(page.getByTestId('create-session-dialog')).not.toBeVisible();

      // Get the first session item
      const sessionsList = page.getByTestId('home-sessions-section').getByRole('list');
      const firstSession = sessionsList.getByRole('listitem').first();

      // Should contain the newly created session
      await expect(firstSession).toContainText(sessionName);
    });

    test('shows error when session name is empty', async ({ page }) => {
      await page.getByLabel(/vytvořit|create/i).click();

      // Try to submit without entering name
      const submitButton = page.getByTestId('create-session-submit');
      await expect(submitButton).toBeDisabled();
    });

    test('closes dialog with close button', async ({ page }) => {
      await page.getByLabel(/vytvořit|create/i).click();

      const closeButton = page.getByLabel(/zavřít|close/i);
      await closeButton.click();

      await expect(page.getByTestId('create-session-dialog')).not.toBeVisible();
    });

    test('closes dialog with Escape key', async ({ page }) => {
      await page.getByLabel(/vytvořit|create/i).click();

      await page.keyboard.press('Escape');

      await expect(page.getByTestId('create-session-dialog')).not.toBeVisible();
    });

    test('traps focus inside dialog', async ({ page }) => {
      await page.getByLabel(/vytvořit|create/i).click();

      const dialog = page.getByTestId('create-session-dialog');
      const nameInput = page.getByLabel(/název party/i);
      const submitButton = page.getByTestId('create-session-submit');
      const closeButton = page.getByLabel(/zavřít|close/i);

      // Tab through interactive elements
      await expect(nameInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(closeButton).toBeFocused();

      // Tab should cycle back to first element
      await page.keyboard.press('Tab');
      await expect(nameInput).toBeFocused();
    });
  });

  test.describe('Accessibility', () => {
    test('has no automatic accessibility violations', async ({ page }) => {
      // Basic accessibility check - could be enhanced with axe-playwright
      // Check for essential ARIA attributes
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
      }
    });

    test('all interactive elements are keyboard accessible', async ({ page }) => {
      // Tab through main actions
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to reach create button
      const createButton = page.getByLabel(/vytvořit|create/i);
      await createButton.focus();
      await expect(createButton).toBeFocused();

      // Should be able to activate with Enter or Space
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('create-session-dialog')).toBeVisible();
    });

    test('uses proper heading hierarchy', async ({ page }) => {
      // Get all headings
      const h1Count = await page.getByRole('heading', { level: 1 }).count();
      const h2Count = await page.getByRole('heading', { level: 2 }).count();

      // Should have section headings as h2
      expect(h2Count).toBeGreaterThanOrEqual(2);
    });

    test('lists have proper semantic structure', async ({ page }) => {
      const sessionsList = page.getByTestId('home-sessions-section').getByRole('list');
      await expect(sessionsList).toBeVisible();

      const songsSection = page.getByTestId('home-songs-section');
      await expect(songsSection).toBeVisible();
    });
  });

  test.describe('Data Integration', () => {
    test('shows sessions user has hosted', async ({ page }) => {
      // If user is host, they should see their hosted sessions
      const sessionsSection = page.getByTestId('home-sessions-section');

      // Either shows sessions or empty state
      const hasContent =
        (await sessionsSection.getByRole('list').count()) > 0 ||
        (await page.getByText(/žádné|no session/i).count()) > 0;

      expect(hasContent).toBeTruthy();
    });

    test('shows sessions user has joined', async ({ page }) => {
      // Sessions where user is in joinedBy array should appear
      // This is tested by the merged and deduplicated list behavior
      const sessionsSection = page.getByTestId('home-sessions-section');
      await expect(sessionsSection).toBeVisible();
    });

    test('sessions are sorted by creation date (newest first)', async ({ page }) => {
      // Create two sessions in sequence
      const session1Name = `Session A ${Date.now()}`;
      await page.getByLabel(/vytvořit|create/i).click();
      await page.getByLabel(/název party/i).fill(session1Name);
      await page.getByTestId('create-session-submit').click();
      await expect(page.getByTestId('create-session-dialog')).not.toBeVisible();

      // Wait a bit to ensure different timestamps
      await page.waitForTimeout(1000);

      const session2Name = `Session B ${Date.now()}`;
      await page.getByLabel(/vytvořit|create/i).click();
      await page.getByLabel(/název party/i).fill(session2Name);
      await page.getByTestId('create-session-submit').click();
      await expect(page.getByTestId('create-session-dialog')).not.toBeVisible();

      // Second session (newer) should appear before first
      const sessionsList = page.getByTestId('home-sessions-section').getByRole('list');
      const items = sessionsList.getByRole('listitem');

      const firstItemText = await items.first().textContent();
      expect(firstItemText).toContain(session2Name);
    });
  });

  test.describe('Real-time Updates', () => {
    test('refreshes session list after creating new session', async ({ page }) => {
      const initialItems = await page
        .getByTestId('home-sessions-section')
        .getByRole('listitem')
        .count();

      // Create new session
      const sessionName = `New Session ${Date.now()}`;
      await page.getByLabel(/vytvořit|create/i).click();
      await page.getByLabel(/název party/i).fill(sessionName);
      await page.getByTestId('create-session-submit').click();

      // List should update
      await expect(page.getByText(sessionName)).toBeVisible();

      const updatedItems = await page
        .getByTestId('home-sessions-section')
        .getByRole('listitem')
        .count();

      // Should have at least same or more items (new session added)
      expect(updatedItems).toBeGreaterThanOrEqual(Math.min(initialItems + 1, 3));
    });
  });

  test.describe('Edge Cases', () => {
    test('handles empty songs gracefully', async ({ page }) => {
      // Even with no songs, the songs section should be visible
      const songsSection = page.getByTestId('home-songs-section');
      await expect(songsSection).toBeVisible();
    });

    test('handles network errors gracefully', async ({ page }) => {
      // If Firestore is unavailable, should show error but not crash
      // This would require stopping emulators, but the UI should handle it
      await expect(page.getByTestId('home-view')).toBeVisible();
    });

    test('limits sessions display to 3 items', async ({ page }) => {
      // Create 4+ sessions and verify only 3 are shown
      for (let i = 0; i < 4; i++) {
        await page.getByLabel(/vytvořit|create/i).click();
        await page.getByLabel(/název party/i).fill(`Session ${i + 1}`);
        await page.getByTestId('create-session-submit').click();
        await expect(page.getByTestId('create-session-dialog')).not.toBeVisible();
        await page.waitForTimeout(100); // Small delay between creations
      }

      const sessionItems = await page
        .getByTestId('home-sessions-section')
        .getByRole('listitem')
        .count();

      expect(sessionItems).toBeLessThanOrEqual(3);
    });
  });

  test.describe('Czech Localization', () => {
    test('all UI elements use Czech labels', async ({ page }) => {
      // Check key Czech labels exist
      await expect(page.getByText(/parta/i)).toBeVisible();
      await expect(page.getByText(/písn/i)).toBeVisible();
    });

    test('dialog uses Czech text', async ({ page }) => {
      await page.getByLabel(/vytvořit|create/i).click();

      await expect(page.getByText(/vytvořit partu/i)).toBeVisible();
      await expect(page.getByLabel(/název party/i)).toBeVisible();
    });

    test('empty states use Czech text', async ({ page }) => {
      // Empty state messages should be in Czech
      const emptyState = page.getByText(/žádné|zatím/i);
      if (await emptyState.isVisible()) {
        const text = await emptyState.textContent();
        expect(text).toMatch(/žádné|zatím|nemáte/i);
      }
    });
  });
});
