/** Form values of the song editor; capo stays a string until it is validated on save. */
export type SongDraft = {
  title: string;
  artist: string;
  capo: string;
  text: string;
};

export type SongEditorView = 'edit' | 'preview';
