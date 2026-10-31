import { parseLine, type DocumentLine, type PlacedChord } from './songDocument';

// When lyrics are edited (where the chords aren't shown), the chords should stay with the letters
// they were above. Edits in a textarea are one contiguous change at a time, so comparing the
// unchanged start and end of the old and new text finds what changed.

const commonPrefixLength = (a: string, b: string) => {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length++;
  return length;
};

/** Common end of a and b, not overlapping the first `prefix` characters of either. */
const commonSuffixLength = (a: string, b: string, prefix: number) => {
  let length = 0;
  while (
    length < a.length - prefix &&
    length < b.length - prefix &&
    a[a.length - 1 - length] === b[b.length - 1 - length]
  ) {
    length++;
  }
  return length;
};

/**
 * Moves the chords of `oldLyrics` onto `newLyrics`: chords before the change stay, chords after it
 * shift with their letters, and a chord whose letter was deleted lands where the change starts.
 */
export function remapLineChords(
  oldLyrics: string,
  newLyrics: string,
  chords: PlacedChord[]
): PlacedChord[] {
  if (oldLyrics === newLyrics) return chords;

  const prefix = commonPrefixLength(oldLyrics, newLyrics);
  const suffix = commonSuffixLength(oldLyrics, newLyrics, prefix);
  const changeEndOld = oldLyrics.length - suffix;
  const shift = newLyrics.length - oldLyrics.length;

  const remapped = chords.map(({ offset, chord }) => {
    // A chord belongs to the letter after it, so one right at the change's end moves with it.
    if (offset >= changeEndOld) return { offset: offset + shift, chord };
    if (offset < prefix) return { offset, chord };
    return { offset: prefix, chord };
  });

  // Two chords squeezed onto one spot by a deletion: keep the later one, like retyping over it.
  const byOffset = new Map(remapped.map((placed) => [placed.offset, placed]));
  return [...byOffset.values()].sort((a, b) => a.offset - b.offset);
}

const shiftChords = (chords: PlacedChord[], by: number) =>
  chords.map(({ offset, chord }) => ({ offset: offset + by, chord }));

/**
 * The section's lines after its lyrics were edited to `newText`, keeping each chord with its
 * letters. Untouched lines keep their chords as they are; a line split with Enter takes its chords
 * along to both halves, and joining two lines merges theirs.
 */
export function remapSectionLines(oldLines: DocumentLine[], newText: string): DocumentLine[] {
  const newLyrics = newText.split('\n');
  const oldLyrics = oldLines.map((line) => line.lyrics);

  let start = 0;
  while (
    start < oldLyrics.length &&
    start < newLyrics.length &&
    oldLyrics[start] === newLyrics[start]
  ) {
    start++;
  }

  let end = 0;
  while (
    end < oldLyrics.length - start &&
    end < newLyrics.length - start &&
    oldLyrics[oldLyrics.length - 1 - end] === newLyrics[newLyrics.length - 1 - end]
  ) {
    end++;
  }

  const oldChanged = oldLines.slice(start, oldLines.length - end);
  const newChanged = newLyrics.slice(start, newLyrics.length - end);

  return [
    ...oldLines.slice(0, start),
    ...remapChangedLines(oldChanged, newChanged),
    ...oldLines.slice(oldLines.length - end),
  ];
}

function remapChangedLines(oldLines: DocumentLine[], newLyrics: string[]): DocumentLine[] {
  // Enter pressed inside a line: its old text, with the line break taken out, is the two new lines.
  const [only] = oldLines;
  const [first = '', second = ''] = newLyrics;
  if (oldLines.length === 1 && newLyrics.length === 2 && only) {
    const joined = first + second;
    const chords = remapLineChords(only.lyrics, joined, only.chords);

    return [
      { lyrics: first, chords: chords.filter(({ offset }) => offset < first.length) },
      {
        lyrics: second,
        chords: shiftChords(
          chords.filter(({ offset }) => offset >= first.length),
          -first.length
        ),
      },
    ];
  }

  // Backspace at a line start: the two old lines, run together, are the new one.
  const [top, bottom] = oldLines;
  if (oldLines.length === 2 && newLyrics.length === 1 && top && bottom) {
    const joinedLine: DocumentLine = {
      lyrics: top.lyrics + bottom.lyrics,
      chords: [...top.chords, ...shiftChords(bottom.chords, top.lyrics.length)],
    };

    return [
      {
        lyrics: first,
        chords: remapLineChords(joinedLine.lyrics, first, joinedLine.chords),
      },
    ];
  }

  // Anything else (a paste over several lines, say): pair the lines up in order. New lines beyond
  // the old ones start without chords; chords of removed lines go with them.
  return newLyrics.map((lyrics, index) => {
    const old = oldLines[index];
    return old
      ? { lyrics, chords: remapLineChords(old.lyrics, lyrics, old.chords) }
      : parseLine(lyrics);
  });
}
