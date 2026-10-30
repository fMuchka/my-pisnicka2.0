import { Field } from '@ark-ui/react/field';
import { classNames } from '../../../lib/classNames';
import styles from './FieldMessages.module.css';

type FieldMessagesProps = {
  helperText?: string;
  errorText?: string;
  successText?: string;
  invalid?: boolean;
  success?: boolean;
  counter?: string;
};

// Must render inside a Field.Root: Ark links these texts to the control via aria-describedby.
export default function FieldMessages({
  helperText,
  errorText,
  successText,
  invalid,
  success,
  counter,
}: Readonly<FieldMessagesProps>) {
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
        <Field.ErrorText className={classNames(styles.fieldMessage, styles.fieldMessageError)}>
          {errorText}
        </Field.ErrorText>
      )}
      {showHelper && (
        <Field.HelperText
          className={classNames(
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
