import { describe, expect, it } from 'vitest';
import {
  insertSectionIntoMarkdown,
  parseMarkdownSections,
  removeSectionFromMarkdown,
  updateSectionTextInMarkdown,
  updateSectionTypeInMarkdown,
} from '../songTextEditor/sections';

describe('songTextEditor/sections', () => {
  it('parses Czech labels and canonical section headings', () => {
    const markdown = ['[Sloka]', 'A line', '', '[chorus]', 'Refrain line'].join('\n');

    const sections = parseMarkdownSections(markdown);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.type).toBe('verse');
    expect(sections[0]?.text).toBe('A line\n');
    expect(sections[1]?.type).toBe('chorus');
    expect(sections[1]?.text).toBe('Refrain line');
  });

  it('inserts a section after selected section index', () => {
    const markdown = ['[verse]', 'Line one', '', '[chorus]', 'Line two'].join('\n');
    const sections = parseMarkdownSections(markdown);

    const result = insertSectionIntoMarkdown(markdown, sections, 0, 'bridge');

    expect(result).toContain('[bridge]');
    expect(result.indexOf('[bridge]')).toBeLessThan(result.indexOf('[chorus]'));
  });

  it('updates section body and heading', () => {
    const markdown = ['[verse]', 'Old line', '', '[chorus]', 'Refrain'].join('\n');
    const sections = parseMarkdownSections(markdown);
    const firstSection = sections[0];

    if (!firstSection) {
      throw new Error('Expected first section to exist');
    }

    const withUpdatedText = updateSectionTextInMarkdown(markdown, firstSection, 'New line');
    const updatedSections = parseMarkdownSections(withUpdatedText);
    const updatedFirstSection = updatedSections[0];

    if (!updatedFirstSection) {
      throw new Error('Expected first updated section to exist');
    }

    const withUpdatedType = updateSectionTypeInMarkdown(
      withUpdatedText,
      updatedFirstSection,
      'intro'
    );

    expect(withUpdatedText).toContain('New line');
    expect(withUpdatedType.startsWith('[intro]')).toBe(true);
  });

  it('removes selected section from markdown', () => {
    const markdown = ['[verse]', 'Line one', '', '[chorus]', 'Line two'].join('\n');
    const sections = parseMarkdownSections(markdown);
    const firstSection = sections[0];

    if (!firstSection) {
      throw new Error('Expected first section to exist');
    }

    const result = removeSectionFromMarkdown(markdown, firstSection);

    expect(result).not.toContain('[verse]');
    expect(result).toContain('[chorus]');
  });
});
