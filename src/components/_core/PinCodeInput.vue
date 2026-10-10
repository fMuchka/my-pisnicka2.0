<script setup lang="ts">
  import { PinInput } from '@ark-ui/vue';
  import { normalizePin, type PIN } from '../../lib/pin';

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
      title: 'Zadej 4-místní PIN',
      description: 'Pomocí PINu tě spojíme s otevřenou partou.',
      showLabel: true,
      ariaLabelPrefix: 'pin cislice',
    }
  );

  const emit = defineEmits<{
    (event: 'update:modelValue', value: PIN): void;
  }>();

  const handleValueChange = (details: { value: readonly string[] }) => {
    emit('update:modelValue', normalizePin(details.value));
  };
</script>

<template>
  <PinInput.Root
    :model-value="modelValue"
    class="pin-container"
    type="numeric"
    :read-only="readOnly"
    @value-change="handleValueChange"
  >
    <PinInput.Label
      v-if="showLabel"
      class="pin-description"
    >
      <p class="sub-title">{{ title }}</p>
      {{ description }}
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
    margin-bottom: var(--space-lg);
  }

  .pin-description {
    display: flex;
    flex-direction: column;
    text-align: center;
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--space-lg);

    > .sub-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: var(--space-xs);
      color: var(--text-primary);
    }
  }

  .pin-control {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-md);
  }

  .pin-input {
    width: 100%;
    padding: 12px 0;
    font-size: 22px;
    text-align: center;
    font-weight: 600;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .pin-input:focus {
    outline: none;
    border: 2px solid var(--accent);
    padding: 11px 0;
    box-shadow: var(--focus-ring-soft);
  }
</style>
