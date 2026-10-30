import { ChevronDown } from 'lucide-react';
import { classNames } from '../../../../../../lib/classNames';
import {
  groupChangesByType,
  summarizeChanges,
  type TimelineRelease,
} from '../../../../../../lib/timeline/timeline';
import { ChangeGroupSection } from '../change-group-section/ChangeGroupSection';
import shared from '../../shared.module.css';
import styles from './ReleaseEntry.module.css';

type ReleaseEntryProps = {
  release: TimelineRelease;
  /** Released since the user's last visit, gets the "Nové" badge. */
  isUnseen: boolean;
  defaultOpen: boolean;
};

export function ReleaseEntry({ release, isUnseen, defaultOpen }: Readonly<ReleaseEntryProps>) {
  return (
    <details
      className={styles.release}
      open={defaultOpen}
    >
      <summary className={classNames(shared.summary, styles.releaseSummary)}>
        <span className={styles.releaseHeading}>
          <span className={shared.entryDate}>
            {release.label}
            {isUnseen && <span className={styles.badgeNew}>Nové</span>}
          </span>
          {release.title && <span className={shared.entryTitle}>{release.title}</span>}
          <span className={styles.releaseMeta}>{summarizeChanges(release.changes)}</span>
        </span>
        <ChevronDown
          className={shared.chevron}
          aria-hidden="true"
        />
      </summary>

      <div className={styles.releaseBody}>
        {groupChangesByType(release.changes).map((group) => (
          <ChangeGroupSection
            key={group.type ?? 'other'}
            group={group}
          />
        ))}
      </div>
    </details>
  );
}
