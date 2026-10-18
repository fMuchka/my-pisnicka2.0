import styles from './LoadingSpinner.module.css';

type LoadingSpinnerProps = {
  label?: string | undefined;
};

export default function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <p className={styles.loadingLabel}>{label || 'Načítání...'}</p>
    </div>
  );
}
