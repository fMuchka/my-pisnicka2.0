import type { JSONContent } from '@tiptap/core';
import { normalizeChord } from '../chords/chords';

export interface RenderPart {
  text: string;
  chord?: string;
}

function isChordToken(token: string): boolean {
  return normalizeChord(token) !== null;
}

function chordValue(token: string): string {
  return normalizeChord(token) ?? token.trim().replace(/^\[|\]$/g, '');
}

function standaloneChordPlaceholder(chord: string): string {
  return ' '.repeat(Math.max(chord.length, 1));
}

export function getRenderParts(line: string): RenderPart[] {
  const parts: RenderPart[] = [];
  let index = 0;
  let pendingChord: string | undefined;

  while (index < line.length) {
    const chordMatch = line.slice(index).match(/^\[[^\]]+\]/);

    if (chordMatch && isChordToken(chordMatch[0])) {
      if (pendingChord) {
        parts.push({
          chord: pendingChord,
          text: standaloneChordPlaceholder(pendingChord),
        });
      }

      pendingChord = chordValue(chordMatch[0]);
      index += chordMatch[0].length;
      continue;
    }

    if (pendingChord) {
      const whitespaceMatch = line.slice(index).match(/^\s+/);

      if (whitespaceMatch) {
        parts.push({ text: whitespaceMatch[0] });
        index += whitespaceMatch[0].length;
        continue;
      }

      const anchoredMatch = line.slice(index).match(/^[^\s[]+/);

      if (anchoredMatch) {
        parts.push({
          chord: pendingChord,
          text: anchoredMatch[0],
        });
        pendingChord = undefined;
        index += anchoredMatch[0].length;
        continue;
      }

      parts.push({ text: '[' });
      pendingChord = undefined;
      index += 1;
      continue;
    }

    const nextChordIndex = line.indexOf('[', index);
    const plainTextEnd = nextChordIndex === -1 ? line.length : nextChordIndex;

    if (plainTextEnd > index) {
      parts.push({ text: line.slice(index, plainTextEnd) });
      index = plainTextEnd;
      continue;
    }

    parts.push({ text: line[index] ?? '' });
    index += 1;
  }

  if (pendingChord) {
    parts.push({
      chord: pendingChord,
      text: standaloneChordPlaceholder(pendingChord),
    });
  }

  return parts;
}

export function toEditorDoc(text: string): JSONContent {
  const lines = text.split('\n').map((line) => getRenderParts(line));

  return {
    type: 'doc',
    content: lines.map((line) => ({
      type: 'paragraph',
      content: line
        .filter((part) => part.text.length > 0)
        .map((part) => {
          if (!part.chord) {
            return {
              type: 'text',
              text: part.text,
            };
          }

          return {
            type: 'text',
            text: ` ${part.text} `,
            marks: [{ type: 'chord', attrs: { chord: part.chord } }],
          };
        }),
    })),
  };
}

export function fromEditorDoc(content: JSONContent): string {
  const lines = (content.content ?? []).map((block) => {
    if (block.type !== 'paragraph') {
      return '';
    }

    let value = '';
    for (const node of block.content ?? []) {
      if (node.type === 'hardBreak') {
        value += '\n';
        continue;
      }

      if (node.type !== 'text') {
        continue;
      }

      const chordMark = node.marks?.find((mark) => mark.type === 'chord');
      const chord = chordMark?.attrs?.chord;

      if (typeof chord === 'string' && chord.length > 0) {
        value += `[${chord}]`;
      }

      value += node.text ?? '';
    }

    return value;
  });

  return lines.join('\n');
}
