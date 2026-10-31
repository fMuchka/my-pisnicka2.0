import { Field } from '@ark-ui/react/field';
import { TagsInput as ArkTagsInput } from '@ark-ui/react/tags-input';
import { Plus, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import FieldMessages from '../field/FieldMessages';
import fieldStyles from '../field/field.module.css';
import { matchSuggestions } from './suggestions';
import styles from './TagsInput.module.css';

type TagsInputProps = {
  label?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Existing tags offered as one-tap chips while the user types something that matches. */
  suggestions?: string[];
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
  suggestions = [],
  placeholder,
  helperText,
  disabled,
  name,
}: Readonly<TagsInputProps>) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const matches = disabled ? [] : matchSuggestions(suggestions, inputValue, value);

  const addSuggestion = (suggestion: string) => {
    onValueChange([...value, suggestion]);
    setInputValue('');
    inputRef.current?.focus();
  };

  return (
    <Field.Root
      className={fieldStyles.field}
      disabled={disabled}
    >
      <ArkTagsInput.Root
        className={styles.tagsInput}
        value={value}
        onValueChange={(details) => onValueChange(details.value)}
        inputValue={inputValue}
        onInputValueChange={(details) => setInputValue(details.inputValue)}
        // Ark counts any press outside the text input as leaving it and adds the half-typed text
        // as a tag. A press on a suggestion is meant to replace that text, so it doesn't count.
        onInteractOutside={(event) => {
          const target = event.detail.originalEvent.target;
          if (target instanceof Node && suggestionsRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
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
            ref={inputRef}
            className={styles.input}
            placeholder={value.length === 0 ? placeholder : undefined}
          />
        </ArkTagsInput.Control>
        <ArkTagsInput.HiddenInput />
      </ArkTagsInput.Root>

      {matches.length > 0 && (
        <ul
          ref={suggestionsRef}
          className={styles.suggestions}
          aria-label="Návrhy štítků"
        >
          {matches.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                className={styles.suggestion}
                aria-label={`Přidat štítek ${suggestion}`}
                // Keeps the focus (and a phone's keyboard) in the input, ready for the next tag.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addSuggestion(suggestion)}
              >
                <Plus aria-hidden="true" />
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      <FieldMessages helperText={helperText} />
    </Field.Root>
  );
}
