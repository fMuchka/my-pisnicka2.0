import { ExternalLink } from 'lucide-react';
import { FIRST_VERSION_URL } from '../../constants';
import shared from '../../shared.module.css';
import styles from './FirstVersionLink.module.css';

export function FirstVersionLink() {
  return (
    <a
      className={styles.v1Link}
      href={FIRST_VERSION_URL}
      target="_blank"
      rel="noopener"
    >
      <span className={styles.v1Text}>
        <span>První verze MyPísničky</span>
        <span className={styles.v1Meta}>Statický zpěvník ze září 2025</span>
      </span>
      <ExternalLink
        className={shared.iconSm}
        aria-hidden="true"
      />
    </a>
  );
}
