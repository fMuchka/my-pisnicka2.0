import { useEffect, useEffectEvent, useMemo, useState } from 'react';
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
  value: string;
  onValueChange: (value: string) => void;
  onUniqueChordsChange: (value: string[]) => void;
}

export function useSongTextEditorState(options: UseSongTextEditorStateOptions) {
  const { value, onValueChange, onUniqueChordsChange } = options;
  const [rawMarkdown, setRawMarkdown] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [isVisualMode, setIsVisualMode] = useState(true);
  const [addSectionAfterIndex, setAddSectionAfterIndex] = useState<number | null>(null);

  // A new value from the parent replaces local edits; adjusting state during render avoids a stale frame.
  if (value !== previousValue) {
    setPreviousValue(value);
    setRawMarkdown(value);
  }

  const uniqueChords = useMemo(() => extractUniqueChords(rawMarkdown), [rawMarkdown]);

  const reportUniqueChords = useEffectEvent((markdown: string) => {
    onUniqueChordsChange(extractUniqueChords(markdown));
  });

  useEffect(() => {
    reportUniqueChords(value);
  }, [value]);

  const syncMarkdown = (nextMarkdown: string) => {
    setRawMarkdown(nextMarkdown);
    onValueChange(nextMarkdown);
    onUniqueChordsChange(extractUniqueChords(nextMarkdown));
  };

  const closeAddSectionPicker = () => {
    setAddSectionAfterIndex(null);
  };

  const openAddSectionPicker = (afterIndex: number) => {
    setAddSectionAfterIndex((current) => (current === afterIndex ? null : afterIndex));
  };

  const insertSection = (afterIndex: number, type: SectionType, sections: ParsedSection[]) => {
    syncMarkdown(insertSectionIntoMarkdown(rawMarkdown, sections, afterIndex, type));
    closeAddSectionPicker();
  };

  const updateSectionText = (section: ParsedSection, text: string) => {
    syncMarkdown(updateSectionTextInMarkdown(rawMarkdown, section, text));
  };

  const updateSectionType = (section: ParsedSection, type: SectionType) => {
    syncMarkdown(updateSectionTypeInMarkdown(rawMarkdown, section, type));
  };

  const removeSection = (section: ParsedSection) => {
    syncMarkdown(removeSectionFromMarkdown(rawMarkdown, section));
    closeAddSectionPicker();
  };

  /** For the raw markdown <textarea>'s onChange. */
  const handleMarkdownInput = (nextMarkdown: string) => {
    syncMarkdown(nextMarkdown);
  };

  const toggleMode = () => {
    if (!isVisualMode) {
      syncMarkdown(rawMarkdown);
    }

    setIsVisualMode(!isVisualMode);
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
