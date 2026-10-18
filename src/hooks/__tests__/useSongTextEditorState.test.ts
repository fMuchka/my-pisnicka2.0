import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSongTextEditorState } from '../useSongTextEditorState';
import { parseMarkdownSections } from '../../lib/songTextEditor/sections';

function renderEditorState(initialValue: string) {
  const onValueChange = vi.fn();
  const onUniqueChordsChange = vi.fn();

  const hook = renderHook(
    ({ value }) => useSongTextEditorState({ value, onValueChange, onUniqueChordsChange }),
    { initialProps: { value: initialValue } }
  );

  return { ...hook, onValueChange, onUniqueChordsChange };
}

describe('useSongTextEditorState', () => {
  it('inserts section and emits updated markdown and unique chords', () => {
    const { result, onValueChange, onUniqueChordsChange } = renderEditorState('[verse]\n[G] line');
    const sections = parseMarkdownSections(result.current.rawMarkdown);

    act(() => result.current.insertSection(0, 'chorus', sections));

    expect(result.current.rawMarkdown).toContain('[chorus]');
    expect(onValueChange).toHaveBeenCalled();
    expect(onUniqueChordsChange).toHaveBeenCalled();
  });

  it('syncs local markdown from external value changes', () => {
    const { result, rerender } = renderEditorState('[verse]\nA line');

    rerender({ value: '[chorus]\nB line' });

    expect(result.current.rawMarkdown).toBe('[chorus]\nB line');
  });

  it('removes section and emits updated markdown', () => {
    const { result, onValueChange } = renderEditorState('[verse]\nA line\n\n[chorus]\nB line');
    const sections = parseMarkdownSections(result.current.rawMarkdown);
    const firstSection = sections[0];

    if (!firstSection) {
      throw new Error('Expected first section to exist');
    }

    act(() => result.current.removeSection(firstSection));

    expect(result.current.rawMarkdown).not.toContain('[verse]');
    expect(result.current.rawMarkdown).toContain('[chorus]');
    expect(onValueChange).toHaveBeenCalled();
  });
});
