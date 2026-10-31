/** A spot in the song: before the character at `offset`, or the line end when offset is its length. */
export type Spot = { section: number; line: number; offset: number };

/** A line, in reading order across all sections, with how many characters it has. */
export type LineRef = { section: number; line: number; length: number };

export const sameSpot = (a: Spot | null, b: Spot) =>
  a?.section === b.section && a.line === b.line && a.offset === b.offset;

/**
 * Where an arrow key moves the caret: along the line (up to its end), or to the line above or
 * below, across sections, keeping the offset where it fits. null for any other key.
 */
export function stepCaret(lines: LineRef[], current: Spot, key: string): Spot | null {
  const position = lines.findIndex(
    (ref) => ref.section === current.section && ref.line === current.line
  );
  const line = lines[position];
  if (!line) return null;

  const toLine = (target: LineRef | undefined) =>
    target
      ? {
          section: target.section,
          line: target.line,
          offset: Math.min(current.offset, target.length),
        }
      : current;

  switch (key) {
    case 'ArrowRight':
      return { ...current, offset: Math.min(current.offset + 1, line.length) };
    case 'ArrowLeft':
      return { ...current, offset: Math.max(current.offset - 1, 0) };
    case 'ArrowDown':
      return toLine(lines[position + 1]);
    case 'ArrowUp':
      return toLine(lines[position - 1]);
    default:
      return null;
  }
}
