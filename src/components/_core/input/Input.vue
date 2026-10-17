<script setup lang="ts">
  import { Field } from '@ark-ui/vue/field';
  import { Eye, EyeOff } from 'lucide-vue-next';
  import { computed, ref } from 'vue';
  import FieldMessages from '../field/FieldMessages.vue';
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
  const isSuccess = computed(() => props.success && !props.invalid);
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

    <div class="field-control">
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
          'field-input',
          {
            'field-input--success': isSuccess,
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

    <FieldMessages
      :helper-text="props.helperText"
      :error-text="props.errorText"
      :success-text="props.successText"
      :invalid="props.invalid"
      :success="props.success"
    />
  </Field.Root>
</template>

<style scoped src="../field/field.css"></style>

<style scoped>
  .input--with-prepend {
    padding-left: 40px;
  }

  .input--with-append {
    padding-right: 48px;
  }

  /* Native search clear buttons clash with our own styling and differ per browser. */
  .field-input[type='search']::-webkit-search-cancel-button,
  .field-input[type='search']::-webkit-search-decoration {
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
</style>
