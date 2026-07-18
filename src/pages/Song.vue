<script setup lang="ts">
  import { Field } from '@ark-ui/vue';
  import { Combobox, useListCollection } from '@ark-ui/vue/combobox';
  import { useFilter } from '@ark-ui/vue/locale';
  import { Check, ChevronDown, Pencil, Plus } from 'lucide-vue-next';
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import Button from '../components/core/Button.vue';
  import ErrorMessage from '../components/core/ErrorMessage.vue';
  import LoadingSpinner from '../components/core/LoadingSpinner.vue';
  import SongChordsDialog from '../components/dialogs/song-chords/SongChordsDialog.vue';
  import SongQuickInfo from '../components/song/SongQuickInfo.vue';
  import SongTextEditor from '../components/song/SongTextEditor.vue';
  import ChordLayoutRenderer from '../components/song/ChordLayoutRenderer.vue';
  import SongControls from '../components/song/SongControls.vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import { useAuth } from '../composables/useAuth';
  import { useSongDetail } from '../composables/useSongDetail';
  import { SECTIONS_DICTIONARY, type SectionTypes } from '../lib/sections/sectionsDictionary';
  import {
    createSongCatalogEntry,
    fetchAllSongCategories,
    fetchSongCatalogEntryBySourceSongId,
    resolveSongCategoryIds,
    updateSongCatalogEntry,
    type CreateSongInput,
    type Song,
    type SongCatalogEntryInput,
    type SongCategory,
  } from '../lib/song';
  import { updateActiveSongId } from '../lib/session';
  import Routes from '../router/Routes';
  import { useSessionStore } from '../stores/session';
  import { useSongStore } from '../stores/song';

  type SectionType = SectionTypes;
  type Section = { type: SectionType; text: string };

  type CategoryComboboxItem = { label: string; value: string };

  const route = useRoute();
  const router = useRouter();
  const sessionStore = useSessionStore();
  const songStore = useSongStore();
  const { isAuthenticated, user } = useAuth();
  const isInlineEditMode = ref(false);
  const isChordsDialogOpen = ref(false);
  const transpose = ref(0);
  const editorViewMode = ref<'source' | 'preview'>('preview');
  const songTitle = ref('');
  const songArtist = ref('');
  const songTextDraft = ref('');
  const songChordsDraft = ref<string[]>([]);
  const songCategoryIds = ref<string[]>([]);
  const pendingCategoryLabels = ref<string[]>([]);
  const categoryInputValue = ref('');
  const availableSongCategories = ref<SongCategory[]>([]);
  const songCapo = ref('');
  const saveError = ref<string | null>(null);
  const isSaving = ref(false);

  const isAutoScrollPlaying = ref(false);
  const autoScrollSpeed = ref(28);
  const songPageRef = ref<HTMLElement | null>(null);
  const currentScrollTop = ref(0);
  const maxScrollTop = ref(0);

  const AUTO_SCROLL_SPEED_STEP = 2;
  const AUTO_SCROLL_MIN_SPEED = 10;
  const AUTO_SCROLL_MAX_SPEED = 80;
  const AUTO_SCROLL_SCROLL_STEP = 132;
  type ScrollMode = 'auto' | 'smooth';

  let animationFrameId: number | null = null;
  let previousFrameTime: number | null = null;
  let autoScrollPosition: number | null = null;

  const filters = useFilter({ sensitivity: 'base' });
  const {
    collection: categoryCollection,
    filter: filterCategoryCollection,
    set: setCategoryCollection,
  } = useListCollection<CategoryComboboxItem>({
    initialItems: [],
    filter: filters.value.contains,
  });

  const isElementScrollable = (element: HTMLElement) => {
    const overflowY = window.getComputedStyle(element).overflowY;
    const allowsScrolling =
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';

    return allowsScrolling && element.scrollHeight - element.clientHeight > 1;
  };

  const getScrollableContainer = () => {
    let current = songPageRef.value;

    while (current) {
      if (isElementScrollable(current)) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  };

  const getDocumentScrollHeight = () => {
    const doc = document.documentElement;
    const body = document.body;

    return Math.max(
      doc.scrollHeight,
      body.scrollHeight,
      doc.offsetHeight,
      body.offsetHeight,
      doc.clientHeight,
      body.clientHeight
    );
  };

  const getViewportHeight = () => window.visualViewport?.height ?? window.innerHeight;

  const getCurrentScrollTop = () => {
    const container = getScrollableContainer();

    if (container) {
      return container.scrollTop;
    }

    const doc = document.documentElement;
    const body = document.body;

    return window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
  };

  const getMaxScrollTop = () => {
    const container = getScrollableContainer();

    if (container) {
      return Math.max(0, container.scrollHeight - container.clientHeight);
    }

    return Math.max(0, getDocumentScrollHeight() - getViewportHeight());
  };

  const syncScrollMetrics = () => {
    currentScrollTop.value = getCurrentScrollTop();
    maxScrollTop.value = getMaxScrollTop();
  };

  const scrollToTop = (top: number, behavior: ScrollMode = 'auto') => {
    const container = getScrollableContainer();

    if (container) {
      try {
        container.scrollTo({ top, behavior });
      } catch {
        container.scrollTop = top;
      }

      if (Math.abs(container.scrollTop - top) > 1) {
        container.scrollTop = top;
      }

      syncScrollMetrics();

      return;
    }

    const doc = document.documentElement;
    const body = document.body;

    try {
      window.scrollTo({ top, behavior });
    } catch {
      window.scrollTo(0, top);
    }

    if (Math.abs(getCurrentScrollTop() - top) > 1) {
      doc.scrollTop = top;
      body.scrollTop = top;
    }

    syncScrollMetrics();
  };

  const scrollByDistance = (distance: number, behavior: ScrollMode = 'auto') => {
    const nextTop = Math.max(0, Math.min(getCurrentScrollTop() + distance, getMaxScrollTop()));
    const shouldUseInstantScroll = isAutoScrollPlaying.value;

    scrollToTop(nextTop, shouldUseInstantScroll ? 'auto' : behavior);

    if (shouldUseInstantScroll) {
      autoScrollPosition = nextTop;
      previousFrameTime = null;
    }
  };

  const isCreateMode = computed(() => route.path === Routes.SongCreate);
  const isEditorMode = computed(() => isCreateMode.value || isInlineEditMode.value);

  const songId = computed(() => {
    if (isCreateMode.value) {
      return null;
    }

    const routeSongId = route.params.songId;

    if (typeof routeSongId === 'string') {
      return routeSongId;
    }

    return null;
  });

  const { song, songError, songLoading } = useSongDetail(songId);

  const getSongPath = (currentSongId: string) => Routes.Song.replace(':songId', currentSongId);
  const displaySongText = computed(
    () => song.value?.text?.trim() || 'Text písně zatím není k dispozici.'
  );
  const songChords = computed(() => {
    if (isEditorMode.value) {
      return songChordsDraft.value.filter((chord) => chord.length > 0);
    }

    return song.value?.chords?.filter((chord) => chord.length > 0) ?? [];
  });
  const pageTitle = computed(() => {
    if (isEditorMode.value) {
      const draftTitle = songTitle.value.trim();
      return draftTitle.length > 0
        ? draftTitle
        : isCreateMode.value
          ? 'Nová píseň'
          : 'Upravit píseň';
    }

    return song.value?.title ?? 'Píseň';
  });
  const pageSubtitle = computed(() => {
    if (isEditorMode.value) {
      const draftArtist = songArtist.value.trim();
      return draftArtist.length > 0
        ? draftArtist
        : isCreateMode.value
          ? 'Vytvořit píseň'
          : 'Upravit metadata a text';
    }

    return song.value?.artist;
  });
  const trimmedTitle = computed(() => songTitle.value.trim());
  const trimmedArtist = computed(() => songArtist.value.trim());
  const isTitleValid = computed(() => trimmedTitle.value.length >= 1);
  const isArtistValid = computed(() => trimmedArtist.value.length >= 1);
  const isFormValid = computed(() => isTitleValid.value && isArtistValid.value);
  const isSubmitDisabled = computed(
    () => !isFormValid.value || isSaving.value || user.value == null
  );
  const categoryMapById = computed(
    () => new Map(availableSongCategories.value.map((category) => [category.id, category]))
  );
  const selectedCategoryLabels = computed(() =>
    songCategoryIds.value
      .map((categoryId) => categoryMapById.value.get(categoryId)?.value)
      .filter((categoryLabel): categoryLabel is string => categoryLabel !== undefined)
  );
  const categoryLabelsToPersist = computed(() => [
    ...selectedCategoryLabels.value,
    ...pendingCategoryLabels.value,
  ]);
  const canAddCategoryFromInput = computed(() => categoryInputValue.value.trim().length > 0);
  const remainingScrollDistance = computed(() =>
    Math.max(0, maxScrollTop.value - currentScrollTop.value)
  );
  const remainingScrollSeconds = computed(() => {
    if (autoScrollSpeed.value <= 0) {
      return 0;
    }

    return Math.ceil(remainingScrollDistance.value / autoScrollSpeed.value);
  });
  const formatRemainingTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const autoScrollEtaLabel = computed(() => formatRemainingTime(remainingScrollSeconds.value));

  const sections = ref<Section[]>([]);

  const SECTION_MARKER_REGEX = new RegExp(
    `\\[(${Object.keys(SECTIONS_DICTIONARY).join('|')})\\]`,
    'gi'
  );

  const isSectionType = (value: string): value is SectionType => value in SECTIONS_DICTIONARY;

  watch(
    displaySongText,
    (newValue) => {
      const normalizedText = newValue.trim();

      if (!normalizedText) {
        sections.value = [];

        return;
      }

      const markers = [...normalizedText.matchAll(SECTION_MARKER_REGEX)];

      if (markers.length === 0) {
        sections.value = [];

        return;
      }

      const newSections: Section[] = [];

      for (let i = 0; i < markers.length; i += 1) {
        const marker = markers[i];

        if (!marker || marker.index === undefined) {
          continue;
        }

        const sectionTypeCandidate = marker[1]?.toLowerCase();
        const sectionTextStart = marker.index + marker[0].length;
        const nextMarker = markers[i + 1];
        const sectionTextEnd = nextMarker?.index ?? normalizedText.length;
        const sectionText = normalizedText.slice(sectionTextStart, sectionTextEnd).trim();

        if (sectionTypeCandidate && isSectionType(sectionTypeCandidate) && sectionText.length > 0) {
          newSections.push({
            type: sectionTypeCandidate,
            text: sectionText,
          });
        }
      }

      sections.value = newSections;
    },
    { immediate: true }
  );

  const normalizeCategoryLabel = (value: string) => value.trim().toLocaleLowerCase('cs');

  const resetEditorState = () => {
    songTitle.value = '';
    songArtist.value = '';
    songTextDraft.value = '';
    songChordsDraft.value = [];
    songCategoryIds.value = [];
    pendingCategoryLabels.value = [];
    categoryInputValue.value = '';
    songCapo.value = '';
    saveError.value = null;
    isSaving.value = false;
  };

  const loadSongCategories = async () => {
    const categories = await fetchAllSongCategories();
    availableSongCategories.value = categories;

    setCategoryCollection(
      categories.map((category) => ({ label: category.value, value: category.id }))
    );
  };

  const populateDraftFromSong = (songToEdit: Song) => {
    songTitle.value = songToEdit.title;
    songArtist.value = songToEdit.artist;
    songTextDraft.value = songToEdit.text ?? '';
    songChordsDraft.value = songToEdit.chords ?? [];
    songCapo.value = songToEdit.capo != null ? String(songToEdit.capo) : '';
  };

  const initializeCreateMode = async () => {
    resetEditorState();
    editorViewMode.value = 'preview';
    await loadSongCategories();
  };

  const initializeInlineEditMode = async () => {
    if (song.value == null) {
      return;
    }

    resetEditorState();
    populateDraftFromSong(song.value);
    await loadSongCategories();

    const existingCatalogEntry = await fetchSongCatalogEntryBySourceSongId(song.value.id);
    songCategoryIds.value = existingCatalogEntry?.categories ?? [];
    editorViewMode.value = 'preview';
    isInlineEditMode.value = true;
  };

  const handleUniqueChordsChange = (uniqueChords: string[]) => {
    songChordsDraft.value = uniqueChords;
  };

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

  const openInlineEditMode = () => {
    void initializeInlineEditMode();
  };

  const cancelEditing = () => {
    if (isCreateMode.value) {
      void router.push({ path: Routes.SongLibrary });
      return;
    }

    isInlineEditMode.value = false;
    saveError.value = null;
    editorViewMode.value = 'preview';
  };

  const handleCreateOrUpdateSong = async () => {
    if (isSubmitDisabled.value || user.value == null) {
      return;
    }

    isSaving.value = true;
    saveError.value = null;

    const capoRaw = songCapo.value.trim();
    let capoValue: number | undefined;

    if (capoRaw.length > 0) {
      const parsedCapo = Number(capoRaw);

      if (!Number.isFinite(parsedCapo) || !Number.isInteger(parsedCapo) || parsedCapo < 0) {
        saveError.value = 'Capo musí být nezáporné celé číslo.';
        isSaving.value = false;
        return;
      }

      capoValue = parsedCapo;
    }

    try {
      const resolvedCategoryIds = await resolveSongCategoryIds(categoryLabelsToPersist.value);
      const songInput: CreateSongInput = {
        title: trimmedTitle.value,
        artist: trimmedArtist.value,
        text: songTextDraft.value.trim() || undefined,
        chords: [...songChordsDraft.value],
        ...(capoValue !== undefined ? { capo: capoValue } : {}),
        ownerId: user.value.uid,
      };

      const savedSong =
        isCreateMode.value || song.value == null
          ? await songStore.createSong(songInput)
          : await songStore.updateSong(song.value.id, songInput);

      const catalogEntryInput: SongCatalogEntryInput = {
        artist: savedSong.artist,
        chords: savedSong.chords,
        categories: resolvedCategoryIds,
        ownerId: savedSong.ownerId,
        sourceSongId: savedSong.id,
        title: savedSong.title,
      };

      if (isCreateMode.value) {
        await createSongCatalogEntry(catalogEntryInput);
      } else {
        const existingCatalogEntry = await fetchSongCatalogEntryBySourceSongId(savedSong.id);

        if (existingCatalogEntry != null) {
          await updateSongCatalogEntry(existingCatalogEntry.id, catalogEntryInput);
        } else {
          await createSongCatalogEntry(catalogEntryInput);
        }
      }

      song.value = savedSong;
      isInlineEditMode.value = false;
      editorViewMode.value = 'preview';

      if (isCreateMode.value) {
        await router.replace({ path: getSongPath(savedSong.id) });
      }
    } catch {
      saveError.value = isCreateMode.value
        ? 'Nepodařilo se vytvořit píseň. Zkus to prosím znovu.'
        : 'Nepodařilo se upravit píseň. Zkus to prosím znovu.';
    } finally {
      isSaving.value = false;
    }
  };

  const stopAutoScroll = () => {
    isAutoScrollPlaying.value = false;

    if (animationFrameId != null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    previousFrameTime = null;
    autoScrollPosition = null;
  };

  const autoScrollStep = (timestamp: number) => {
    if (!isAutoScrollPlaying.value) {
      return;
    }

    if (previousFrameTime == null) {
      previousFrameTime = timestamp;
    }

    const elapsedSeconds = (timestamp - previousFrameTime) / 1000;
    previousFrameTime = timestamp;

    if (autoScrollPosition == null) {
      autoScrollPosition = getCurrentScrollTop();
    }

    const maxTop = getMaxScrollTop();
    const nextTop = Math.min(autoScrollPosition + autoScrollSpeed.value * elapsedSeconds, maxTop);
    autoScrollPosition = nextTop;

    scrollToTop(nextTop, 'auto');

    if (nextTop >= maxTop - 1) {
      stopAutoScroll();
      return;
    }

    animationFrameId = requestAnimationFrame(autoScrollStep);
  };

  const startAutoScroll = () => {
    if (isAutoScrollPlaying.value) {
      return;
    }

    const sessionId = sessionStore.sessionDetails?.id;

    if (sessionId && song.value?.id) {
      updateActiveSongId(song.value?.id, sessionId);
    }

    isAutoScrollPlaying.value = true;
    previousFrameTime = null;
    autoScrollPosition = getCurrentScrollTop();
    animationFrameId = requestAnimationFrame(autoScrollStep);
  };

  const toggleAutoScroll = () => {
    if (isAutoScrollPlaying.value) {
      stopAutoScroll();
      return;
    }

    startAutoScroll();
  };

  const scrollBackAndSlowDown = () => {
    autoScrollSpeed.value = Math.max(
      AUTO_SCROLL_MIN_SPEED,
      autoScrollSpeed.value - AUTO_SCROLL_SPEED_STEP
    );

    if (isAutoScrollPlaying.value) {
      scrollByDistance(-AUTO_SCROLL_SCROLL_STEP, 'smooth');
    }
  };

  const scrollForwardAndSpeedUp = () => {
    autoScrollSpeed.value = Math.min(
      AUTO_SCROLL_MAX_SPEED,
      autoScrollSpeed.value + AUTO_SCROLL_SPEED_STEP
    );

    if (isAutoScrollPlaying.value) {
      scrollByDistance(AUTO_SCROLL_SCROLL_STEP, 'smooth');
    }
  };

  const openChordsDialog = () => {
    isChordsDialogOpen.value = true;
  };

  const handleViewportChange = () => {
    syncScrollMetrics();
  };

  onMounted(() => {
    window.addEventListener('scroll', handleViewportChange, { passive: true, capture: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.visualViewport?.addEventListener('resize', handleViewportChange);

    void nextTick(() => {
      syncScrollMetrics();
    });
  });

  watch(
    [song, sections],
    async () => {
      await nextTick();
      syncScrollMetrics();
    },
    { deep: true }
  );

  watch(
    isCreateMode,
    (createMode) => {
      if (createMode) {
        void initializeCreateMode();
      } else {
        resetEditorState();
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    stopAutoScroll();
    window.removeEventListener('scroll', handleViewportChange, true);
    window.removeEventListener('resize', handleViewportChange);
    window.visualViewport?.removeEventListener('resize', handleViewportChange);
  });
</script>

<template>
  <TopNavigation
    :page-title="pageTitle"
    :page-subtitle="pageSubtitle"
    :fade-away="!isEditorMode && isAutoScrollPlaying"
    :back-to-path="isCreateMode ? Routes.SongLibrary : undefined"
  />

  <main
    ref="songPageRef"
    class="song-page"
  >
    <div class="song-shell">
      <div class="song-quick-nav">
        <Button
          v-if="isAuthenticated && song && !isEditorMode"
          class="edit-button"
          label="Upravit píseň"
          color-variation="Primary"
          style-variation="Outlined"
          :icon="{ position: 'prepend', component: Pencil }"
          type="button"
          @click="openInlineEditMode"
        />
      </div>

      <LoadingSpinner
        v-if="songLoading && !isCreateMode"
        label="Načítání písně..."
      />

      <ErrorMessage
        v-else-if="songError && !isCreateMode"
        :message="songError"
      />

      <section
        v-else-if="isEditorMode"
        class="song-content"
      >
        <section class="metadata-panel">
          <Field.Root class="field metadata-panel__field metadata-panel__field--wide">
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

          <Field.Root class="field metadata-panel__field metadata-panel__field--wide">
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

          <Field.Root class="field metadata-panel__field metadata-panel__field--wide">
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

          <Field.Root class="field metadata-panel__field metadata-panel__field--capo">
            <Field.Label class="field-label">Capo</Field.Label>
            <Field.Input
              v-model="songCapo"
              class="field-input"
              type="number"
              inputmode="numeric"
              min="0"
              placeholder="Např. 2"
            />
          </Field.Root>
        </section>

        <article class="song-body song-body--editor">
          <SongTextEditor
            v-model="songTextDraft"
            :mode="editorViewMode === 'source' ? 'source' : 'visual'"
            :show-toolbar="false"
            placeholder="[Verse]&#10;[G] Mama take this [D] badge off of [Am] me"
            @unique-chords="handleUniqueChordsChange"
          />
        </article>

        <p
          v-if="saveError"
          class="field-error"
          role="alert"
        >
          {{ saveError }}
        </p>
      </section>

      <section
        v-else-if="song"
        class="song-content"
      >
        <SongQuickInfo
          :capo="song.capo"
          :original-key="song.chords?.at(0)"
          :transpose="transpose"
        />

        <article class="song-body">
          <template v-if="sections.length > 0">
            <section
              v-for="(section, index) in sections"
              :key="`${section.type}-${index}`"
              class="song-section"
              :style="{ '--section-accent': SECTIONS_DICTIONARY[section.type].color }"
            >
              <h2 class="song-section-title">{{ SECTIONS_DICTIONARY[section.type].label }}</h2>
              <ChordLayoutRenderer
                class="song-text"
                :text="section.text"
                :transpose="transpose"
              />
            </section>
          </template>
          <ChordLayoutRenderer
            v-else
            class="song-text"
            :text="displaySongText"
            :transpose="transpose"
          />
        </article>
      </section>

      <section
        v-else
        class="song-empty-state"
      >
        <h1 class="song-empty-title">Píseň nebyla nalezena</h1>
        <p class="song-empty-text">Zkontrolujte odkaz nebo se vraťte na přehled písní.</p>
      </section>
    </div>

    <SongChordsDialog
      v-if="song && !isEditorMode"
      :open="isChordsDialogOpen"
      :chords="songChords"
      :transpose="transpose"
      @update:open="isChordsDialogOpen = $event"
      @update:transpose="transpose = $event"
    />

    <SongControls
      v-if="song || isEditorMode"
      :mode="isEditorMode ? 'edit' : 'view'"
      :is-playing="isAutoScrollPlaying"
      :auto-scroll-speed="autoScrollSpeed"
      :auto-scroll-eta-label="autoScrollEtaLabel"
      :editor-mode="editorViewMode"
      :confirm-disabled="isSubmitDisabled"
      @toggle-play="toggleAutoScroll"
      @step-back="scrollBackAndSlowDown"
      @step-forward="scrollForwardAndSpeedUp"
      @open-chords="openChordsDialog"
      @select-source="editorViewMode = 'source'"
      @select-preview="editorViewMode = 'preview'"
      @cancel="cancelEditing"
      @confirm="handleCreateOrUpdateSong"
    />
  </main>
</template>

<style scoped>
  .song-page {
    min-height: 100vh;
    background:
      radial-gradient(
        circle at top,
        color-mix(in srgb, var(--accent) 6%, transparent),
        transparent 35%
      ),
      var(--bg-primary);
    color: var(--text-primary);
  }

  .song-shell {
    width: min(100%, 760px);
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md)
      calc(var(--space-3xl) + 88px + env(safe-area-inset-bottom, 0px));
  }

  .edit-button {
    margin-bottom: var(--space-lg);
  }

  .song-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .metadata-panel {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--space-md);
    padding: var(--space-md);
    border: 1px solid color-mix(in srgb, var(--accent) 16%, var(--border-primary));
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--bg-secondary) 72%, transparent);
    box-shadow: var(--shadow-soft);
  }

  .metadata-panel__field {
    grid-column: span 12;
  }

  .metadata-panel__field--capo {
    grid-column: span 3;
  }

  .metadata-panel__field--wide {
    grid-column: span 9;
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

  .field-input {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .field-input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  .field-input[aria-invalid='true'] {
    border-color: var(--color-error);
  }

  .field-helper {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .field-error {
    font-size: 0.75rem;
    color: var(--color-error);
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
    width: 100%;
    padding-right: 34px;
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

  .song-body {
    --song-anchored-line-height: 4;
    --song-chord-font-size: var(--font-size-chords);
    --song-text-line-height: 4.25;
    --song-text-font-family: var(--font-chord);
    --song-text-font-size: var(--font-size-lyrics);
    --song-chord-inline-font-size: inherit;
    --song-chord-inline-font-family: var(--font-chord);
    --song-chord-inline-font-weight: inherit;
    --song-chord-inline-radius: 3px;
    overflow-x: auto;
  }

  .song-body--editor {
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--bg-secondary) 78%, var(--bg-primary));
    box-shadow: var(--shadow-panel);
  }

  .song-quick-nav {
    display: flex;
    justify-content: space-between;
  }

  .song-section {
    --section-accent: color-mix(in srgb, var(--accent) 35%, transparent);
    padding: 0;
    padding-left: var(--space-md);
    border-left: 1px solid color-mix(in srgb, var(--section-accent) 45%, transparent);
    border-left-width: 4px;
  }

  .song-section:not(:last-child) {
    margin-bottom: var(--space-md);
  }

  .song-section-title {
    margin: 0 0 var(--space-sm);
    font-size: 13px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .song-text {
    --song-text-color: var(--text-chord);
    margin: 0;
    font-family: var(--song-text-font-family);
    font-size: var(--song-text-font-size);
    line-height: var(--song-text-line-height);
  }

  .song-preview-empty {
    padding: var(--space-xl);
    text-align: center;
    color: var(--text-secondary);
    border: 2px dashed var(--border-primary);
    border-radius: var(--radius-sm);
  }

  .song-empty-state {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-xl) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
  }

  .song-empty-title {
    font-size: 24px;
    font-weight: 600;
  }

  .song-empty-text {
    color: var(--text-secondary);
    font-size: 16px;
    line-height: 1.6;
  }

  @media (max-width: 767px) {
    .metadata-panel {
      grid-template-columns: 1fr;
    }

    .metadata-panel__field,
    .metadata-panel__field--capo,
    .metadata-panel__field--wide {
      grid-column: auto;
    }
  }
</style>
