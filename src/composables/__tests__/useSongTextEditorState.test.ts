import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref, type Ref } from 'vue';
import { render } from '@testing-library/vue';
import { useSongTextEditorState } from '../useSongTextEditorState';
import { parseMarkdownSections } from '../../lib/songTextEditor/sections';

function mountComposable(modelValue: Ref<string>) {
  let state: ReturnType<typeof useSongTextEditorState> | null = null;

  const onModelValueChange = vi.fn();
  const onUniqueChordsChange = vi.fn();

  const Harness = defineComponent({
    setup() {
      state = useSongTextEditorState({
        modelValue,
        onModelValueChange,
        onUniqueChordsChange,
      });

      return () => null;
    },
  });

  render(Harness);

  if (state == null) {
    throw new Error('Composable state was not initialized');
  }

  return {
    onModelValueChange,
    onUniqueChordsChange,
    state: state as ReturnType<typeof useSongTextEditorState>,
  };
}

describe('useSongTextEditorState', () => {
  it('inserts section and emits updated markdown and unique chords', () => {
    const modelValue = ref('[verse]\n[G] line');
    const { state, onModelValueChange, onUniqueChordsChange } = mountComposable(modelValue);
    const sections = parseMarkdownSections(state.rawMarkdown.value);

    state.insertSection(0, 'chorus', sections);

    expect(state.rawMarkdown.value).toContain('[chorus]');
    expect(onModelValueChange).toHaveBeenCalled();
    expect(onUniqueChordsChange).toHaveBeenCalled();
  });

  it('syncs local markdown from external model value changes', async () => {
    const modelValue = ref('[verse]\nA line');
    const { state } = mountComposable(modelValue);

    modelValue.value = '[chorus]\nB line';
    await nextTick();

    expect(state.rawMarkdown.value).toBe('[chorus]\nB line');
  });

  it('removes section and emits updated markdown', () => {
    const modelValue = ref('[verse]\nA line\n\n[chorus]\nB line');
    const { state, onModelValueChange } = mountComposable(modelValue);
    const sections = parseMarkdownSections(state.rawMarkdown.value);
    const firstSection = sections[0];

    if (!firstSection) {
      throw new Error('Expected first section to exist');
    }

    state.removeSection(firstSection);

    expect(state.rawMarkdown.value).not.toContain('[verse]');
    expect(state.rawMarkdown.value).toContain('[chorus]');
    expect(onModelValueChange).toHaveBeenCalled();
  });
});
