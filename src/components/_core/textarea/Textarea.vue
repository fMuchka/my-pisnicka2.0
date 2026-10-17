<script setup lang="ts">
  import { Field } from '@ark-ui/vue/field';
  import { computed } from 'vue';
  import FieldMessages from '../field/FieldMessages.vue';

  // Attributes like name or aria-label belong on the <textarea>, not the wrapper.
  defineOptions({ inheritAttrs: false });

  const model = defineModel<string>({ default: '' });

  const props = withDefaults(
    defineProps<{
      label?: string;
      placeholder?: string;
      helperText?: string;
      errorText?: string;
      invalid?: boolean;
      disabled?: boolean;
      readOnly?: boolean;
      required?: boolean;
      rows?: number;
      maxLength?: number;
    }>(),
    {
      label: undefined,
      placeholder: undefined,
      helperText: undefined,
      errorText: undefined,
      rows: 3,
      maxLength: undefined,
    }
  );

  const counter = computed(() =>
    props.maxLength == null ? undefined : `${model.value.length} / ${props.maxLength}`
  );
</script>

<template>
  <Field.Root
    class="field"
    :invalid="props.invalid"
    :disabled="props.disabled"
    :read-only="props.readOnly"
    :required="props.required"
  >
    <Field.Label
      v-if="props.label"
      class="field-label"
    >
      {{ props.label }}
      <Field.RequiredIndicator class="field-required">*</Field.RequiredIndicator>
    </Field.Label>

    <Field.Textarea
      v-bind="$attrs"
      v-model="model"
      class="field-input textarea"
      :placeholder="props.placeholder"
      :rows="props.rows"
      :maxlength="props.maxLength"
    />

    <FieldMessages
      :helper-text="props.helperText"
      :error-text="props.errorText"
      :invalid="props.invalid"
      :counter="counter"
    />
  </Field.Root>
</template>

<style scoped src="../field/field.css"></style>

<style scoped>
  .textarea {
    min-height: 88px;
    line-height: 22px;
    resize: vertical;
  }
</style>
