import { describe, expect, it } from 'vitest';
import { sameSpot, stepCaret, type LineRef } from '../caret';

// Two sections: a 5-character line and a 2-character one, then a 10-character line.
const lines: LineRef[] = [
  { section: 0, line: 0, length: 5 },
  { section: 0, line: 1, length: 2 },
  { section: 1, line: 0, length: 10 },
];

describe('stepCaret', () => {
  it('moves along the line, stopping at its start and end', () => {
    expect(stepCaret(lines, { section: 0, line: 0, offset: 2 }, 'ArrowRight')?.offset).toBe(3);
    expect(stepCaret(lines, { section: 0, line: 0, offset: 5 }, 'ArrowRight')?.offset).toBe(5);
    expect(stepCaret(lines, { section: 0, line: 0, offset: 0 }, 'ArrowLeft')?.offset).toBe(0);
  });

  it('moves between lines and sections, keeping the offset where it fits', () => {
    expect(stepCaret(lines, { section: 0, line: 0, offset: 4 }, 'ArrowDown')).toEqual({
      section: 0,
      line: 1,
      offset: 2,
    });
    expect(stepCaret(lines, { section: 0, line: 1, offset: 1 }, 'ArrowDown')).toEqual({
      section: 1,
      line: 0,
      offset: 1,
    });
    expect(stepCaret(lines, { section: 1, line: 0, offset: 8 }, 'ArrowUp')).toEqual({
      section: 0,
      line: 1,
      offset: 2,
    });
  });

  it('stays put at the first and last line', () => {
    const first = { section: 0, line: 0, offset: 1 };
    expect(stepCaret(lines, first, 'ArrowUp')).toEqual(first);
  });

  it('ignores other keys', () => {
    expect(stepCaret(lines, { section: 0, line: 0, offset: 1 }, 'a')).toBeNull();
  });
});

describe('sameSpot', () => {
  it('compares spots', () => {
    expect(sameSpot({ section: 0, line: 1, offset: 2 }, { section: 0, line: 1, offset: 2 })).toBe(
      true
    );
    expect(sameSpot(null, { section: 0, line: 0, offset: 0 })).toBe(false);
  });
});
