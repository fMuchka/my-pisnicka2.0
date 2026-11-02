import { Plus, Search } from 'lucide-react';
import Button from '../../../../components/_core/button/Button';
import Input from '../../../../components/_core/input/Input';
import styles from './LibraryToolbar.module.css';

type LibraryToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  searchLabel: string;
  resultCount: string;
  /** The create button is left out without it. */
  createLabel?: string;
  onCreate?: () => void;
};

/** Search field over a library tab, with its result count and create button. */
export function LibraryToolbar({
  query,
  onQueryChange,
  searchLabel,
  resultCount,
  createLabel,
  onCreate,
}: Readonly<LibraryToolbarProps>) {
  return (
    <>
      <Input
        type="search"
        value={query}
        onValueChange={onQueryChange}
        prependIcon={Search}
        placeholder={`${searchLabel}…`}
        aria-label={searchLabel}
      />

      <div className={styles.listHeader}>
        <p
          className={styles.resultCount}
          aria-live="polite"
        >
          {resultCount}
        </p>
        {createLabel && (
          <Button
            icon={Plus}
            label={createLabel}
            onClick={onCreate}
          />
        )}
      </div>
    </>
  );
}
