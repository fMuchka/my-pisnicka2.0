import { describe, expect, it } from 'vitest';
import {
  formatTimelineDate,
  getRecentNewChanges,
  getUnseenReleaseDates,
  groupChangesByType,
  summarizeChanges,
  type TimelineChange,
  type TimelineEntry,
} from '../timeline/timeline';

const change = (type: TimelineChange['type'], text = 'změna'): TimelineChange => ({
  type,
  text,
  details: null,
});

const ENTRIES: TimelineEntry[] = [
  {
    kind: 'release',
    date: '2026-08-05',
    label: '5. srpna 2026',
    title: null,
    changes: [change('new', 'A'), change('fix')],
  },
  {
    kind: 'release',
    date: '2026-07-19',
    label: '19. července 2026',
    title: null,
    changes: [change('new', 'B'), change('new', 'C')],
  },
  {
    kind: 'milestone',
    date: '2025-09',
    label: 'Září 2025',
    title: 'Start',
    text: '',
    link: null,
  },
];

describe('formatTimelineDate', () => {
  it('formats a full date in Czech genitive', () => {
    expect(formatTimelineDate('2026-08-05')).toBe('5. srpna 2026');
  });

  it('formats a month-only date with a capital letter', () => {
    expect(formatTimelineDate('2025-09')).toBe('Září 2025');
  });
});

describe('groupChangesByType', () => {
  it('orders groups new → improved → fix and puts untyped changes last without a label', () => {
    const groups = groupChangesByType([change(null), change('fix'), change('new')]);

    expect(groups.map((group) => group.type)).toEqual(['new', 'fix', null]);
    expect(groups.at(-1)?.label).toBeNull();
  });
});

describe('summarizeChanges', () => {
  it('uses Czech plural forms per type', () => {
    expect(
      summarizeChanges([change('new'), change('new'), change('improved'), change('fix')])
    ).toBe('2 nové · 1 vylepšení · 1 oprava');
    expect(summarizeChanges(Array.from({ length: 5 }, () => change('fix')))).toBe('5 oprav');
  });

  it('counts plain string changes as generic changes', () => {
    expect(summarizeChanges([change(null), change(null)])).toBe('2 změny');
  });
});

describe('getUnseenReleaseDates', () => {
  it('returns nothing when the latest release was already visited', () => {
    expect(getUnseenReleaseDates('2026-08-05', ENTRIES).size).toBe(0);
  });

  it('returns every release newer than the last visit', () => {
    expect([...getUnseenReleaseDates('2026-07-01', ENTRIES)]).toEqual(['2026-08-05', '2026-07-19']);
  });

  it('flags only the latest release for first visits and legacy stored labels', () => {
    expect([...getUnseenReleaseDates(null, ENTRIES)]).toEqual(['2026-08-05']);
    expect([...getUnseenReleaseDates('5. srpen 2026', ENTRIES)]).toEqual(['2026-08-05']);
  });
});

describe('getRecentNewChanges', () => {
  it('returns the newest "new" changes with their release label', () => {
    expect(getRecentNewChanges(2, ENTRIES)).toEqual([
      { text: 'A', label: '5. srpna 2026' },
      { text: 'B', label: '19. července 2026' },
    ]);
  });
});
