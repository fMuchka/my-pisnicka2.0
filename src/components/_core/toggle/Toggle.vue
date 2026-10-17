<script setup lang="ts">
  import { Switch } from '@ark-ui/vue/switch';

  const model = defineModel<boolean>({ default: false });

  const props = withDefaults(
    defineProps<{
      label: string;
      description?: string;
      disabled?: boolean;
      name?: string;
    }>(),
    {
      description: undefined,
      name: undefined,
    }
  );
</script>

<template>
  <Switch.Root
    :checked="model"
    :disabled="props.disabled"
    :name="props.name"
    class="toggle"
    @checked-change="(details) => (model = details.checked)"
  >
    <Switch.Label class="toggle-text">
      <span class="toggle-label">{{ props.label }}</span>
      <span
        v-if="props.description"
        class="toggle-description"
      >
        {{ props.description }}
      </span>
    </Switch.Label>
    <Switch.Control class="toggle-track">
      <Switch.Thumb class="toggle-thumb" />
    </Switch.Control>
    <!-- Ark exposes a plain checkbox; "switch" makes screen readers announce on/off. -->
    <Switch.HiddenInput role="switch" />
  </Switch.Root>
</template>

<style scoped>
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    min-height: 44px;
    color: var(--ink);
    cursor: pointer;
    user-select: none;
  }

  .toggle[data-disabled] {
    cursor: not-allowed;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toggle-label {
    font: var(--text-body);
  }

  .toggle-description {
    font: var(--text-caption);
    color: var(--ink-muted);
  }

  .toggle-text[data-disabled] .toggle-label {
    color: var(--text-disabled);
  }

  .toggle-track {
    position: relative;
    flex: none;
    width: 44px;
    height: 26px;
    border-radius: var(--radius-full);
    /* --border alone is too faint for a control in light theme; mixing ink keeps 3:1 in both. */
    background: color-mix(in srgb, var(--ink) 30%, var(--surface));
    transition: background-color 150ms ease;
  }

  .toggle-track[data-state='checked'] {
    background: var(--brand-fill);
  }

  .toggle-track[data-focus-visible] {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  .toggle-track[data-disabled] {
    opacity: 0.5;
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: var(--radius-full);
    background: var(--on-brand);
    box-shadow: var(--shadow-soft);
    transition: transform 150ms ease;
  }

  .toggle-thumb[data-state='checked'] {
    transform: translateX(18px);
  }
</style>
