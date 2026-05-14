import { normalizeChord } from '../chords/chords';

const STORED_CHORD_PATTERN = /\[([^\]]+)\]/g;
const BRACKETED_VISUAL_PATTERN = /\[([^\]\s][^\]]*)\]/g;

function sanitizeToken(token: string): string {
  return token
    .trim()
    .replace(/^[`"'“”‘’([{]+/, '')
    .replace(/[`"'“”‘’)\]},.!?:;]+$/, '');
}

function isPlainChordCandidate(token: string): boolean {
  return /^[A-GH]/.test(token);
}

export function toVisualChordText(text: string): string {
  return text.replace(STORED_CHORD_PATTERN, '$1').replace(BRACKETED_VISUAL_PATTERN, '$1');
}

export function extractUniqueChords(text: string): string[] {
  const uniqueChords = new Set<string>();

  // Extract from stored bracket format first (handles [C]mama without a separating space)
  for (const match of text.matchAll(STORED_CHORD_PATTERN)) {
    const chord = match[1] ? normalizeChord(match[1]) : null;
    if (chord) {
      uniqueChords.add(chord);
    }
  }

  // Also extract plain visual chords (for text without bracket notation).
  const normalized = toVisualChordText(text);
  for (const match of normalized.matchAll(/\S+/g)) {
    const token = sanitizeToken(match[0] ?? '');
    if (!isPlainChordCandidate(token)) {
      continue;
    }

    const chord = normalizeChord(token);
    if (chord) {
      uniqueChords.add(chord);
    }
  }

  return Array.from(uniqueChords);
}
