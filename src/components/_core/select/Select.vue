<script setup lang="ts">
  import { Field } from '@ark-ui/vue/field';
  import { ChevronDown } from 'lucide-vue-next';
  import FieldMessages from '../field/FieldMessages.vue';
  import type { SelectOption } from './types';

  // Attributes like name or aria-label belong on the <select>, not the wrapper.
  defineOptions({ inheritAttrs: false });

  const model = defineModel<string>({ default: '' });

  const props = withDefaults(
    defineProps<{
      options: SelectOption[];
      label?: string;
      placeholder?: string;
      helperText?: string;
      errorText?: string;
      invalid?: boolean;
      disabled?: boolean;
      required?: boolean;
    }>(),
    {
      label: undefined,
      placeholder: undefined,
      helperText: undefined,
      errorText: undefined,
    }
  );
</script>

<template>
  <Field.Root
    class="field"
    :invalid="props.invalid"
    :disabled="props.disabled"
    :required="props.required"
  >
    <Field.Label
      v-if="props.label"
      class="field-label"
    >
      {{ props.label }}
      <Field.RequiredIndicator class="field-required">*</Field.RequiredIndicator>
    </Field.Label>

    <div class="field-control">
      <!-- Native <select> on purpose: phones open their own picker, which beats any custom dropdown. -->
      <Field.Select
        v-bind="$attrs"
        v-model="model"
        :class="['field-input', 'select', { 'select--placeholder': model === '' }]"
      >
        <option
          v-if="props.placeholder"
          value=""
          disabled
        >
          {{ props.placeholder }}
        </option>
        <option
          v-for="option in props.options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </Field.Select>
      <ChevronDown
        class="select-chevron"
        aria-hidden="true"
      />
    </div>

    <FieldMessages
      :helper-text="props.helperText"
      :error-text="props.errorText"
      :invalid="props.invalid"
    />
  </Field.Root>
</template>

<style scoped src="../field/field.css"></style>

<style scoped>
  .select {
    appearance: none;
    padding-right: 40px;
    cursor: pointer;
  }

  .select--placeholder {
    color: var(--ink-muted);
  }

  .select-chevron {
    position: absolute;
    right: 14px;
    width: 16px;
    height: 16px;
    color: var(--ink-muted);
    pointer-events: none;
  }

  .select:disabled + .select-chevron {
    color: var(--text-disabled);
  }
</style>
