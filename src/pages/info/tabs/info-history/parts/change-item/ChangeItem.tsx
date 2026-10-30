import { ChevronDown } from 'lucide-react';
import { classNames } from '../../../../../../lib/classNames';
import type { TimelineChange } from '../../../../../../lib/timeline/timeline';
import shared from '../../shared.module.css';
import styles from './ChangeItem.module.css';

type ChangeItemProps = {
  change: TimelineChange;
};

/** One change line; expandable when it has details. */
export function ChangeItem({ change }: Readonly<ChangeItemProps>) {
  const bullet = (
    <span
      className={classNames(styles.bullet, change.type === 'new' && styles.bulletNew)}
      aria-hidden="true"
    />
  );

  if (!change.details) {
    return (
      <div className={classNames(styles.changeRow, styles.changeRowPlain)}>
        {bullet}
        <span>{change.text}</span>
      </div>
    );
  }

  return (
    <details>
      <summary className={classNames(shared.summary, styles.changeRow)}>
        {bullet}
        <span>{change.text}</span>
        <ChevronDown
          className={classNames(shared.chevron, shared.chevronSm)}
          aria-hidden="true"
        />
      </summary>
      <p className={styles.changeDetails}>{change.details}</p>
    </details>
  );
}
