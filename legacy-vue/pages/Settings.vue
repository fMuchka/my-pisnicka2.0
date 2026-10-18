<script setup lang="ts">
  import { Check, ChevronLeft } from 'lucide-vue-next';
  import { computed } from 'vue';
  import { RouterLink } from 'vue-router';
  import { useAuth } from '../composables/useAuth';
  import { usePageNavigation } from '../composables/usePageNavigation';
  import { useTheme, type ColorPreset, type Theme } from '../composables/useTheme';
  import { useSessionStore } from '../stores/session';

  type ThemeOption = {
    value: Theme;
    label: string;
    description: string;
  };

  type PresetOption = {
    value: ColorPreset;
    label: string;
  };

  usePageNavigation({ pageTitle: 'Nastavení' });

  const { theme, setTheme, colorPreset, setColorPreset } = useTheme();
  const { isGuest } = useAuth();
  const sessionStore = useSessionStore();

  // Guests have no tab bar or menu links, so give them a way back to their session.
  const sessionLink = computed(() => (isGuest.value ? sessionStore.activeSessionRoute : null));

  const themeOptions: ThemeOption[] = [
    { value: 'dark', label: 'Tmavý', description: 'Pro hraní za tmy' },
    { value: 'light', label: 'Světlý', description: 'Pro denní hraní' },
  ];

  const presetOptions: PresetOption[] = [
    { value: 'red', label: 'Klasika' },
    { value: 'orange', label: 'Slunečnice' },
    { value: 'green', label: 'Les' },
    { value: 'teal', label: 'Oceán' },
    { value: 'blue', label: 'Nebe' },
    { value: 'purple', label: 'Levandule' },
  ];
</script>

<template>
  <section class="container">
    <RouterLink
      v-if="sessionLink"
      :to="sessionLink"
      class="back-link"
    >
      <ChevronLeft
        class="back-icon"
        aria-hidden="true"
      />
      Zpět do relace
    </RouterLink>

    <p class="intro">Motiv a barva se dají kombinovat libovolně — 2 motivy × 6 barev.</p>

    <section
      class="section"
      aria-labelledby="settings-theme"
    >
      <div class="eyebrow">
        <span class="dot" />
        <h2 id="settings-theme">Motiv</h2>
      </div>
      <div class="theme-grid">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          :class="['theme-card', { 'theme-card--active': theme === option.value }]"
          :aria-pressed="theme === option.value"
          @click="setTheme(option.value)"
        >
          <span :class="['theme-sample', `theme-sample--${option.value}`]" />
          <span class="theme-label">{{ option.label }}</span>
          <span class="theme-description">{{ option.description }}</span>
        </button>
      </div>
    </section>

    <section
      class="section"
      aria-labelledby="settings-color"
    >
      <div class="eyebrow">
        <span class="dot" />
        <h2 id="settings-color">Barva</h2>
      </div>
      <div class="swatch-grid">
        <button
          v-for="option in presetOptions"
          :key="option.value"
          type="button"
          :class="['swatch', { 'swatch--active': colorPreset === option.value }]"
          :style="{ '--swatch': `var(--preset-${option.value}-vivid)` }"
          :aria-pressed="colorPreset === option.value"
          @click="setColorPreset(option.value)"
        >
          <span class="swatch-circle">
            <Check
              v-if="colorPreset === option.value"
              class="swatch-check"
              aria-hidden="true"
            />
          </span>
          <span class="swatch-label">{{ option.label }}</span>
        </button>
      </div>
    </section>

    <section
      class="section"
      aria-labelledby="settings-preview"
    >
      <div class="eyebrow">
        <span class="dot" />
        <h2 id="settings-preview">Náhled</h2>
      </div>
      <div class="preview-placeholder">Náhled bude brzy</div>
    </section>
  </section>
</template>

<style scoped>
  .container {
    max-width: 760px;
    margin: 0 auto;
    width: 100%;
    padding: var(--space-xl) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .back-link {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: 44px;
    margin: calc(-1 * var(--space-sm)) 0;
    color: var(--ink-muted);
    font: var(--text-label);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .back-link:hover {
    color: var(--ink);
  }

  .back-link:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
    border-radius: var(--radius-md);
  }

  .back-icon {
    width: 20px;
    height: 20px;
  }

  .intro {
    font: var(--text-caption);
    color: var(--ink-muted);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .eyebrow h2 {
    font: var(--text-eyebrow);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  .dot {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
    background: var(--brand);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 14px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface-secondary);
    color: var(--ink);
    font-family: var(--font-sans);
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      background-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .theme-card--active {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand) 16%, var(--surface));
  }

  .theme-card:active,
  .swatch:active {
    transform: scale(0.97);
  }

  .theme-card:focus-visible,
  .swatch:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  /* Samples depict the other theme too, so they can't use the current theme's tokens. */
  .theme-sample {
    width: 100%;
    height: 40px;
    margin-bottom: 10px;
    border-radius: var(--radius-md);
  }

  .theme-sample--dark {
    background: #1c1917;
    border: 1px solid #363230;
  }

  .theme-sample--light {
    background: #fafaf9;
    border: 1px solid #e7e5e4;
  }

  .theme-label {
    font: var(--text-item-title-compact);
  }

  .theme-description {
    font: var(--text-item-meta-compact);
    font-weight: 400;
    color: var(--ink-muted);
  }

  .swatch-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .swatch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    border: none;
    background: none;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: transform var(--transition-fast);
  }

  .swatch-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    background: var(--swatch);
  }

  .swatch--active .swatch-circle {
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 4px var(--swatch);
  }

  .swatch-check {
    width: 18px;
    height: 18px;
    color: #ffffff;
    stroke-width: 2.6;
  }

  .swatch-label {
    font-size: 11.5px;
    color: var(--ink-muted);
  }

  .swatch--active .swatch-label {
    color: var(--brand);
    font-weight: 600;
  }

  .preview-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-xl);
    background: var(--surface-secondary);
    color: var(--ink-muted);
    font: var(--text-caption);
  }

  @media (max-width: 720px) {
    .container {
      padding: 20px 20px 24px;
    }
  }
</style>
