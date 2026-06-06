<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Field } from '@ark-ui/vue';
  import { Combobox, useListCollection } from '@ark-ui/vue/combobox';
  import { useFilter } from '@ark-ui/vue/locale';
  import { computed, ref, watch } from 'vue';
  import { Check, ChevronDown, Plus } from 'lucide-vue-next';
  import Button from '../../core/Button.vue';
  import SongTextEditor from '../../song/SongTextEditor.vue';
  import {
    createSongCatalogEntry,
    fetchAllSongCategories,
    fetchSongCatalogEntryBySourceSongId,
    resolveSongCategoryIds,
    updateSongCatalogEntry,
    type CreateSongInput,
    type SongCategory,
    type SongCatalogEntryInput,
    type Song,
  } from '../../../lib/song';
  import { useAuth } from '../../../composables/useAuth';
  import { placeholderSong } from './placeholderSong';
  import { useSongStore } from '../../../stores/song';

  interface Props {
    open?: boolean;
    songToEdit?: Song | null;
  }

  interface Emits {
    (e: 'update:open', value: boolean): void;
    (e: 'saved', song: Song): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    songToEdit: null,
  });

  const emit = defineEmits<Emits>();

  const songTitle = ref('');
  const songArtist = ref('');
  const songText = ref(placeholderSong.text);
  const songChords = ref<string[]>([]);
  const songCategoryIds = ref<string[]>([]);
  const pendingCategoryLabels = ref<string[]>([]);
  const categoryInputValue = ref('');
  const availableSongCategories = ref<SongCategory[]>([]);
  const songCapo = ref('');
  const createError = ref<string | null>(null);
  const isCreating = ref(false);

  type CategoryComboboxItem = { label: string; value: string };

  const filters = useFilter({ sensitivity: 'base' });
  const {
    collection: categoryCollection,
    filter: filterCategoryCollection,
    set: setCategoryCollection,
  } = useListCollection<CategoryComboboxItem>({
    initialItems: [],
    filter: filters.value.contains,
  });

  const songStore = useSongStore();

  const { user } = useAuth();

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
  const isEditMode = computed(() => props.songToEdit != null);
  const dialogTitle = computed(() => (isEditMode.value ? 'Upravit píseň' : 'Vytvořit píseň'));
  const dialogDescription = computed(() =>
    isEditMode.value
      ? 'Upravte název písně, umělce a text s akordy.'
      : 'Zadejte název písně, umělce a volitelně text s akordy.'
  );
  const submitLabel = computed(() => {
    if (isCreating.value) {
      return isEditMode.value ? 'Ukládám...' : 'Vytvářím...';
    }

    return isEditMode.value ? 'Uložit změny' : 'Vytvořit';
  });

  const categoryMapById = computed(
    () => new Map(availableSongCategories.value.map((category) => [category.id, category]))
  );

  const selectedCategoryLabels = computed(() =>
    songCategoryIds.value
      .map((categoryId) => categoryMapById.value.get(categoryId)?.value)
      .filter((categoryLabel): categoryLabel is string => categoryLabel !== undefined)
  );

  const normalizeCategoryLabel = (value: string) => value.trim().toLocaleLowerCase('cs');

  const categoryLabelsToPersist = computed(() => [
    ...selectedCategoryLabels.value,
    ...pendingCategoryLabels.value,
  ]);

  const canAddCategoryFromInput = computed(() => categoryInputValue.value.trim().length > 0);

  const commitCategoryInput = () => {
    const nextLabel = categoryInputValue.value.trim();

    if (nextLabel.length === 0) {
      return;
    }

    const normalizedLabel = normalizeCategoryLabel(nextLabel);

    const existingCategory = availableSongCategories.value.find(
      (category) => normalizeCategoryLabel(category.value) === normalizedLabel
    );

    if (existingCategory !== undefined) {
      if (!songCategoryIds.value.includes(existingCategory.id)) {
        songCategoryIds.value = [...songCategoryIds.value, existingCategory.id];
      }

      categoryInputValue.value = '';
      filterCategoryCollection('');
      return;
    }

    const hasPendingAlready = pendingCategoryLabels.value.some(
      (categoryLabel) => normalizeCategoryLabel(categoryLabel) === normalizedLabel
    );

    if (!hasPendingAlready) {
      pendingCategoryLabels.value = [...pendingCategoryLabels.value, nextLabel];
    }

    categoryInputValue.value = '';
    filterCategoryCollection('');
  };

  const addCategoryFromInput = () => {
    commitCategoryInput();
  };

  const removePendingCategory = (categoryLabelToRemove: string) => {
    pendingCategoryLabels.value = pendingCategoryLabels.value.filter(
      (categoryLabel) => categoryLabel !== categoryLabelToRemove
    );
  };

  const handleCategoryInputChange = (details: Combobox.InputValueChangeDetails) => {
    categoryInputValue.value = details.inputValue;
    filterCategoryCollection(details.inputValue);
  };

  const handleCategoryValueChange = (
    details: Combobox.ValueChangeDetails<CategoryComboboxItem>
  ) => {
    songCategoryIds.value = details.items.map((item) => item.value);
  };

  const loadSongCategories = async () => {
    const categories = await fetchAllSongCategories();
    availableSongCategories.value = categories;

    setCategoryCollection(
      categories.map((category) => ({ label: category.value, value: category.id }))
    );
  };

  const handleUniqueChordsChange = (uniqueChords: string[]) => {
    songChords.value = uniqueChords;
  };

  const resetDialog = () => {
    songTitle.value = '';
    songArtist.value = '';
    songText.value = '';
    songChords.value = [];
    songCategoryIds.value = [];
    pendingCategoryLabels.value = [];
    categoryInputValue.value = '';
    availableSongCategories.value = [];
    setCategoryCollection([]);
    songCapo.value = '';
    createError.value = null;
    isCreating.value = false;
  };

  watch(isOpen, async (open) => {
    if (!open) {
      resetDialog();
    } else {
      createError.value = null;

      if (props.songToEdit != null) {
        songTitle.value = props.songToEdit.title;
        songArtist.value = props.songToEdit.artist;
        songText.value = props.songToEdit.text ?? '';
        songChords.value = props.songToEdit.chords ?? [];
        songCapo.value = props.songToEdit.capo != null ? String(props.songToEdit.capo) : '';

        await loadSongCategories();

        const existingCatalogEntry = await fetchSongCatalogEntryBySourceSongId(props.songToEdit.id);

        songCategoryIds.value = existingCatalogEntry?.categories ?? [];
        pendingCategoryLabels.value = [];
      } else {
        await loadSongCategories();
        songCategoryIds.value = [];
        pendingCategoryLabels.value = [];
      }
    }
  });

  const handleCreateOrUpdateSong = async () => {
    if (isSubmitDisabled.value || user.value == null) return;

    isCreating.value = true;
    createError.value = null;

    const capoRaw = songCapo.value.trim();
    let capoValue: number | undefined;

    if (capoRaw.length > 0) {
      const parsedCapo = Number(capoRaw);
      if (!Number.isFinite(parsedCapo) || !Number.isInteger(parsedCapo) || parsedCapo < 0) {
        createError.value = 'Capo musí být nezáporné celé číslo.';
        isCreating.value = false;
        return;
      }

      capoValue = parsedCapo;
    }

    try {
      const resolvedCategoryIds = await resolveSongCategoryIds(categoryLabelsToPersist.value);

      const songInput: CreateSongInput = {
        title: trimmedTitle.value,
        artist: trimmedArtist.value,
        text: songText.value.trim() || undefined,
        chords: [...songChords.value],
        ...(capoValue !== undefined ? { capo: capoValue } : {}),
        ownerId: user.value.uid,
      };

      const savedSong =
        isEditMode.value && props.songToEdit != null
          ? await songStore.updateSong(props.songToEdit.id, songInput)
          : await songStore.createSong(songInput);

      const catalogEntryInput: SongCatalogEntryInput = {
        artist: savedSong.artist,
        chords: savedSong.chords,
        categories: resolvedCategoryIds,
        ownerId: savedSong.ownerId,
        sourceSongId: savedSong.id,
        title: savedSong.title,
      };

      if (isEditMode.value) {
        const existingCatalogEntry = await fetchSongCatalogEntryBySourceSongId(savedSong.id);

        if (existingCatalogEntry != null) {
          await updateSongCatalogEntry(existingCatalogEntry.id, catalogEntryInput);
        } else {
          await createSongCatalogEntry(catalogEntryInput);
        }
      } else {
        await createSongCatalogEntry(catalogEntryInput);
      }

      emit('saved', savedSong);

      isOpen.value = false;
    } catch {
      createError.value = isEditMode.value
        ? 'Nepodařilo se upravit píseň. Zkus to prosím znovu.'
        : 'Nepodařilo se vytvořit píseň. Zkus to prosím znovu.';
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
          <Dialog.Title class="dialog-title">{{ dialogTitle }}</Dialog.Title>

          <div class="dialog-body">
            <Dialog.Description class="dialog-description">{{
              dialogDescription
            }}</Dialog.Description>

            <div class="form-fields">
              <!-- Title Field -->
              <Field.Root class="field">
                <Field.Label class="field-label">
                  Název písně
                  <Field.RequiredIndicator>
                    <span class="field-required">*</span>
                  </Field.RequiredIndicator>
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
                  <Field.RequiredIndicator>
                    <span class="field-required">*</span>
                  </Field.RequiredIndicator>
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
              <Field.Root class="field">
                <Field.Label class="field-label">Kategorie</Field.Label>

                <div
                  v-if="selectedCategoryLabels.length > 0 || pendingCategoryLabels.length > 0"
                  class="category-chips"
                >
                  <span
                    v-for="categoryLabel in selectedCategoryLabels"
                    :key="`selected-category-${categoryLabel}`"
                    class="category-chip"
                  >
                    {{ categoryLabel }}
                  </span>

                  <button
                    v-for="categoryLabel in pendingCategoryLabels"
                    :key="`pending-category-${categoryLabel}`"
                    type="button"
                    class="category-chip category-chip--pending"
                    @click="removePendingCategory(categoryLabel)"
                  >
                    {{ categoryLabel }}
                    <span class="category-chip__pending-label">nová</span>
                  </button>
                </div>

                <Combobox.Root
                  multiple
                  :close-on-select="false"
                  :lazy-mount="true"
                  :collection="categoryCollection"
                  :model-value="songCategoryIds"
                  @input-value-change="handleCategoryInputChange"
                  @value-change="handleCategoryValueChange"
                >
                  <Combobox.Control class="category-combobox-control">
                    <Combobox.Input
                      class="field-input category-combobox-input"
                      placeholder="Vyberte nebo napište kategorii"
                      aria-label="Vybrat kategorii"
                      data-testid="song-category-combobox-input"
                      @keydown.enter.prevent="addCategoryFromInput"
                      @blur="commitCategoryInput"
                    />

                    <Combobox.Trigger
                      class="category-combobox-trigger"
                      aria-label="Otevřít výběr kategorií"
                    >
                      <ChevronDown :size="14" />
                    </Combobox.Trigger>
                  </Combobox.Control>

                  <Combobox.Positioner>
                    <Combobox.Content class="category-combobox-content">
                      <Combobox.Empty class="field-helper">
                        Žádné kategorie k dispozici.
                      </Combobox.Empty>

                      <Combobox.Item
                        v-for="categoryItem in categoryCollection.items"
                        :key="categoryItem.value"
                        :item="categoryItem"
                        class="category-combobox-item"
                      >
                        <Combobox.ItemText>{{ categoryItem.label }}</Combobox.ItemText>
                        <Combobox.ItemIndicator>
                          <Check :size="14" />
                        </Combobox.ItemIndicator>
                      </Combobox.Item>
                    </Combobox.Content>
                  </Combobox.Positioner>
                </Combobox.Root>

                <button
                  v-if="canAddCategoryFromInput"
                  type="button"
                  class="category-add-button"
                  @click="addCategoryFromInput"
                >
                  <Plus :size="14" />
                  Přidat kategorii „{{ categoryInputValue.trim() }}“
                </button>

                <Field.HelperText class="field-helper">
                  Vyberte existující kategorii nebo napište novou a potvrďte Enterem.
                </Field.HelperText>
              </Field.Root>

              <Field.Root class="field">
                <Field.Label class="field-label">Capo</Field.Label>
                <Field.Input
                  v-model="songCapo"
                  class="field-input"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  placeholder="Např. 2"
                />
                <Field.HelperText class="field-helper">
                  Nechte prázdné, pokud capo není potřeba.
                </Field.HelperText>
              </Field.Root>

              <!-- Text Field (Optional) -->
              <Field.Root class="field">
                <Field.Label class="field-label"> Text s akordy </Field.Label>
                <SongTextEditor
                  v-model="songText"
                  placeholder="[Verse]&#10;[G] Mama take this [D] badge off of [Am] me"
                  @unique-chords="handleUniqueChordsChange"
                />
                <Field.HelperText class="field-helper">
                  Akordy lze přidat po vybrání textu.
                </Field.HelperText>
              </Field.Root>
              <!-- General Error -->
              <p
                v-if="createError"
                class="field-error"
                role="alert"
              >
                {{ createError }}
              </p>
            </div>
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
              @click="handleCreateOrUpdateSong"
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
    background-color: var(--overlay-backdrop);
    z-index: 999;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    z-index: 1000;
  }

  .dialog-content {
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    width: min(96vw, 640px);
    max-height: 90vh;
    box-shadow: var(--shadow-dialog);
    position: relative;
    overflow-y: auto;
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

  .dialog-body {
    overflow-y: auto;
    min-height: 0;
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

  .category-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .category-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--text-primary);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .category-chip--pending {
    cursor: pointer;
    border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  }

  .category-chip__pending-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-secondary);
  }

  .category-combobox-control {
    position: relative;
  }

  .category-combobox-input {
    padding-right: 34px;
    width: 100%;
  }

  .category-combobox-trigger {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .category-combobox-trigger:hover {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--text-primary) 8%, transparent);
  }

  .category-combobox-content {
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    min-width: var(--reference-width);
    max-height: 180px;
    overflow-y: auto;
    padding: 4px;
    z-index: 30;
  }

  .category-combobox-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-secondary);
  }

  .category-combobox-item:hover,
  .category-combobox-item[data-state='checked'] {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--text-primary);
  }

  .category-add-button {
    border: 1px dashed color-mix(in srgb, var(--color-primary) 40%, transparent);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;
    width: fit-content;
  }

  .category-add-button:hover {
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
  }

  .field-error {
    font-size: 0.75rem;
    color: var(--color-error);
  }

  @media (min-width: 1024px) {
    .dialog-content {
      width: min(92vw, 980px);
      max-height: 92vh;
      padding: var(--space-xl);
    }
  }
</style>
