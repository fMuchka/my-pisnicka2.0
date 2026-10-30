import { classNames } from '../../../../lib/classNames';
import { getTimelineEntries, getUnseenReleaseDates } from '../../../../lib/timeline/timeline';
import { MilestoneEntry } from './parts/milestone-entry/MilestoneEntry';
import { ReleaseEntry } from './parts/release-entry/ReleaseEntry';
import { UnseenBanner } from './parts/unseen-banner/UnseenBanner';
import styles from './InfoHistory.module.css';

type InfoHistoryProps = {
  lastVisited: string | null;
};

export function InfoHistory({ lastVisited }: Readonly<InfoHistoryProps>) {
  const entries = getTimelineEntries();
  const unseenDates = getUnseenReleaseDates(lastVisited, entries);

  const unseenCount = entries.reduce(
    (count, entry) =>
      entry.kind === 'release' && unseenDates.has(entry.date)
        ? count + entry.changes.length
        : count,
    0
  );

  return (
    <div className={styles.history}>
      {unseenCount > 0 && <UnseenBanner count={unseenCount} />}

      <ol className={styles.timeline}>
        {entries.map((entry, index) => {
          const isLatest = index === 0;

          return (
            <li
              key={entry.date}
              className={styles.timelineItem}
            >
              <span
                className={classNames(
                  styles.timelineDot,
                  isLatest && styles.timelineDotLatest,
                  entry.kind === 'milestone' && styles.timelineDotMilestone
                )}
                aria-hidden="true"
              />

              {entry.kind === 'release' ? (
                <ReleaseEntry
                  release={entry}
                  isUnseen={unseenDates.has(entry.date)}
                  defaultOpen={isLatest}
                />
              ) : (
                <MilestoneEntry milestone={entry} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
