import { describe, expect, it } from 'vitest';
import {
  fromEditorDoc,
  getRenderParts,
  toEditorDoc,
} from '../songTextEditor/editableChordDocument';

describe('editableChordDocument', () => {
  it('marks only supported bracket chords', () => {
    const parts = getRenderParts('[G] line [Gsus4] no [Hm7] end');

    const marked = parts.filter((part) => part.chord).map((part) => part.chord);
    expect(marked).toEqual(['G', 'Hm7']);
  });

  it('round-trips text through editor doc conversion', () => {
    const text = '[G] Mama take this [D/F#] badge off [Hm7] me';
    const doc = toEditorDoc(text);
    const roundTripped = fromEditorDoc(doc);

    expect(roundTripped).toContain('[G]');
    expect(roundTripped).toContain('[D/F#]');
    expect(roundTripped).toContain('[Hm7]');
    expect(roundTripped).toContain('Mama take this');
  });

  it('keeps unsupported bracket tokens as plain text', () => {
    const text = '[Gsus4] still text';
    const doc = toEditorDoc(text);

    expect(fromEditorDoc(doc)).toBe('[Gsus4] still text');
  });
});
