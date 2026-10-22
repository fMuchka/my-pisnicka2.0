import styles from './LoadingSpinner.module.css';

type LoadingSpinnerProps = {
  label?: string;
};

export default function LoadingSpinner({ label }: Readonly<LoadingSpinnerProps>) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <p className={styles.loadingLabel}>{label || 'Načítání...'}</p>
    </div>
  );
}
