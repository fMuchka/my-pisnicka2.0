<script setup lang="ts">
  import { useTheme } from './composables/useTheme';

  // Ensure persisted theme is applied before page-specific components render.
  useTheme();
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>

<style>
  :root {
    /* Light Theme Colors */
    --bg-primary: #fafaf9;
    --bg-secondary: #f5f5f4;
    --bg-tertiary: #e7e5e4;
    --text-primary: #1c1917;
    --text-secondary: #57534e;
    --text-disabled: #a8a29e;
    --text-chord: #292524;
    --accent: #dc2626;
    --accent-light: #ef4444;
    --color-primary: var(--accent);
    --color-error: #dc2626;
    --color-error-light: color-mix(in srgb, var(--color-error) 16%, var(--bg-primary));
    --color-error-dark: #7f1d1d;
    --color-text-muted: var(--text-secondary);
    --border-primary: var(--bg-tertiary);
    --overlay-backdrop: rgba(0, 0, 0, 0.5);
    --shadow-soft: 0 2px 8px color-mix(in srgb, var(--text-primary) 16%, transparent);
    --shadow-dialog: 0 4px 24px color-mix(in srgb, var(--text-primary) 20%, transparent);
    --shadow-panel: 0 18px 50px color-mix(in srgb, var(--text-primary) 8%, transparent);
    --shadow-accent: 0 4px 12px color-mix(in srgb, var(--accent) 20%, transparent);
    --focus-ring-soft: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
    --surface-qr: #ffffff;
    --text-qr: #111111;
    --section-verse-bg: #e7ece3;
    --section-verse-border: #8ea27f;
    --section-chorus-bg: #f1e6d6;
    --section-chorus-border: #c19b6c;
    --section-bridge-bg: #efe1d7;
    --section-bridge-border: #b77a64;
    --section-intro-bg: #e3e8ee;
    --section-intro-border: #7c8ea6;
    --section-outro-bg: #f1dfe2;
    --section-outro-border: #b36b72;

    /* Typography */
    --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    --font-chord: 'JetBrains Mono', 'Fira Code', monospace;
    --font-size-lyrics: 18px;
    --font-size-chords: 16px;

    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    --space-3xl: 64px;

    /* Border Radius */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;

    /* Transitions */
    --transition-fast: 150ms ease-out;
    --transition-normal: 200ms ease-out;
    --transition-slow: 300ms ease-out;
  }

  [data-theme='dark'] {
    --bg-primary: #1c1917;
    --bg-secondary: #292524;
    --bg-tertiary: #44403c;
    --text-primary: #fafaf9;
    --text-secondary: #a8a29e;
    --text-disabled: #78716c;
    --text-chord: #e7e5e4;
    --accent: #ef4444;
    --accent-light: #f87171;
    --color-primary: var(--accent);
    --color-error: #f87171;
    --color-error-light: color-mix(in srgb, var(--color-error) 16%, var(--bg-primary));
    --color-error-dark: #fecaca;
    --color-text-muted: var(--text-secondary);
    --border-primary: var(--bg-tertiary);
    --overlay-backdrop: rgba(0, 0, 0, 0.5);
    --shadow-soft: 0 2px 8px color-mix(in srgb, var(--text-primary) 20%, transparent);
    --shadow-dialog: 0 4px 24px color-mix(in srgb, var(--text-primary) 24%, transparent);
    --shadow-panel: 0 18px 50px color-mix(in srgb, var(--text-primary) 14%, transparent);
    --shadow-accent: 0 4px 12px color-mix(in srgb, var(--accent) 26%, transparent);
    --focus-ring-soft: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
    --surface-qr: var(--bg-primary);
    --text-qr: var(--text-primary);
    --section-verse-bg: #2b312a;
    --section-verse-border: #7c8f6f;
    --section-chorus-bg: #3a3328;
    --section-chorus-border: #b58a56;
    --section-bridge-bg: #3b2f2a;
    --section-bridge-border: #a96f5b;
    --section-intro-bg: #2c3138;
    --section-intro-border: #6f829b;
    --section-outro-bg: #3a2c2f;
    --section-outro-border: #a36067;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html,
  body {
    height: 100%;
    width: 100%;
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.5;
    transition:
      background-color var(--transition-slow),
      color var(--transition-slow);
  }
</style>
