<script setup lang="ts">
  import { Field } from '@ark-ui/vue/field';
  import { computed } from 'vue';

  // Must render inside a Field.Root: Ark links these texts to the control via aria-describedby.
  const props = defineProps<{
    helperText?: string;
    errorText?: string;
    successText?: string;
    invalid?: boolean;
    success?: boolean;
    counter?: string;
  }>();

  // Invalid wins so a field never shows red and green at once.
  const isSuccess = computed(() => props.success && !props.invalid);
  const helper = computed(() => (isSuccess.value && props.successText) || props.helperText);
  const showHelper = computed(() => helper.value && !(props.invalid && props.errorText));
</script>

<template>
  <div
    v-if="props.errorText || showHelper || props.counter"
    class="field-messages"
  >
    <Field.ErrorText
      v-if="props.errorText"
      class="field-message field-message--error"
    >
      {{ props.errorText }}
    </Field.ErrorText>
    <Field.HelperText
      v-if="showHelper"
      :class="['field-message', { 'field-message--success': isSuccess && props.successText }]"
    >
      {{ helper }}
    </Field.HelperText>
    <span
      v-if="props.counter"
      class="field-counter"
      aria-hidden="true"
    >
      {{ props.counter }}
    </span>
  </div>
</template>

<style scoped>
  .field-messages {
    display: flex;
    gap: var(--space-sm);
  }

  .field-messages:empty {
    display: none;
  }

  .field-message {
    font: var(--text-caption);
    color: var(--ink-muted);
  }

  .field-message--error {
    color: var(--danger);
  }

  .field-message--success {
    color: var(--success);
  }

  .field-counter {
    margin-left: auto;
    font: var(--text-caption);
    color: var(--ink-muted);
    font-variant-numeric: tabular-nums;
  }
</style>
