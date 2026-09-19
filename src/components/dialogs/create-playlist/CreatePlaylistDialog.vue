<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Field } from '@ark-ui/vue';
  import { computed, ref, watch } from 'vue';
  import Button from '../../core/button/Button.vue';
  import type { PlaylistVisibility } from '../../../lib/playlist';

  interface Props {
    open?: boolean;
    isCreating?: boolean;
    error?: string | null;
  }

  interface Emits {
    (event: 'update:open', value: boolean): void;
    (event: 'create', payload: { name: string; visibility: PlaylistVisibility }): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    isCreating: false,
    error: null,
  });

  const emit = defineEmits<Emits>();

  const playlistName = ref('');
  const visibility = ref<PlaylistVisibility>('private');

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const trimmedName = computed(() => playlistName.value.trim());
  const isNameValid = computed(() => trimmedName.value.length >= 1);
  const isSubmitDisabled = computed(() => !isNameValid.value || props.isCreating);
  const submitLabel = computed(() => (props.isCreating ? 'Vytvářím...' : 'Vytvořit'));

  const resetDialog = () => {
    playlistName.value = '';
    visibility.value = 'private';
  };

  watch(isOpen, (open) => {
    if (!open) {
      resetDialog();
    }
  });

  const handleSubmit = () => {
    if (isSubmitDisabled.value) {
      return;
    }

    emit('create', {
      name: trimmedName.value,
      visibility: visibility.value,
    });
  };
</script>

<template>
  <Dialog.Root v-model:open="isOpen">
    <Teleport to="body">
      <Dialog.Backdrop class="dialog-backdrop" />
      <Dialog.Positioner class="dialog-positioner">
        <Dialog.Content
          class="dialog-content"
          data-testid="create-playlist-dialog"
        >
          <Dialog.Title class="dialog-title">Vytvořit playlist</Dialog.Title>
          <Dialog.Description class="dialog-description">
            Zadejte název playlistu a zvolte, zda bude viditelný i ostatním.
          </Dialog.Description>

          <Field.Root
            class="field"
            :invalid="(!isNameValid && playlistName.length > 0) || error != null"
          >
            <Field.Label class="field-label">
              Název playlistu
              <Field.RequiredIndicator>
                <span class="field-required">*</span>
              </Field.RequiredIndicator>
            </Field.Label>
            <Field.Input
              v-model="playlistName"
              class="field-input"
              placeholder="Např. Večerní hraní"
              :aria-invalid="!isNameValid && playlistName.length > 0"
            />
            <Field.HelperText class="field-helper">
              Název musí obsahovat alespoň 1 znak
            </Field.HelperText>
            <Field.ErrorText
              v-if="!isNameValid && playlistName.length > 0"
              class="field-error"
            >
              Název playlistu nesmí být prázdný
            </Field.ErrorText>
            <Field.ErrorText
              v-if="error"
              class="field-error"
              :aria-label="error"
            >
              {{ error }}
            </Field.ErrorText>
          </Field.Root>

          <label class="visibility-toggle">
            <input
              v-model="visibility"
              type="checkbox"
              true-value="public"
              false-value="private"
            />
            Veřejný playlist
          </label>

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
              data-testid="create-playlist-submit"
              type="button"
              :disabled="isSubmitDisabled"
              @click="handleSubmit"
            />
          </div>

          <Dialog.CloseTrigger
            class="dialog-close"
            aria-label="Zavřít dialog playlistu"
          >
            ✕
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

<style scoped>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background-color: var(--overlay-backdrop);
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
    box-shadow: var(--shadow-dialog);
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
    color: var(--color-error-dark);
  }

  .visibility-toggle {
    margin-top: var(--space-md);
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
</style>
