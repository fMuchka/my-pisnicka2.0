import timelineData from './data.json';

export type TimelineEvent = {
  time: string;
  text: string[];
};

const timelineEvents = timelineData as TimelineEvent[];
const TIMELINE_LATEST_VISITED_STORAGE_KEY = 'my-pisnicka:timeline-latest-visited-time';

export function getTimelineEvents(): TimelineEvent[] {
  return timelineEvents;
}

export function getLatestTimelineTime(): string | null {
  const latestEvent = timelineEvents[0];

  if (!latestEvent?.time) {
    return null;
  }

  return latestEvent.time;
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

  const latestVisitedTime = localStorage.getItem(TIMELINE_LATEST_VISITED_STORAGE_KEY);

  return latestVisitedTime !== latestTimelineTime;
}
