import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Song } from '../../../lib/song';
import { useSongStore } from '../../../stores/song';
import type { SongDraft } from '../parts/song-editor/types';
import { saveSong } from '../saveSong';

const catalog = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  fetchBySource: vi.fn(),
  resolveCategories: vi.fn(),
}));

vi.mock('../../../lib/song', () => ({
  createSongCatalogEntry: catalog.create,
  updateSongCatalogEntry: catalog.update,
  fetchSongCatalogEntryBySourceSongId: catalog.fetchBySource,
  resolveSongCategoryIds: catalog.resolveCategories,
}));

const draft: SongDraft = {
  title: ' Kometa ',
  artist: ' Nohavica ',
  capo: '2',
  text: ' [C]Za [Am]sklem \n',
  instrument: 'ukulele',
  visibility: 'private',
  tags: ['folk', 'táborák'],
};
const saved: Song = {
  id: 's1',
  title: 'Kometa',
  artist: 'Nohavica',
  chords: ['C', 'Am'],
  ownerId: 'u1',
};

describe('saveSong', () => {
  const createSong = vi.fn(() => Promise.resolve(saved));
  const updateSong = vi.fn(() => Promise.resolve(saved));

  beforeEach(() => {
    vi.clearAllMocks();
    catalog.resolveCategories.mockResolvedValue(['cat-folk', 'cat-taborak']);
    useSongStore.setState({ createSong, updateSong });
  });

  it('creates a trimmed song with its chords, instrument and visibility, and a catalog entry with its tags', async () => {
    await expect(saveSong(draft, 'u1')).resolves.toEqual({
      ...saved,
      categories: ['cat-folk', 'cat-taborak'],
    });

    expect(createSong).toHaveBeenCalledWith({
      title: 'Kometa',
      artist: 'Nohavica',
      text: '[C]Za [Am]sklem',
      chords: ['C', 'Am'],
      capo: 2,
      instrument: 'ukulele',
      visibility: 'private',
      ownerId: 'u1',
    });
    expect(catalog.fetchBySource).not.toHaveBeenCalled();
    expect(catalog.resolveCategories).toHaveBeenCalledWith(['folk', 'táborák']);
    expect(catalog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceSongId: 's1',
        categories: ['cat-folk', 'cat-taborak'],
        visibility: 'private',
        ownerId: 'u1',
      })
    );
  });

  it('leaves out capo, text and an unpicked instrument', async () => {
    await saveSong({ ...draft, capo: ' ', text: '  ', instrument: '' }, 'u1');

    const input = createSong.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(input[0]).not.toHaveProperty('capo');
    expect(input[0]).not.toHaveProperty('instrument');
    expect(input[0].text).toBeUndefined();
  });

  it('updates the song and replaces the catalog entry categories with the tags', async () => {
    catalog.fetchBySource.mockResolvedValue({ id: 'c1', categories: ['old'] });

    await saveSong(draft, 'u1', 's1');

    expect(updateSong).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ title: 'Kometa', instrument: 'ukulele' })
    );
    expect(catalog.update).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ sourceSongId: 's1', categories: ['cat-folk', 'cat-taborak'] })
    );
    expect(catalog.create).not.toHaveBeenCalled();
  });

  it('keeps the entry categories when the tags could not be loaded', async () => {
    catalog.fetchBySource.mockResolvedValue({ id: 'c1', categories: ['folk'] });

    await saveSong({ ...draft, tags: null }, 'u1', 's1');

    expect(catalog.resolveCategories).not.toHaveBeenCalled();
    expect(catalog.update).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ categories: ['folk'] })
    );
  });

  it('creates the catalog entry for an updated song that has none', async () => {
    catalog.fetchBySource.mockResolvedValue(null);

    await saveSong(draft, 'u1', 's1');

    expect(catalog.create).toHaveBeenCalledWith(expect.objectContaining({ sourceSongId: 's1' }));
  });
});
