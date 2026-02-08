<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Field } from '@ark-ui/vue';
  import { computed, ref, watch } from 'vue';
  import Button from '../../core/Button.vue';
  import SongTextEditor from '../../song/SongTextEditor.vue';

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

  const songTitle = ref('');
  const songArtist = ref('');
  const songText = ref('');
  const songChords = ref('');
  const createError = ref<string | null>(null);
  const isCreating = ref(false);

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const trimmedTitle = computed(() => songTitle.value.trim());
  const trimmedArtist = computed(() => songArtist.value.trim());
  const isTitleValid = computed(() => trimmedTitle.value.length >= 1);
  const isArtistValid = computed(() => trimmedArtist.value.length >= 1);
  const isFormValid = computed(() => isTitleValid.value && isArtistValid.value);
  const isSubmitDisabled = computed(() => !isFormValid.value || isCreating.value);
  const submitLabel = computed(() => (isCreating.value ? 'Vytvářím...' : 'Vytvořit'));

  const resetDialog = () => {
    songTitle.value = '';
    songArtist.value = '';
    songText.value = '';
    songChords.value = '';
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

  const handleCreateSong = async () => {
    if (isSubmitDisabled.value) return;

    isCreating.value = true;
    createError.value = null;

    try {
      // Mock: Just simulate creation for now
      await new Promise((resolve) => setTimeout(resolve, 500));

      const chordsList = songChords.value
        .trim()
        .split(/[\s,]+/)
        .filter((c) => c.length > 0);

      console.log('Creating song:', {
        title: trimmedTitle.value,
        artist: trimmedArtist.value,
        text: songText.value.trim() || undefined,
        chords: chordsList.length > 0 ? chordsList : [],
      });

      isOpen.value = false;
    } catch (_error) {
      createError.value = 'Nepodařilo se vytvořit píseň. Zkus to prosím znovu.';
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
          data-testid="create-song-dialog"
        >
          <Dialog.Title class="dialog-title">Vytvořit píseň</Dialog.Title>
          <Dialog.Description class="dialog-description">
            Zadejte název písně, umělce a volitelně text s akordy.
          </Dialog.Description>

          <div class="form-fields">
            <!-- Title Field -->
            <Field.Root class="field">
              <Field.Label class="field-label">
                Název písně
                <Field.RequiredIndicator class="field-required">*</Field.RequiredIndicator>
              </Field.Label>
              <Field.Input
                v-model="songTitle"
                class="field-input"
                placeholder="Např. Knockin' on Heaven's Door"
                :aria-invalid="!isTitleValid && songTitle.length > 0"
              />
              <Field.ErrorText
                v-if="!isTitleValid && songTitle.length > 0"
                class="field-error"
              >
                Název písně je povinný
              </Field.ErrorText>
            </Field.Root>

            <!-- Artist Field -->
            <Field.Root class="field">
              <Field.Label class="field-label">
                Umělec
                <Field.RequiredIndicator class="field-required">*</Field.RequiredIndicator>
              </Field.Label>
              <Field.Input
                v-model="songArtist"
                class="field-input"
                placeholder="Např. Bob Dylan"
                :aria-invalid="!isArtistValid && songArtist.length > 0"
              />
              <Field.ErrorText
                v-if="!isArtistValid && songArtist.length > 0"
                class="field-error"
              >
                Umělec je povinný
              </Field.ErrorText>
            </Field.Root>

            <!-- Text Field (Optional) -->
            <Field.Root class="field">
              <Field.Label class="field-label"> Text s akordy </Field.Label>
              <SongTextEditor
                v-model="songText"
                placeholder="[Verse 1]&#10;G                D                Am&#10;  Mama take this badge off of me&#10;[Chorus]&#10;G         D               C&#10;  I can't use it anymore"
              />
              <Field.HelperText class="field-helper">
                Vytvořte sekce (Verse, Chorus, Bridge) a přidejte text s akordy
              </Field.HelperText>
            </Field.Root>

            <!-- Chords List Field (Optional) -->
            <Field.Root class="field">
              <Field.Label class="field-label"> Seznam akordů </Field.Label>
              <Field.Input
                v-model="songChords"
                class="field-input"
                placeholder="G D Am C"
              />
              <Field.HelperText class="field-helper">
                Volitelné - oddělené mezerami (např. G D Am C)
              </Field.HelperText>
            </Field.Root>

            <!-- General Error -->
            <Field.ErrorText
              v-if="createError"
              class="field-error"
            >
              {{ createError }}
            </Field.ErrorText>
          </div>

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
              data-testid="create-song-submit"
              type="button"
              :disabled="isSubmitDisabled"
              @click="handleCreateSong"
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
    max-width: 500px;
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
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }

  .dialog-close:hover {
    background-color: var(--bg-secondary);
  }

  .dialog-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    margin-top: var(--space-lg);
  }

  /* Form */
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
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
    color: var(--color-error);
  }

  .field-input,
  .field-textarea {
    padding: var(--space-sm);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .field-input:focus,
  .field-textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  .field-input[aria-invalid='true'],
  .field-textarea[aria-invalid='true'] {
    border-color: var(--color-error);
  }

  .field-textarea {
    resize: vertical;
    font-family: monospace;
    min-height: 80px;
  }

  .field-helper {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .field-error {
    font-size: 0.75rem;
    color: var(--color-error);
  }
</style>
