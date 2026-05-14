import { computed, ref, watch, type Ref } from 'vue';
import { extractUniqueChords } from '../lib/songTextEditor/chords';
import {
  insertSectionIntoMarkdown,
  removeSectionFromMarkdown,
  type ParsedSection,
  type SectionType,
  updateSectionTextInMarkdown,
  updateSectionTypeInMarkdown,
} from '../lib/songTextEditor/sections';

interface UseSongTextEditorStateOptions {
  modelValue: Ref<string>;
  onModelValueChange: (value: string) => void;
  onUniqueChordsChange: (value: string[]) => void;
}

export function useSongTextEditorState(options: UseSongTextEditorStateOptions) {
  const rawMarkdown = ref(options.modelValue.value);
  const isVisualMode = ref(true);
  const addSectionAfterIndex = ref<number | null>(null);

  const uniqueChords = computed(() => extractUniqueChords(rawMarkdown.value));

  const syncMarkdown = (nextMarkdown: string) => {
    rawMarkdown.value = nextMarkdown;
    options.onModelValueChange(nextMarkdown);
    options.onUniqueChordsChange(extractUniqueChords(nextMarkdown));
  };

  watch(
    options.modelValue,
    (nextValue) => {
      rawMarkdown.value = nextValue;
      options.onUniqueChordsChange(extractUniqueChords(nextValue));
    },
    { immediate: true }
  );

  const closeAddSectionPicker = () => {
    addSectionAfterIndex.value = null;
  };

  const openAddSectionPicker = (afterIndex: number) => {
    addSectionAfterIndex.value = addSectionAfterIndex.value === afterIndex ? null : afterIndex;
  };

  const insertSection = (afterIndex: number, type: SectionType, sections: ParsedSection[]) => {
    const nextMarkdown = insertSectionIntoMarkdown(rawMarkdown.value, sections, afterIndex, type);
    syncMarkdown(nextMarkdown);
    closeAddSectionPicker();
  };

  const updateSectionText = (section: ParsedSection, text: string) => {
    const nextMarkdown = updateSectionTextInMarkdown(rawMarkdown.value, section, text);
    syncMarkdown(nextMarkdown);
  };

  const updateSectionType = (section: ParsedSection, type: SectionType) => {
    const nextMarkdown = updateSectionTypeInMarkdown(rawMarkdown.value, section, type);
    syncMarkdown(nextMarkdown);
  };

  const removeSection = (section: ParsedSection) => {
    const nextMarkdown = removeSectionFromMarkdown(rawMarkdown.value, section);
    syncMarkdown(nextMarkdown);
    closeAddSectionPicker();
  };

  const handleMarkdownInput = () => {
    syncMarkdown(rawMarkdown.value);
  };

  const toggleMode = () => {
    if (!isVisualMode.value) {
      syncMarkdown(rawMarkdown.value);
    }

    isVisualMode.value = !isVisualMode.value;
  };

  return {
    addSectionAfterIndex,
    closeAddSectionPicker,
    handleMarkdownInput,
    insertSection,
    isVisualMode,
    openAddSectionPicker,
    rawMarkdown,
    removeSection,
    toggleMode,
    uniqueChords,
    updateSectionText,
    updateSectionType,
  };
}
