import { describe, expect, it } from 'vitest';
import { isSupportedChord, normalizeChord, transposeChord } from '../chords/chords';

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

describe('database-backed chord validation', () => {
  it('accepts only chords built from configured roots and qualities', () => {
    expect(isSupportedChord('C')).toBe(true);
    expect(isSupportedChord('Hm7')).toBe(true);
    expect(isSupportedChord('D/F#')).toBe(true);

    expect(isSupportedChord('Csus4')).toBe(false);
    expect(isSupportedChord('Hm9')).toBe(false);
    expect(isSupportedChord('BmMaj7')).toBe(false);
  });

  it('normalizes bracketed tokens to canonical chord values', () => {
    expect(normalizeChord('[g]')).toBe('G');
    expect(normalizeChord('[dbm7]')).toBe('Dbm7');
    expect(normalizeChord('[Gsus4]')).toBeNull();
  });
});
