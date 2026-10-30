import { ChevronDown } from 'lucide-react';
import type { Faq } from '../../types';
import shared from '../../shared.module.css';
import styles from './FaqSection.module.css';

type FaqSectionProps = {
  /** The first question starts open. */
  faqs: Faq[];
};

export function FaqSection({ faqs }: Readonly<FaqSectionProps>) {
  return (
    <section className={shared.block}>
      <h3 className={shared.eyebrow}>Dobré vědět</h3>
      {faqs.map(({ answer, question }, index) => (
        <details
          key={question}
          className={styles.faq}
          open={index === 0}
        >
          <summary className={styles.faqQuestion}>
            {question}
            <ChevronDown
              className={styles.chevron}
              aria-hidden="true"
            />
          </summary>
          <p className={styles.faqAnswer}>{answer}</p>
        </details>
      ))}
    </section>
  );
}
