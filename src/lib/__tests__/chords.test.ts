import { describe, expect, it } from 'vitest';
import { transposeChord } from '../chords';

describe('transposeChord', () => {
  it('returns original chord for zero shift', () => {
    expect(transposeChord('G', 0)).toBe('G');
  });

  it('transposes basic chords up', () => {
    expect(transposeChord('G', 2)).toBe('A');
    expect(transposeChord('Am', 2)).toBe('Hm');
  });

  it('transposes chords with slash bass notes', () => {
    expect(transposeChord('D/F#', 2)).toBe('E/G#');
    expect(transposeChord('Am/C', 3)).toBe('Cm/D#');
  });

  it('supports Czech B and H notation', () => {
    expect(transposeChord('B', 1)).toBe('H');
    expect(transposeChord('H', 1)).toBe('C');
  });

  it('supports negative transposition', () => {
    expect(transposeChord('C', -2)).toBe('B');
  });

  it('keeps unknown tokens unchanged', () => {
    expect(transposeChord('N.C.', 3)).toBe('N.C.');
  });
});
