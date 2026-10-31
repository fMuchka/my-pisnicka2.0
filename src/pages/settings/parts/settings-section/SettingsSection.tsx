import { useId, type ReactNode } from 'react';
import styles from './SettingsSection.module.css';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

/** A titled group of settings, with the small brand dot in front of the title. */
export function SettingsSection({ title, children }: Readonly<SettingsSectionProps>) {
  const titleId = useId();

  return (
    <section
      className={styles.section}
      aria-labelledby={titleId}
    >
      <div className={styles.eyebrow}>
        <span className={styles.dot} />
        <h2 id={titleId}>{title}</h2>
      </div>
      {children}
    </section>
  );
}
