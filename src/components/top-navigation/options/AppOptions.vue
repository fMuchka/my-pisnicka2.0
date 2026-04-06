<script setup lang="ts">
  import { Menu } from '@ark-ui/vue/menu';
  import { Moon, Settings, Sun } from 'lucide-vue-next';
  import Button, { type ButtonIcon } from '../../core/Button.vue';
  import { useTheme, type Theme } from '../../../composables/useTheme';

  type ThemeOption = {
    value: Theme;
    label: string;
    icon: ButtonIcon['component'];
  };

  const { theme, setTheme } = useTheme();

  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: 'Světlý',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Tmavý',
      icon: Moon,
    },
  ];
</script>

<template>
  <Menu.Root>
    <Menu.Trigger as-child>
      <Button
        :icon="{ component: Settings, position: 'prepend' }"
        style-variation="Text"
        aria-label="Nastavení aplikace"
      />
    </Menu.Trigger>

    <Menu.Positioner>
      <Menu.Content class="app-options-menu">
        <div class="menu-title">Motiv</div>

        <div
          class="theme-grid"
          role="group"
          aria-label="Výběr motivu"
        >
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            class="theme-card"
            :class="{ 'theme-card--active': theme === option.value }"
            @click="setTheme(option.value)"
          >
            <component
              :is="option.icon"
              :size="16"
            />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </Menu.Content>
    </Menu.Positioner>
  </Menu.Root>
</template>

<style scoped>
  .app-options-menu {
    margin-top: var(--space-xs);
    min-width: 220px;
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--text-primary) 12%, transparent);
    padding: var(--space-sm);
    z-index: 20;
  }

  .menu-title {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    margin: 0 0 var(--space-xs);
    padding: 0 var(--space-xs);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .theme-card {
    min-height: 64px;
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      background-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .theme-card:hover {
    border-color: color-mix(in srgb, var(--accent) 35%, var(--bg-tertiary));
    transform: translateY(-1px);
  }

  .theme-card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .theme-card--active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }
</style>
