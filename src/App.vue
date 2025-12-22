<script setup lang="ts">
  import Login from './pages/Login.vue';
</script>

<template>
  <Login></Login>
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
    --text-chord: #e7e5e4;
    --accent: #ef4444;
    --accent-light: #f87171;
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
