<script setup lang="ts">
  import { RadioGroup } from '@ark-ui/vue/radio-group';
  import type { RadioOption } from './types';

  const model = defineModel<string>({ default: '' });

  const props = withDefaults(
    defineProps<{
      options: RadioOption[];
      label?: string;
      disabled?: boolean;
      name?: string;
    }>(),
    {
      label: undefined,
      name: undefined,
    }
  );
</script>

<template>
  <RadioGroup.Root
    :model-value="model"
    :disabled="props.disabled"
    :name="props.name"
    class="radio-group"
    @update:model-value="(value) => (model = value ?? '')"
  >
    <RadioGroup.Label
      v-if="props.label"
      class="radio-group-label"
    >
      {{ props.label }}
    </RadioGroup.Label>

    <RadioGroup.Item
      v-for="option in props.options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
      class="radio"
    >
      <RadioGroup.ItemControl class="radio-control" />
      <RadioGroup.ItemText class="radio-text">{{ option.label }}</RadioGroup.ItemText>
      <RadioGroup.ItemHiddenInput />
    </RadioGroup.Item>
  </RadioGroup.Root>
</template>

<style scoped>
  .radio-group {
    display: flex;
    flex-direction: column;
  }

  .radio-group-label {
    margin-bottom: var(--space-xs);
    font: var(--text-label);
    color: var(--ink);
  }

  .radio {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--ink);
    cursor: pointer;
    user-select: none;
  }

  .radio[data-disabled] {
    cursor: not-allowed;
  }

  .radio-control {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 1.5px solid var(--ink-muted);
    border-radius: var(--radius-full);
    background: var(--surface);
    transition: border-color 150ms ease;
  }

  .radio-control::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    background: var(--brand);
    transform: scale(0);
    transition: transform 150ms ease;
  }

  .radio-control[data-state='checked'] {
    border-color: var(--brand);
  }

  .radio-control[data-state='checked']::after {
    transform: scale(1);
  }

  .radio-control[data-focus-visible] {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  .radio-control[data-disabled] {
    border-color: var(--border);
    background: var(--surface-secondary);
  }

  .radio-control[data-disabled]::after {
    background: var(--text-disabled);
  }

  .radio-text {
    font: var(--text-body);
  }

  .radio-text[data-disabled] {
    color: var(--text-disabled);
  }
</style>
