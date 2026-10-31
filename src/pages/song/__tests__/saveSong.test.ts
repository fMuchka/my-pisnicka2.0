import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Song } from '../../../lib/song';
import { useSongStore } from '../../../stores/song';
import { saveSong } from '../saveSong';

const catalog = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  fetchBySource: vi.fn(),
}));

vi.mock('../../../lib/song', () => ({
  createSongCatalogEntry: catalog.create,
  updateSongCatalogEntry: catalog.update,
  fetchSongCatalogEntryBySourceSongId: catalog.fetchBySource,
}));

const draft = { title: ' Kometa ', artist: ' Nohavica ', capo: '2', text: ' [C]Za [Am]sklem \n' };
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
    useSongStore.setState({ createSong, updateSong });
  });

  it('creates a trimmed song with its chords and a catalog entry', async () => {
    await expect(saveSong(draft, 'u1')).resolves.toBe(saved);

    expect(createSong).toHaveBeenCalledWith({
      title: 'Kometa',
      artist: 'Nohavica',
      text: '[C]Za [Am]sklem',
      chords: ['C', 'Am'],
      capo: 2,
      ownerId: 'u1',
    });
    expect(catalog.fetchBySource).not.toHaveBeenCalled();
    expect(catalog.create).toHaveBeenCalledWith(
      expect.objectContaining({ sourceSongId: 's1', categories: [], ownerId: 'u1' })
    );
  });

  it('leaves out capo and text when empty', async () => {
    await saveSong({ ...draft, capo: ' ', text: '  ' }, 'u1');

    const input = createSong.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(input[0]).not.toHaveProperty('capo');
    expect(input[0].text).toBeUndefined();
  });

  it('updates the song and its catalog entry, keeping the entry categories', async () => {
    catalog.fetchBySource.mockResolvedValue({ id: 'c1', categories: ['folk'] });

    await saveSong(draft, 'u1', 's1');

    expect(updateSong).toHaveBeenCalledWith('s1', expect.objectContaining({ title: 'Kometa' }));
    expect(catalog.update).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ sourceSongId: 's1', categories: ['folk'] })
    );
    expect(catalog.create).not.toHaveBeenCalled();
  });

  it('creates the catalog entry for an updated song that has none', async () => {
    catalog.fetchBySource.mockResolvedValue(null);

    await saveSong(draft, 'u1', 's1');

    expect(catalog.create).toHaveBeenCalledWith(expect.objectContaining({ sourceSongId: 's1' }));
  });
});
