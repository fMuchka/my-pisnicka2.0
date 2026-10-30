import { ExternalLink, Flag } from 'lucide-react';
import IconBackdrop from '../../../../../../components/_core/icon-backdrop/IconBackdrop';
import type { TimelineMilestone } from '../../../../../../lib/timeline/timeline';
import shared from '../../shared.module.css';
import styles from './MilestoneEntry.module.css';

type MilestoneEntryProps = {
  milestone: TimelineMilestone;
};

export function MilestoneEntry({ milestone }: Readonly<MilestoneEntryProps>) {
  return (
    <article className={styles.milestone}>
      <IconBackdrop>
        <Flag
          className={shared.iconSm}
          aria-hidden="true"
        />
      </IconBackdrop>
      <div className={styles.milestoneContent}>
        <span className={shared.entryDate}>{milestone.label} · Milník</span>
        <h3 className={shared.entryTitle}>{milestone.title}</h3>
        <p className={styles.milestoneText}>{milestone.text}</p>
        {milestone.link && (
          <a
            className={styles.milestoneLink}
            href={milestone.link}
            target="_blank"
            rel="noopener"
          >
            Otevřít
            <ExternalLink
              className={shared.iconXs}
              aria-hidden="true"
            />
          </a>
        )}
      </div>
    </article>
  );
}
