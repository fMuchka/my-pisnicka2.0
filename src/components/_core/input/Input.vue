<script setup lang="ts">
  import { Field } from '@ark-ui/vue/field';
  import { Eye, EyeOff } from 'lucide-vue-next';
  import { computed, ref } from 'vue';
  import type { InputIcon, InputType } from './types';

  // Attributes like name, autocomplete or aria-label belong on the <input>, not the wrapper.
  defineOptions({ inheritAttrs: false });

  const model = defineModel<string>({ default: '' });

  const props = withDefaults(
    defineProps<{
      label?: string;
      type?: InputType;
      placeholder?: string;
      helperText?: string;
      errorText?: string;
      successText?: string;
      invalid?: boolean;
      success?: boolean;
      disabled?: boolean;
      readOnly?: boolean;
      required?: boolean;
      prependIcon?: InputIcon;
    }>(),
    {
      label: undefined,
      type: 'text',
      placeholder: undefined,
      helperText: undefined,
      errorText: undefined,
      successText: undefined,
      prependIcon: undefined,
    }
  );

  const isPasswordVisible = ref(false);

  const isPassword = computed(() => props.type === 'password');
  const inputType = computed(() =>
    isPassword.value && isPasswordVisible.value ? 'text' : props.type
  );
  // Invalid wins so a field never shows red and green at once.
  const isSuccess = computed(() => props.success && !props.invalid);
  const helper = computed(() => (isSuccess.value && props.successText) || props.helperText);
</script>

<template>
  <Field.Root
    class="input-field"
    :invalid="props.invalid"
    :disabled="props.disabled"
    :read-only="props.readOnly"
    :required="props.required"
  >
    <Field.Label
      v-if="props.label"
      class="input-label"
    >
      {{ props.label }}
      <Field.RequiredIndicator class="input-required">*</Field.RequiredIndicator>
    </Field.Label>

    <div class="input-control">
      <component
        :is="props.prependIcon"
        v-if="props.prependIcon"
        class="input-prepend-icon"
        aria-hidden="true"
      />
      <Field.Input
        v-bind="$attrs"
        v-model="model"
        :type="inputType"
        :placeholder="props.placeholder"
        :class="[
          'input',
          {
            'input--success': isSuccess,
            'input--with-prepend': props.prependIcon,
            'input--with-append': isPassword,
          },
        ]"
      />
      <button
        v-if="isPassword"
        type="button"
        class="input-visibility"
        :aria-label="isPasswordVisible ? 'Skrýt heslo' : 'Zobrazit heslo'"
        :aria-pressed="isPasswordVisible"
        :disabled="props.disabled"
        @click="isPasswordVisible = !isPasswordVisible"
      >
        <EyeOff
          v-if="isPasswordVisible"
          aria-hidden="true"
        />
        <Eye
          v-else
          aria-hidden="true"
        />
      </button>
    </div>

    <Field.ErrorText
      v-if="props.errorText"
      class="input-message input-message--error"
    >
      {{ props.errorText }}
    </Field.ErrorText>
    <Field.HelperText
      v-if="helper && !(props.invalid && props.errorText)"
      :class="['input-message', { 'input-message--success': isSuccess && props.successText }]"
    >
      {{ helper }}
    </Field.HelperText>
  </Field.Root>
</template>

<style scoped>
  .input-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  .input-label {
    font: var(--text-label);
    color: var(--ink);
  }

  .input-required {
    color: var(--danger);
    margin-left: 2px;
  }

  .input-control {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input {
    box-sizing: border-box;
    width: 100%;
    min-height: 48px;
    padding: 12px 16px;
    font: var(--text-body);
    color: var(--ink);
    background-color: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    transition: border-color 150ms ease;
  }

  .input::placeholder {
    color: var(--ink-muted);
  }

  .input:focus {
    outline: none;
    border-color: var(--brand);
  }

  .input--success {
    border-color: var(--success);
  }

  .input[data-invalid] {
    border-color: var(--danger);
  }

  .input:disabled {
    border-color: var(--border-soft);
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  .input:disabled::placeholder {
    color: var(--text-disabled);
  }

  .input--with-prepend {
    padding-left: 40px;
  }

  .input--with-append {
    padding-right: 48px;
  }

  /* Native search clear buttons clash with our own styling and differ per browser. */
  .input[type='search']::-webkit-search-cancel-button,
  .input[type='search']::-webkit-search-decoration {
    appearance: none;
  }

  .input-prepend-icon {
    position: absolute;
    left: 12px;
    width: 18px;
    height: 18px;
    color: var(--ink-muted);
    pointer-events: none;
  }

  .input-visibility {
    position: absolute;
    right: 4px;
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--ink-muted);
    cursor: pointer;
  }

  .input-visibility:hover,
  .input-visibility:focus-visible {
    color: var(--ink);
    outline: none;
  }

  .input-visibility:disabled {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  .input-visibility svg {
    width: 20px;
    height: 20px;
  }

  .input-message {
    font: var(--text-caption);
    color: var(--ink-muted);
  }

  .input-message--error {
    color: var(--danger);
  }

  .input-message--success {
    color: var(--success);
  }
</style>
