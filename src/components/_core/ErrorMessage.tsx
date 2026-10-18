import { AlertCircle } from 'lucide-react';
import styles from './ErrorMessage.module.css';

type ErrorMessageProps = {
  message?: string | undefined;
};

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      className={styles.errorContainer}
      role="alert"
    >
      <div className={styles.errorContent}>
        <AlertCircle className={styles.errorIcon} />
        <p className={styles.errorText}>
          {message || 'Chyba při načítání. Prosím, zkuste to později.'}
        </p>
      </div>
    </div>
  );
}
