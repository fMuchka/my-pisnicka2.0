<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Field, PasswordInput } from '@ark-ui/vue';
  import { EyeIcon, EyeOffIcon } from 'lucide-vue-next';
  import { computed, ref, watch } from 'vue';
  import Button from '../../core/Button.vue';
  import { updateCurrentUserPassword } from '../../../lib/authService';

  interface Props {
    open?: boolean;
  }

  interface Emits {
    (e: 'update:open', value: boolean): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
  });

  const emit = defineEmits<Emits>();

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const newPassword = ref('');
  const confirmPassword = ref('');
  const submitError = ref<string | null>(null);
  const submitSuccess = ref<string | null>(null);
  const isSubmitting = ref(false);

  const hasNewPassword = computed(() => newPassword.value.length > 0);
  const hasConfirmPassword = computed(() => confirmPassword.value.length > 0);
  const passwordsMatch = computed(() => newPassword.value === confirmPassword.value);

  const strengthScore = computed(() => {
    let score = 0;

    if (newPassword.value.length >= 8) score += 1;
    if (/[a-z]/.test(newPassword.value) && /[A-Z]/.test(newPassword.value)) score += 1;
    if (/\d/.test(newPassword.value)) score += 1;
    if (/[^\da-zA-Z]/.test(newPassword.value)) score += 1;

    return score;
  });

  const strengthLabel = computed(() => {
    if (!hasNewPassword.value) return 'Zadej nové heslo';
    if (strengthScore.value <= 1) return 'Slabé';
    if (strengthScore.value <= 3) return 'Střední';
    return 'Silné';
  });

  const strengthClass = computed(() => {
    if (!hasNewPassword.value) return 'strength-empty';
    if (strengthScore.value <= 1) return 'strength-weak';
    if (strengthScore.value <= 3) return 'strength-medium';
    return 'strength-strong';
  });

  const strengthPercent = computed(() => {
    if (!hasNewPassword.value) return 0;
    return (strengthScore.value / 4) * 100;
  });

  const isSubmitDisabled = computed(() => {
    return (
      isSubmitting.value ||
      !hasNewPassword.value ||
      !hasConfirmPassword.value ||
      !passwordsMatch.value
    );
  });

  const submitLabel = computed(() => (isSubmitting.value ? 'Ukládám...' : 'Uložit heslo'));

  const resetDialog = () => {
    newPassword.value = '';
    confirmPassword.value = '';
    submitError.value = null;
    submitSuccess.value = null;
    isSubmitting.value = false;
  };

  watch(isOpen, (open) => {
    if (!open) {
      resetDialog();
      return;
    }

    submitError.value = null;
    submitSuccess.value = null;
  });

  const handleSubmit = async () => {
    if (isSubmitDisabled.value) return;

    submitError.value = null;
    submitSuccess.value = null;
    isSubmitting.value = true;

    try {
      await updateCurrentUserPassword(newPassword.value);
      submitSuccess.value = 'Heslo bylo úspěšně změněno.';

      window.setTimeout(() => {
        isOpen.value = false;
      }, 800);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };

      if (firebaseError.code === 'auth/requires-recent-login') {
        submitError.value = 'Pro změnu hesla je potřeba se znovu přihlásit.';
      } else if (firebaseError.code === 'auth/weak-password') {
        submitError.value = 'Zadané heslo je příliš slabé.';
      } else {
        submitError.value = 'Heslo se nepodařilo změnit. Zkus to prosím znovu.';
      }
    } finally {
      isSubmitting.value = false;
    }
  };
</script>

