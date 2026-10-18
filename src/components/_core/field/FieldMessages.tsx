import { Field } from '@ark-ui/react/field';
import { cx } from '../cx';
import styles from './FieldMessages.module.css';

type FieldMessagesProps = {
  helperText?: string | undefined;
  errorText?: string | undefined;
  successText?: string | undefined;
  invalid?: boolean | undefined;
  success?: boolean | undefined;
  counter?: string | undefined;
};

// Must render inside a Field.Root: Ark links these texts to the control via aria-describedby.
export default function FieldMessages({
  helperText,
  errorText,
  successText,
  invalid,
  success,
  counter,
}: FieldMessagesProps) {
  // Invalid wins so a field never shows red and green at once.
  const isSuccess = success && !invalid;
  const helper = (isSuccess && successText) || helperText;
  const showHelper = helper && !(invalid && errorText);

  if (!errorText && !showHelper && !counter) {
    return null;
  }

  return (
    <div className={styles.fieldMessages}>
      {errorText && (
        <Field.ErrorText className={cx(styles.fieldMessage, styles.fieldMessageError)}>
          {errorText}
        </Field.ErrorText>
      )}
      {showHelper && (
        <Field.HelperText
          className={cx(
            styles.fieldMessage,
            isSuccess && successText && styles.fieldMessageSuccess
          )}
        >
          {helper}
        </Field.HelperText>
      )}
      {counter && (
        <span
          className={styles.fieldCounter}
          aria-hidden="true"
        >
          {counter}
        </span>
      )}
    </div>
  );
}
