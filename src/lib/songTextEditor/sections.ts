import {
  SECTION_TYPE_OPTIONS,
  SECTIONS_DICTIONARY,
  type SectionTypes,
} from '../sections/sectionsDictionary';

export type SectionType = SectionTypes;

export interface ParsedSection {
  type: SectionType;
  text: string;
  startLine: number;
  endLine: number;
}

export const sectionTypeOptions = SECTION_TYPE_OPTIONS;

export function sectionHeading(type: SectionType): string {
  return `[${type}]`;
}

export function sectionLabel(type: SectionType): string {
  return SECTIONS_DICTIONARY[type].label;
}

export function sectionOptionStyle(type: SectionType): Record<string, string> {
  return {
    '--section-option-accent': SECTIONS_DICTIONARY[type].color,
  };
}

function normalizeSectionToken(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('cs-CZ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseSectionHeadingType(line: string): SectionType | null {
  const match = line.match(/^\s*\[([^\]]+?)\]\s*$/);
  if (!match?.[1]) {
    return null;
  }

  const token = match[1].replace(/\s+\d+\s*$/, '').trim();
  const normalizedToken = normalizeSectionToken(token);

  for (const type of sectionTypeOptions) {
    if (normalizeSectionToken(type) === normalizedToken) {
      return type;
    }

    if (normalizeSectionToken(sectionLabel(type)) === normalizedToken) {
      return type;
    }
  }

  return null;
}

export function parseMarkdownSections(markdown: string): ParsedSection[] {
  if (!markdown.trim()) {
    return [];
  }

  const lines = markdown.split('\n');
  const parsed: ParsedSection[] = [];
  let currentType: SectionType | null = null;
  let currentLines: string[] = [];
  let sectionStartLine = 0;

  const pushSection = (endLine: number) => {
    if (!currentType) {
      return;
    }

    parsed.push({
      type: currentType,
      text: currentLines.join('\n'),
      startLine: sectionStartLine,
      endLine,
    });
  };

  for (const [lineIndex, line] of lines.entries()) {
    const detectedType = parseSectionHeadingType(line);

    if (detectedType) {
      pushSection(lineIndex);
      currentType = detectedType;
      currentLines = [];
      sectionStartLine = lineIndex + 1;
      continue;
    }

    if (currentType) {
      currentLines.push(line);
    }
  }

  pushSection(lines.length);

  return parsed;
}

export function insertSectionIntoMarkdown(
  markdown: string,
  sections: ParsedSection[],
  afterIndex: number,
  type: SectionType
): string {
  const markdownLines = markdown.length > 0 ? markdown.split('\n') : [];
  const insertAt =
    afterIndex >= 0
      ? (sections[afterIndex]?.endLine ?? markdownLines.length)
      : markdownLines.length;

  const insertion: string[] = [];
  const prevLine = markdownLines[insertAt - 1];
  const nextLine = markdownLines[insertAt];

  if (insertAt > 0 && prevLine && prevLine.trim().length > 0) {
    insertion.push('');
  }

  insertion.push(sectionHeading(type), '');

  if (nextLine && nextLine.trim().length > 0) {
    insertion.push('');
  }

  markdownLines.splice(insertAt, 0, ...insertion);
  return markdownLines.join('\n');
}

export function updateSectionTextInMarkdown(
  markdown: string,
  section: ParsedSection,
  updatedSectionText: string
): string {
  const markdownLines = markdown.split('\n');
  const nextSectionLines = updatedSectionText.split('\n');

  markdownLines.splice(
    section.startLine,
    Math.max(0, section.endLine - section.startLine),
    ...nextSectionLines
  );

  return markdownLines.join('\n');
}

export function updateSectionTypeInMarkdown(
  markdown: string,
  section: ParsedSection,
  nextType: SectionType
): string {
  const markdownLines = markdown.split('\n');
  const headingLineIndex = Math.max(0, section.startLine - 1);

  if (headingLineIndex >= markdownLines.length) {
    return markdown;
  }

  markdownLines[headingLineIndex] = sectionHeading(nextType);
  return markdownLines.join('\n');
}

export function removeSectionFromMarkdown(markdown: string, section: ParsedSection): string {
  const markdownLines = markdown.split('\n');
  const headingLineIndex = Math.max(0, section.startLine - 1);
  const deleteCount = Math.max(1, section.endLine - headingLineIndex);

  markdownLines.splice(headingLineIndex, deleteCount);

  // Remove a single extra blank line if section removal created double separators.
  if (
    headingLineIndex > 0 &&
    headingLineIndex < markdownLines.length &&
    markdownLines[headingLineIndex - 1]?.trim() === '' &&
    markdownLines[headingLineIndex]?.trim() === ''
  ) {
    markdownLines.splice(headingLineIndex, 1);
  }

  return markdownLines.join('\n').trim();
}
