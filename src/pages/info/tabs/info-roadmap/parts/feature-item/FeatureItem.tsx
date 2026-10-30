import { ChevronDown } from 'lucide-react';
import IconBackdrop from '../../../../../../components/_core/icon-backdrop/IconBackdrop';
import type { Icon } from '../../../../../../components/_core/types';
import { classNames } from '../../../../../../lib/classNames';
import type { UpcomingFeature } from '../../../../../../lib/upcoming-features/upcomingFeatures';
import shared from '../../shared.module.css';
import styles from './FeatureItem.module.css';

type FeatureItemProps = {
  feature: UpcomingFeature;
  /** The icon of the feature's area. */
  icon: Icon;
};

/** One planned feature; expandable when it has details. */
export function FeatureItem({ feature, icon: Icon }: Readonly<FeatureItemProps>) {
  const content = (
    <>
      <IconBackdrop>
        <Icon
          className={shared.iconSm}
          aria-hidden="true"
        />
      </IconBackdrop>
      <span className={styles.featureHeading}>
        <span className={styles.featureTitle}>{feature.title}</span>
        {feature.inProgress && <span className={styles.status}>Rozpracováno</span>}
      </span>
    </>
  );

  if (!feature.details) {
    return <div className={styles.featureRow}>{content}</div>;
  }

  return (
    <details>
      <summary className={classNames(styles.summary, styles.featureRow)}>
        {content}
        <ChevronDown
          className={styles.chevron}
          aria-hidden="true"
        />
      </summary>
      <p className={styles.featureDetails}>{feature.details}</p>
    </details>
  );
}
