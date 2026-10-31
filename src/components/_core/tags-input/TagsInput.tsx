import { Field } from '@ark-ui/react/field';
import { TagsInput as ArkTagsInput } from '@ark-ui/react/tags-input';
import { XIcon } from 'lucide-react';
import FieldMessages from '../field/FieldMessages';
import fieldStyles from '../field/field.module.css';
import styles from './TagsInput.module.css';

type TagsInputProps = {
  label?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  name?: string;
};

/** Free-form tags: type one and press Enter or a comma; Backspace or the × removes it. */
export default function TagsInput({
  label,
  value,
  onValueChange,
  placeholder,
  helperText,
  disabled,
  name,
}: Readonly<TagsInputProps>) {
  return (
    <Field.Root
      className={fieldStyles.field}
      disabled={disabled}
    >
      <ArkTagsInput.Root
        className={styles.tagsInput}
        value={value}
        onValueChange={(details) => onValueChange(details.value)}
        disabled={disabled}
        name={name}
        delimiter=","
        addOnPaste
        blurBehavior="add"
        editable={false}
        translations={{
          deleteTagTriggerLabel: (tag) => `Odebrat ${tag}`,
          clearTriggerLabel: 'Odebrat vše',
        }}
      >
        {label && (
          <ArkTagsInput.Label className={fieldStyles.fieldLabel}>{label}</ArkTagsInput.Label>
        )}

        <ArkTagsInput.Control className={styles.control}>
          {value.map((tag, index) => (
            <ArkTagsInput.Item
              key={tag}
              index={index}
              value={tag}
              className={styles.tag}
            >
              <ArkTagsInput.ItemPreview className={styles.tagPreview}>
                <ArkTagsInput.ItemText>{tag}</ArkTagsInput.ItemText>
                <ArkTagsInput.ItemDeleteTrigger className={styles.tagDelete}>
                  <XIcon aria-hidden="true" />
                </ArkTagsInput.ItemDeleteTrigger>
              </ArkTagsInput.ItemPreview>
            </ArkTagsInput.Item>
          ))}
          <ArkTagsInput.Input
            className={styles.input}
            placeholder={value.length === 0 ? placeholder : undefined}
          />
        </ArkTagsInput.Control>
        <ArkTagsInput.HiddenInput />
      </ArkTagsInput.Root>

      <FieldMessages helperText={helperText} />
    </Field.Root>
  );
}
