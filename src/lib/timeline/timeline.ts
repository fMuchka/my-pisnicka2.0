import timelineData from './data.json';

export type TimelineEvent = {
  time: string;
  text: string;
};

const timelineEvents = timelineData as TimelineEvent[];

export function getTimelineEvents(): TimelineEvent[] {
  return timelineEvents;
}
