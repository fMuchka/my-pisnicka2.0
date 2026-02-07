<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Field } from '@ark-ui/vue';
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import Button from '../../core/Button.vue';
  import { createSession } from '../../../lib/session';
  import { useAuth } from '../../../composables/useAuth';
  import Routes from '../../../router/Routes';

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

  const { user } = useAuth();
  const router = useRouter();

  const sessionName = ref('');
  const createError = ref<string | null>(null);
  const isCreating = ref(false);

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const trimmedName = computed(() => sessionName.value.trim());
  const isNameValid = computed(() => trimmedName.value.length >= 3);
  const isSubmitDisabled = computed(() => !isNameValid.value || isCreating.value);
  const submitLabel = computed(() => (isCreating.value ? 'Vytvářím...' : 'Vytvořit'));

  const resetDialog = () => {
    sessionName.value = '';
    createError.value = null;
    isCreating.value = false;
  };

  watch(isOpen, (open) => {
    if (!open) {
      resetDialog();
    } else {
      createError.value = null;
    }
  });

  const handleCreateSession = async () => {
    if (isSubmitDisabled.value) return;

    const hostId = user.value?.uid;
    if (!hostId) {
      createError.value = 'Nejprve se přihlas.';
      return;
    }

    isCreating.value = true;
    createError.value = null;

    try {
      const created = await createSession({
        name: trimmedName.value,
        hostId,
        hostDisplayName: user.value?.displayName ?? 'Host',
      });

      isOpen.value = false;
      await router.push({ path: Routes.Session, query: { sessionId: created.id } });
    } catch (error) {
      createError.value = 'Nepodařilo se vytvořit relaci. Zkus to prosím znovu.';
    } finally {
      isCreating.value = false;
    }
  };
</script>

<template>
  <Dialog.Root v-model:open="isOpen">
    <Teleport to="body">
      <Dialog.Backdrop class="dialog-backdrop" />
      <Dialog.Positioner class="dialog-positioner">
        <Dialog.Content
          class="dialog-content"
          data-testid="create-session-dialog"
        >
          <Dialog.Title class="dialog-title">Vytvořit partu</Dialog.Title>
          <Dialog.Description class="dialog-description">
            Zadejte název nové party pro zahájení společného hraní.
          </Dialog.Description>

          <Field.Root class="field">
            <Field.Label class="field-label">
              Název party
              <Field.RequiredIndicator class="field-required">*</Field.RequiredIndicator>
            </Field.Label>
            <Field.Input
              v-model="sessionName"
              class="field-input"
              placeholder="Např. Kytarová večeře"
              :aria-invalid="!isNameValid && sessionName.length > 0"
            />
            <Field.HelperText class="field-helper">
              Název musí mít alespoň 3 znaky
            </Field.HelperText>
            <Field.ErrorText
              v-if="!isNameValid && sessionName.length > 0"
              class="field-error"
            >
              Název party musí mít alespoň 3 znaky
            </Field.ErrorText>
            <Field.ErrorText
              v-else-if="createError"
              class="field-error"
            >
              {{ createError }}
            </Field.ErrorText>
          </Field.Root>

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
              data-testid="create-session-submit"
              type="button"
              :disabled="isSubmitDisabled"
              @click="handleCreateSession"
            />
          </div>

          <Dialog.CloseTrigger
            class="dialog-close"
            aria-label="Zavřít dialog"
          >
            ✕
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

<style scoped>
  /* Dialog */
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog-content {
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--space-sm);
  }

  .dialog-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-lg);
  }

  .dialog-close {
    position: absolute;
    top: var(--space-md);
    right: var(--space-md);
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: var(--space-xs);
    line-height: 1;
  }

  .dialog-close:hover {
    color: var(--text-primary);
  }

  .dialog-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    margin-top: var(--space-lg);
  }

  /* Field */
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-label {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .field-required {
    color: var(--accent);
  }

  .field-input {
    padding: var(--space-sm);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 1rem;
  }

  .field-input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .field-helper {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .field-error {
    font-size: 0.75rem;
    color: var(--accent);
  }
</style>