<template>
  <Dialog.Root v-model:open="isOpen">
    <Teleport
      v-if="isOpen"
      to="body"
    >
      <Dialog.Backdrop class="dialog-backdrop" />
      <Dialog.Positioner class="dialog-positioner">
        <Dialog.Content class="dialog-content">
          <Dialog.Title class="dialog-title">Změnit heslo</Dialog.Title>
          <Dialog.Description class="dialog-description">
            Zadej nové heslo a potvrzení. Síla hesla je pouze informativní.
          </Dialog.Description>

          <Field.Root class="field">
            <PasswordInput.Root class="password-root">
              <PasswordInput.Label class="field-label">Nové heslo</PasswordInput.Label>
              <PasswordInput.Control class="password-control">
                <PasswordInput.Input
                  :value="newPassword"
                  class="field-input"
                  placeholder="Zadej nové heslo"
                  @input="newPassword = ($event.target as HTMLInputElement)?.value"
                />
                <PasswordInput.VisibilityTrigger class="password-visibility">
                  <PasswordInput.Indicator>
                    <EyeIcon />
                    <template #fallback>
                      <EyeOffIcon />
                    </template>
                  </PasswordInput.Indicator>
                </PasswordInput.VisibilityTrigger>
              </PasswordInput.Control>
            </PasswordInput.Root>
          </Field.Root>

          <div class="strength-wrapper">
            <div class="strength-header">
              <span>Síla hesla</span>
              <span :class="['strength-label', strengthClass]">{{ strengthLabel }}</span>
            </div>
            <div class="strength-track">
              <div
                :class="['strength-fill', strengthClass]"
                :style="{ width: `${strengthPercent}%` }"
              />
            </div>
          </div>

          <Field.Root
            class="field"
            :invalid="hasConfirmPassword && !passwordsMatch"
          >
            <PasswordInput.Root class="password-root">
              <PasswordInput.Label class="field-label">Potvrzení nového hesla</PasswordInput.Label>
              <PasswordInput.Control class="password-control">
                <PasswordInput.Input
                  :value="confirmPassword"
                  class="field-input"
                  placeholder="Zopakuj nové heslo"
                  @input="confirmPassword = ($event.target as HTMLInputElement)?.value"
                />
                <PasswordInput.VisibilityTrigger class="password-visibility">
                  <PasswordInput.Indicator>
                    <EyeIcon />
                    <template #fallback>
                      <EyeOffIcon />
                    </template>
                  </PasswordInput.Indicator>
                </PasswordInput.VisibilityTrigger>
              </PasswordInput.Control>
            </PasswordInput.Root>
            <Field.ErrorText
              v-if="hasConfirmPassword && !passwordsMatch"
              class="field-error"
            >
              Hesla se neshodují.
            </Field.ErrorText>
          </Field.Root>

          <p
            v-if="submitError"
            class="status-error"
            aria-live="polite"
          >
            {{ submitError }}
          </p>
          <p
            v-if="submitSuccess"
            class="status-success"
            aria-live="polite"
          >
            {{ submitSuccess }}
          </p>

          <div class="dialog-actions">
            <Dialog.CloseTrigger as-child>
              <Button
                label="Zrušit"
                color-variation="Secondary"
                style-variation="Outlined"
                type="button"
              />
            </Dialog.CloseTrigger>
            <Button
              :label="submitLabel"
              type="button"
              :disabled="isSubmitDisabled"
              @click="handleSubmit"
            />
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

<style scoped>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: var(--overlay-backdrop);
    z-index: 1200;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    z-index: 1201;
  }

  .dialog-content {
    width: min(92vw, 420px);
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-dialog);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .dialog-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .dialog-description {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.88rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-label {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .password-control {
    position: relative;
    display: flex;
    align-items: center;
  }

  .field-input {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    font-family: var(--font-body);
    color: var(--text-primary);
    background-color: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    transition: border-color 150ms ease;
    padding-right: 44px;
  }

  .field-input:focus {
    outline: none;
    border: 2px solid var(--accent);
    padding: 11px 15px;
    padding-right: 43px;
  }

  .password-visibility {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .strength-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .strength-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .strength-label {
    font-weight: 600;
  }

  .strength-track {
    height: 8px;
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    overflow: hidden;

    .strength-empty {
      background-color: var(--text-secondary);
    }

    .strength-weak {
      background-color: var(--color-error);
    }

    .strength-medium {
      background-color: var(--accent);
    }

    .strength-strong {
      background-color: var(--color-success, #1f8f4c);
    }
  }

  .strength-fill {
    height: 100%;
    border-radius: var(--radius-sm);
    transition:
      width 180ms ease,
      background-color 180ms ease;
  }

  .strength-empty {
    color: var(--text-secondary);
  }

  .strength-weak {
    color: var(--color-error);
  }

  .strength-medium {
    color: var(--accent);
  }

  .strength-strong {
    color: var(--color-success, #1f8f4c);
  }

  .field-error,
  .status-error {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-error);
  }

  .status-success {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-success, #1f8f4c);
  }

  .dialog-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
  }
</style>
