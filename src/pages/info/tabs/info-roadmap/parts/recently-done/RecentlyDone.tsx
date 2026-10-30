import { ArrowRight, Check } from 'lucide-react';
import shared from '../../shared.module.css';
import styles from './RecentlyDone.module.css';

type RecentlyDoneProps = {
  items: { text: string; label: string }[];
  onShowHistory: () => void;
};

export function RecentlyDone({ items, onShowHistory }: Readonly<RecentlyDoneProps>) {
  return (
    <section className={styles.done}>
      <h3 className={shared.eyebrow}>Nedávno hotovo</h3>
      <ul className={styles.doneList}>
        {items.map((item) => (
          <li
            key={item.text}
            className={styles.doneItem}
          >
            <span
              className={styles.doneCheck}
              aria-hidden="true"
            >
              <Check className={styles.iconXs} />
            </span>
            <span>
              {item.text}
              <span className={styles.doneDate}>{item.label}</span>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.linkButton}
        onClick={onShowHistory}
      >
        Celá historie
        <ArrowRight
          className={shared.iconSm}
          aria-hidden="true"
        />
      </button>
    </section>
  );
}
