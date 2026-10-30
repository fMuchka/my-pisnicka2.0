import { getTimelineEntries } from '../../../../lib/timeline/timeline';
import { FAQS, FEATURES } from './constants';
import { FaqSection } from './parts/faq-section/FaqSection';
import { FeaturesSection } from './parts/features-section/FeaturesSection';
import { FirstVersionLink } from './parts/first-version-link/FirstVersionLink';
import { Hero } from './parts/hero/Hero';
import shared from './shared.module.css';
import styles from './InfoGeneral.module.css';

type InfoGeneralProps = {
  onShowHistory: () => void;
};

export function InfoGeneral({ onShowHistory }: Readonly<InfoGeneralProps>) {
  const lastChangeLabel = getTimelineEntries()[0]?.label ?? null;

  return (
    <div className={styles.general}>
      <Hero
        lastChangeLabel={lastChangeLabel}
        onShowHistory={onShowHistory}
      />

      <FeaturesSection features={FEATURES} />

      <figure className={shared.block}>
        <h3 className={shared.eyebrow}>Hlavní cíl</h3>
        <blockquote className={styles.goal}>
          Podpořit společné hraní bez složitého nastavování, bez reklam a bez bariér.
        </blockquote>
      </figure>

      <FaqSection faqs={FAQS} />

      <FirstVersionLink />
    </div>
  );
}
