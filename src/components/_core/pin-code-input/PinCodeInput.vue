<script setup lang="ts">
  import { PinInput } from '@ark-ui/vue';
  import { useId } from 'vue';
  import { normalizePin, type PIN } from '../../../lib/pin';

  withDefaults(
    defineProps<{
      modelValue: PIN;
      readOnly?: boolean;
      title?: string;
      description?: string;
      showLabel?: boolean;
      ariaLabelPrefix?: string;
    }>(),
    {
      readOnly: false,
      title: 'Zadej 4-místný PIN',
      description: 'Pomocí PINu tě spojíme s otevřenou partou.',
      showLabel: true,
      ariaLabelPrefix: 'pin číslice',
    }
  );

  const emit = defineEmits<{
    (event: 'update:modelValue', value: PIN): void;
  }>();

  // Ark's default root id contains ":", which jsdom's selector engine fails to match once
  // escaped, so typing in tests crashes inside Ark.
  const ids = { root: `pin-input-${useId()}` };

  const handleValueChange = (details: { value: readonly string[] }) => {
    emit('update:modelValue', normalizePin(details.value));
  };
</script>

<template>
  <PinInput.Root
    :ids="ids"
    :model-value="modelValue"
    class="pin-container"
    type="numeric"
    :read-only="readOnly"
    @value-change="handleValueChange"
  >
    <PinInput.Label
      v-if="showLabel"
      class="pin-label"
    >
      <span class="pin-title">{{ title }}</span>
      <span class="pin-description">{{ description }}</span>
    </PinInput.Label>

    <PinInput.Control class="pin-control">
      <PinInput.Input
        v-for="(_, i) in modelValue"
        :key="i"
        class="pin-input"
        :index="i"
        placeholder=""
        :aria-label="`${ariaLabelPrefix} ${i + 1}`"
      />
    </PinInput.Control>

    <PinInput.HiddenInput />
  </PinInput.Root>
</template>

<style scoped>
  .pin-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    margin-bottom: var(--space-lg);
    font-family: var(--font-sans);
  }

  .pin-label {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    text-align: center;
  }

  .pin-title {
    font: var(--text-title-compact);
    color: var(--ink);
  }

  .pin-description {
    font: var(--text-label);
    color: var(--ink-muted);
  }

  .pin-control {
    display: grid;
    grid-template-columns: repeat(4, 56px);
    gap: var(--space-md);
  }

  .pin-input {
    box-sizing: border-box;
    width: 100%;
    height: 56px;
    padding: 0;
    font: 600 22px/1 var(--font-sans);
    text-align: center;
    color: var(--ink);
    background-color: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .pin-input:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: var(--focus-ring-soft);
  }

  /* Read-only PINs are only shown to be read aloud, so focus shouldn't look editable. */
  .pin-input[readonly] {
    background-color: var(--surface-secondary);
    cursor: default;
  }

  .pin-input[readonly]:focus {
    border-color: var(--border);
    box-shadow: none;
  }
</style>
