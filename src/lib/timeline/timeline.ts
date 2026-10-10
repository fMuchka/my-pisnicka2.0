import timelineData from './data.json';

export type ChangeType = 'new' | 'improved' | 'fix';

type RawChange = string | { type?: ChangeType; text: string; details?: string };

type RawEntry = {
  date: string;
  title?: string;
  milestone?: boolean;
  text?: string;
  link?: string;
  changes?: RawChange[];
};

export type TimelineChange = {
  type: ChangeType | null;
  text: string;
  details: string | null;
};

export type TimelineRelease = {
  kind: 'release';
  date: string;
  label: string;
  title: string | null;
  changes: TimelineChange[];
};

export type TimelineMilestone = {
  kind: 'milestone';
  date: string;
  label: string;
  title: string;
  text: string;
  link: string | null;
};

export type TimelineEntry = TimelineRelease | TimelineMilestone;

export type ChangeGroup = {
  type: ChangeType | null;
  label: string | null;
  changes: TimelineChange[];
};

const TIMELINE_LATEST_VISITED_STORAGE_KEY = 'my-pisnicka:timeline-latest-visited-time';

const CHANGE_TYPES: { type: ChangeType; label: string; forms: [string, string, string] }[] = [
  { type: 'new', label: 'Nové', forms: ['nová', 'nové', 'nových'] },
  { type: 'improved', label: 'Vylepšení', forms: ['vylepšení', 'vylepšení', 'vylepšení'] },
  { type: 'fix', label: 'Opravy', forms: ['oprava', 'opravy', 'oprav'] },
];

const CHANGE_FORMS: [string, string, string] = ['změna', 'změny', 'změn'];

export function pluralize(count: number, forms: [string, string, string]): string {
  if (count === 1) {
    return forms[0];
  }

  return count >= 2 && count <= 4 ? forms[1] : forms[2];
}

export function formatTimelineDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  if (year == null || month == null) {
    return date;
  }

  // UTC on both sides, otherwise a negative local offset shifts the day back.
  const value = new Date(Date.UTC(year, month - 1, day ?? 1));
  const formatted = new Intl.DateTimeFormat('cs-CZ', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    ...(day == null ? {} : { day: 'numeric' }),
  }).format(value);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function normalizeChange(change: RawChange): TimelineChange {
  if (typeof change === 'string') {
    return { type: null, text: change, details: null };
  }

  return { type: change.type ?? null, text: change.text, details: change.details ?? null };
}

function normalizeEntry(entry: RawEntry): TimelineEntry {
  const label = formatTimelineDate(entry.date);

  if (entry.milestone) {
    return {
      kind: 'milestone',
      date: entry.date,
      label,
      title: entry.title ?? label,
      text: entry.text ?? '',
      link: entry.link ?? null,
    };
  }

  return {
    kind: 'release',
    date: entry.date,
    label,
    title: entry.title ?? null,
    changes: (entry.changes ?? []).map(normalizeChange),
  };
}

const timelineEntries = (timelineData as RawEntry[]).map(normalizeEntry);

export function getTimelineEntries(): TimelineEntry[] {
  return timelineEntries;
}

export function groupChangesByType(changes: TimelineChange[]): ChangeGroup[] {
  const groups: ChangeGroup[] = CHANGE_TYPES.map(({ type, label }) => ({
    type,
    label,
    changes: changes.filter((change) => change.type === type),
  }));
  groups.push({
    type: null,
    label: null,
    changes: changes.filter((change) => change.type == null),
  });

  return groups.filter((group) => group.changes.length > 0);
}

export function summarizeChanges(changes: TimelineChange[]): string {
  const parts = CHANGE_TYPES.map(({ type, forms }) => {
    const count = changes.filter((change) => change.type === type).length;
    return count > 0 ? `${count} ${pluralize(count, forms)}` : null;
  });
  const untypedCount = changes.filter((change) => change.type == null).length;

  if (untypedCount > 0) {
    parts.push(`${untypedCount} ${pluralize(untypedCount, CHANGE_FORMS)}`);
  }

  return parts.filter((part) => part != null).join(' · ');
}

export function formatChangeCount(count: number): string {
  return `${count} ${pluralize(count, CHANGE_FORMS)}`;
}

export function getLatestTimelineTime(): string | null {
  return timelineEntries[0]?.date ?? null;
}

export function getLastVisitedTimelineTime(): string | null {
  return localStorage.getItem(TIMELINE_LATEST_VISITED_STORAGE_KEY);
}

export function markLatestTimelineAsVisited(): void {
  const latestTimelineTime = getLatestTimelineTime();

  if (latestTimelineTime == null) {
    return;
  }

  localStorage.setItem(TIMELINE_LATEST_VISITED_STORAGE_KEY, latestTimelineTime);
}

export function hasUnseenTimelineUpdates(): boolean {
  const latestTimelineTime = getLatestTimelineTime();

  if (latestTimelineTime == null) {
    return false;
  }

  return getLastVisitedTimelineTime() !== latestTimelineTime;
}

export function getUnseenReleaseDates(
  lastVisited: string | null,
  entries: TimelineEntry[] = timelineEntries
): Set<string> {
  const releases = entries.filter((entry) => entry.kind === 'release');
  const latest = releases[0];

  if (latest == null || lastVisited === latest.date) {
    return new Set();
  }

  // Never visited, or a pre-ISO label like "5. srpen 2026": flag only the latest release
  // instead of announcing the whole history as new.
  if (lastVisited == null || !/^\d{4}-\d{2}/.test(lastVisited)) {
    return new Set([latest.date]);
  }

  return new Set(releases.filter((release) => release.date > lastVisited).map((r) => r.date));
}

export function getRecentNewChanges(
  limit: number,
  entries: TimelineEntry[] = timelineEntries
): { text: string; label: string }[] {
  return entries
    .flatMap((entry) =>
      entry.kind === 'release'
        ? entry.changes
            .filter((change) => change.type === 'new')
            .map((change) => ({ text: change.text, label: entry.label }))
        : []
    )
    .slice(0, limit);
}
