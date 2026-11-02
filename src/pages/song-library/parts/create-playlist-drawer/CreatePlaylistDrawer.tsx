import { ListPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Button from '../../../../components/_core/button/Button';
import Drawer from '../../../../components/_core/drawer/Drawer';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import Input from '../../../../components/_core/input/Input';
import Toggle from '../../../../components/_core/toggle/Toggle';
import type { PlaylistVisibility } from '../../../../lib/playlist';
import styles from './CreatePlaylistDrawer.module.css';

// The Firestore rules cap playlist names at this length.
const MAX_NAME_LENGTH = 120;

type CreatePlaylistDrawerProps = {
  onCreate: (name: string, visibility: PlaylistVisibility) => Promise<void>;
  onClose: () => void;
};

export function CreatePlaylistDrawer({ onCreate, onClose }: Readonly<CreatePlaylistDrawerProps>) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmedName || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(trimmedName, isPublic ? 'public' : 'private');
      onClose();
    } catch {
      setError('Playlist se nepodařilo vytvořit.');
      setIsCreating(false);
    }
  };

  return (
    <Drawer
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title="Nový playlist"
      titleIcon={ListPlus}
    >
      <form
        className={styles.form}
        onSubmit={(event) => void handleSubmit(event)}
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
            label={isCreating ? 'Vytvářím…' : 'Vytvořit'}
            disabled={!trimmedName || isCreating}
          />
        </div>
      </form>
    </Drawer>
  );
}
