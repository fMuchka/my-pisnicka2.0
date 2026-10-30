import type { UpcomingFeatureGroup } from '../../../../../../lib/upcoming-features/upcomingFeatures';
import { AREA_ICONS, OTHER_AREA_ICON } from '../../constants';
import { FeatureItem } from '../feature-item/FeatureItem';
import shared from '../../shared.module.css';
import styles from './FeatureAreaSection.module.css';

type FeatureAreaSectionProps = {
  group: UpcomingFeatureGroup;
};

export function FeatureAreaSection({ group }: Readonly<FeatureAreaSectionProps>) {
  const Icon = group.area ? AREA_ICONS[group.area] : OTHER_AREA_ICON;

  return (
    <section className={styles.area}>
      <h3 className={shared.eyebrow}>
        <Icon
          className={styles.areaIcon}
          aria-hidden="true"
        />
        {group.label}
      </h3>

      <ul className={styles.features}>
        {group.features.map((feature) => (
          <li
            key={feature.title}
            className={styles.feature}
          >
            <FeatureItem
              feature={feature}
              icon={Icon}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
