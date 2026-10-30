import IconBackdrop from '../../../../../../components/_core/icon-backdrop/IconBackdrop';
import type { Feature } from '../../types';
import shared from '../../shared.module.css';
import styles from './FeaturesSection.module.css';

type FeaturesSectionProps = {
  features: Feature[];
};

export function FeaturesSection({ features }: Readonly<FeaturesSectionProps>) {
  return (
    <section className={shared.block}>
      <h3 className={shared.eyebrow}>Co aplikace umí</h3>
      <ul className={styles.features}>
        {features.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className={styles.feature}
          >
            <IconBackdrop>
              <Icon
                className={shared.iconSm}
                aria-hidden="true"
              />
            </IconBackdrop>
            <span>
              <strong className={styles.featureTitle}>{title}</strong>
              <span className={styles.featureText}>{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
