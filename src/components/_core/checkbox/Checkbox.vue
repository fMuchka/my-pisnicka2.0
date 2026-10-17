<script setup lang="ts">
  import { Checkbox } from '@ark-ui/vue/checkbox';
  import { Check } from 'lucide-vue-next';
  import type { CheckboxVariant } from './types';

  const model = defineModel<boolean>({ default: false });

  const props = withDefaults(
    defineProps<{
      label: string;
      variant?: CheckboxVariant;
      disabled?: boolean;
      name?: string;
      value?: string;
    }>(),
    {
      variant: 'default',
      name: undefined,
      value: undefined,
    }
  );
</script>

<template>
  <Checkbox.Root
    :checked="model"
    :disabled="props.disabled"
    :name="props.name"
    :value="props.value"
    :class="['checkbox', `checkbox--${props.variant}`]"
    @checked-change="(details) => (model = details.checked === true)"
  >
    <Checkbox.Control class="checkbox-box">
      <Checkbox.Indicator class="checkbox-indicator">
        <Check aria-hidden="true" />
      </Checkbox.Indicator>
    </Checkbox.Control>
    <Checkbox.Label class="checkbox-label">{{ props.label }}</Checkbox.Label>
    <Checkbox.HiddenInput />
  </Checkbox.Root>
</template>

<style scoped>
  .checkbox {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--ink);
    cursor: pointer;
    user-select: none;
  }

  .checkbox[data-disabled] {
    cursor: not-allowed;
  }

  .checkbox-box {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 1.5px solid var(--ink-muted);
    border-radius: 5px;
    background: var(--surface);
    color: var(--on-brand);
    transition:
      background-color 150ms ease,
      border-color 150ms ease;
  }

  .checkbox-box[data-state='checked'] {
    background: var(--brand-fill);
    border-color: var(--brand-fill);
  }

  .checkbox-box[data-focus-visible] {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  .checkbox-box[data-disabled] {
    border-color: var(--border);
    background: var(--surface-secondary);
  }

  .checkbox-box[data-disabled][data-state='checked'] {
    background: var(--text-disabled);
    border-color: var(--text-disabled);
  }

  .checkbox-indicator {
    display: flex;
  }

  .checkbox-indicator svg {
    width: 13px;
    height: 13px;
    stroke-width: 3;
  }

  .checkbox-label {
    font: var(--text-body);
  }

  .checkbox-label[data-disabled] {
    color: var(--text-disabled);
  }

  /* Chip: a pill-shaped toggle for picking several tags, e.g. chord or category filters. */
  .checkbox--chip {
    gap: var(--space-sm);
    min-height: 36px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    background: var(--surface-secondary);
    transition:
      background-color 150ms ease,
      border-color 150ms ease;
  }

  .checkbox--chip[data-state='checked'] {
    border-color: color-mix(in srgb, var(--brand) 62%, var(--border));
    background: color-mix(in srgb, var(--brand) 18%, var(--surface));
  }

  .checkbox--chip .checkbox-box {
    width: 15px;
    height: 15px;
    border-radius: 4px;
  }

  .checkbox--chip .checkbox-indicator svg {
    width: 10px;
    height: 10px;
    stroke-width: 3.5;
  }

  .checkbox--chip .checkbox-label {
    font: var(--text-button-pill);
  }
</style>
