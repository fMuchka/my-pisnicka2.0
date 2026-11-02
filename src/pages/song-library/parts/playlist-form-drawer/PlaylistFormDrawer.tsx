import { ListPlus, Settings2, Trash2 } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import Button from '../../../../components/_core/button/Button';
import Drawer from '../../../../components/_core/drawer/Drawer';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import Input from '../../../../components/_core/input/Input';
import Toggle from '../../../../components/_core/toggle/Toggle';
import type { Playlist, UpdatePlaylistInput } from '../../../../lib/playlist';
import styles from './PlaylistFormDrawer.module.css';

// The Firestore rules cap playlist names at this length.
const MAX_NAME_LENGTH = 120;

type PlaylistFormDrawerProps = {
  /** The playlist to edit; a new one is created without it. */
  playlist?: Pick<Playlist, 'name' | 'visibility'>;
  onSubmit: (input: UpdatePlaylistInput) => Promise<void>;
  /** Offers deleting the playlist when given. */
  onDelete?: () => Promise<void>;
  onClose: () => void;
};

export function PlaylistFormDrawer({
  playlist,
  onSubmit,
  onDelete,
  onClose,
}: Readonly<PlaylistFormDrawerProps>) {
  const [name, setName] = useState(playlist?.name ?? '');
  const [isPublic, setIsPublic] = useState(playlist?.visibility === 'public');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = playlist !== undefined;
  const trimmedName = name.trim();
  const visibility = isPublic ? 'public' : 'private';
  const isUnchanged = trimmedName === playlist?.name && visibility === playlist.visibility;

  const run = async (action: () => Promise<void>, errorMessage: string) => {
    setIsBusy(true);
    setError(null);

    try {
      await action();
      onClose();
    } catch {
      setError(errorMessage);
      setIsBusy(false);
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || isUnchanged || isBusy) return;

    void run(
      () => onSubmit({ name: trimmedName, visibility }),
      isEdit ? 'Playlist se nepodařilo uložit.' : 'Playlist se nepodařilo vytvořit.'
    );
  };

  const submitLabel = isEdit ? 'Uložit' : 'Vytvořit';

  return (
    <Drawer
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={isEdit ? 'Upravit playlist' : 'Nový playlist'}
      titleIcon={isEdit ? Settings2 : ListPlus}
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <Input
          label="Název playlistu"
          placeholder="Např. Večerní hraní"
          value={name}
          onValueChange={setName}
          maxLength={MAX_NAME_LENGTH}
          required
        />

        <Toggle
          label="Veřejný playlist"
          description="Uvidí ho i ostatní ve veřejných playlistech."
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />

        {error && <ErrorMessage message={error} />}

        <div className={styles.actions}>
          <Button
            type="button"
            label="Zrušit"
            colorVariation="secondary"
            styleVariation="outlined"
            onClick={onClose}
          />
          <Button
            type="submit"
            label={isBusy && !isConfirmingDelete ? `${submitLabel}…` : submitLabel}
            disabled={!trimmedName || isUnchanged || isBusy}
          />
        </div>
      </form>

      {onDelete && (
        <section
          className={styles.danger}
          aria-label="Smazání playlistu"
        >
          {isConfirmingDelete ? (
            <>
              <p className={styles.dangerText}>
                Playlist se smaže natrvalo. Písně samotné v knihovně zůstanou.
              </p>
              <div className={styles.actions}>
                <Button
                  type="button"
                  label="Ponechat"
                  colorVariation="secondary"
                  styleVariation="outlined"
                  disabled={isBusy}
                  onClick={() => setIsConfirmingDelete(false)}
                />
                <Button
                  type="button"
                  icon={Trash2}
                  label="Smazat"
                  className={styles.deleteButton}
                  disabled={isBusy}
                  onClick={() => void run(onDelete, 'Playlist se nepodařilo smazat.')}
                />
              </div>
            </>
          ) : (
            <Button
              type="button"
              icon={Trash2}
              label="Smazat playlist"
              styleVariation="text"
              className={styles.deleteTextButton}
              onClick={() => setIsConfirmingDelete(true)}
            />
          )}
        </section>
      )}
    </Drawer>
  );
}
