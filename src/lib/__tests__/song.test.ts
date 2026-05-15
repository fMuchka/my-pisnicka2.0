import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectHomeSongs, fetchSongById, createSong, updateSong } from '../song';
import type { Song } from '../song';

// Mock Firestore
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    limit: (...args: unknown[]) => mockLimit(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    addDoc: (...args: unknown[]) => mockAddDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
  };
});

vi.mock('../firebase', () => ({
  db: {},
}));

describe('Song Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('selectHomeSongs - Deterministic Selection Logic', () => {
    it('returns empty array when no songs provided', () => {
      const result = selectHomeSongs([]);
      expect(result).toEqual([]);
    });

    it('returns all songs when less than 6 total', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Song A', artist: 'Artist 1', ownerId: 'dude' },
        { id: 's2', title: 'Song B', artist: 'Artist 2', ownerId: 'dude' },
        { id: 's3', title: 'Song C', artist: 'Artist 3', ownerId: 'dude' },
      ];

      const result = selectHomeSongs(songs);
      expect(result).toHaveLength(3);
      expect(result).toEqual(songs);
    });

    it('limits to 2 songs per artist', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Song A1', artist: 'Artist A', ownerId: 'dude' },
        { id: 's2', title: 'Song A2', artist: 'Artist A', ownerId: 'dude' },
        { id: 's3', title: 'Song A3', artist: 'Artist A', ownerId: 'dude' }, // Should be excluded
        { id: 's4', title: 'Song B1', artist: 'Artist B', ownerId: 'dude' },
        { id: 's5', title: 'Song B2', artist: 'Artist B', ownerId: 'dude' },
        { id: 's6', title: 'Song C1', artist: 'Artist C', ownerId: 'dude' },
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(5); // 2+2+1 (limited to max 6, but also 2 per artist)
      expect(result.filter((s) => s.artist === 'Artist A')).toHaveLength(2);
      expect(result.find((s) => s.id === 's3')).toBeUndefined(); // Third song from Artist A excluded
    });

    it('limits to 3 artists total', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Song A', artist: 'Artist A', ownerId: 'dude' },
        { id: 's2', title: 'Song B', artist: 'Artist B', ownerId: 'dude' },
        { id: 's3', title: 'Song C', artist: 'Artist C', ownerId: 'dude' },
        { id: 's4', title: 'Song D', artist: 'Artist D', ownerId: 'dude' }, // Fourth artist - excluded
        { id: 's5', title: 'Song E', artist: 'Artist E', ownerId: 'dude' }, // Fifth artist - excluded
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(3);
      const uniqueArtists = new Set(result.map((s) => s.artist));
      expect(uniqueArtists.size).toBeLessThanOrEqual(3);
      expect(result.find((s) => s.artist === 'Artist D')).toBeUndefined();
      expect(result.find((s) => s.artist === 'Artist E')).toBeUndefined();
    });

    it('limits to maximum 6 songs total', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Song A1', artist: 'Artist A', ownerId: 'dude' },
        { id: 's2', title: 'Song A2', artist: 'Artist A', ownerId: 'dude' },
        { id: 's3', title: 'Song B1', artist: 'Artist B', ownerId: 'dude' },
        { id: 's4', title: 'Song B2', artist: 'Artist B', ownerId: 'dude' },
        { id: 's5', title: 'Song C1', artist: 'Artist C', ownerId: 'dude' },
        { id: 's6', title: 'Song C2', artist: 'Artist C', ownerId: 'dude' },
        { id: 's7', title: 'Song D1', artist: 'Artist D', ownerId: 'dude' }, // Fourth artist - should be excluded
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(6); // Maximum 6 songs
      expect(result.find((s) => s.id === 's7')).toBeUndefined();
    });

    it('is deterministic - same input produces same output', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Hádam', artist: 'Chinaski', ownerId: 'dude' },
        { id: 's2', title: 'Klára', artist: 'Chinaski', ownerId: 'dude' },
        { id: 's3', title: 'Andělé', artist: 'Kabát', ownerId: 'dude' },
        { id: 's4', title: 'Malá dáma', artist: 'Kabát', ownerId: 'dude' },
        { id: 's5', title: 'Holky', artist: 'Žlutý pes', ownerId: 'dude' },
        { id: 's6', title: 'Tancuj', artist: 'Žlutý pes', ownerId: 'dude' },
      ];

      const result1 = selectHomeSongs(songs);
      const result2 = selectHomeSongs(songs);
      const result3 = selectHomeSongs(songs);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('maintains order from input (artist ASC, title ASC assumed)', () => {
      const songs: Song[] = [
        { id: 's1', title: 'A Song', artist: 'Artist A', ownerId: 'dude' },
        { id: 's2', title: 'B Song', artist: 'Artist A', ownerId: 'dude' },
        { id: 's3', title: 'C Song', artist: 'Artist B', ownerId: 'dude' },
        { id: 's4', title: 'D Song', artist: 'Artist B', ownerId: 'dude' },
      ];

      const result = selectHomeSongs(songs);

      // Should maintain input order (already sorted by artist ASC, title ASC)
      expect(result[0]?.id).toBe('s1');
      expect(result[1]?.id).toBe('s2');
      expect(result[2]?.id).toBe('s3');
      expect(result[3]?.id).toBe('s4');
    });

    it('handles mix of artists with different song counts', () => {
      const songs: Song[] = [
        // Artist A: 3 songs (only 2 should be selected)
        { id: 's1', title: 'A1', artist: 'Artist A', ownerId: 'dude' },
        { id: 's2', title: 'A2', artist: 'Artist A', ownerId: 'dude' },
        { id: 's3', title: 'A3', artist: 'Artist A', ownerId: 'dude' },
        // Artist B: 1 song (all selected)
        { id: 's4', title: 'B1', artist: 'Artist B', ownerId: 'dude' },
        // Artist C: 2 songs (all selected)
        { id: 's5', title: 'C1', artist: 'Artist C', ownerId: 'dude' },
        { id: 's6', title: 'C2', artist: 'Artist C', ownerId: 'dude' },
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(5); // 2 from A, 1 from B, 2 from C
      expect(result.filter((s) => s.artist === 'Artist A')).toHaveLength(2);
      expect(result.filter((s) => s.artist === 'Artist B')).toHaveLength(1);
      expect(result.filter((s) => s.artist === 'Artist C')).toHaveLength(2);
    });

    it('stops at 3 artists even if more artists have songs', () => {
      const songs: Song[] = [
        { id: 's1', title: 'A1', artist: 'Artist A', ownerId: 'dude' },
        { id: 's2', title: 'A2', artist: 'Artist A', ownerId: 'dude' },
        { id: 's3', title: 'B1', artist: 'Artist B', ownerId: 'dude' },
        { id: 's4', title: 'B2', artist: 'Artist B', ownerId: 'dude' },
        { id: 's5', title: 'C1', artist: 'Artist C', ownerId: 'dude' },
        { id: 's6', title: 'C2', artist: 'Artist C', ownerId: 'dude' },
        { id: 's7', title: 'D1', artist: 'Artist D', ownerId: 'dude' }, // 4th artist
        { id: 's8', title: 'E1', artist: 'Artist E', ownerId: 'dude' }, // 5th artist
      ];

      const result = selectHomeSongs(songs);

      const artists = new Set(result.map((s) => s.artist));
      expect(artists.size).toBe(3);
      expect(artists.has('Artist D')).toBe(false);
      expect(artists.has('Artist E')).toBe(false);
    });

    it('handles edge case: exactly 6 songs from 3 artists (2 each)', () => {
      const songs: Song[] = [
        { id: 's1', title: 'A1', artist: 'Artist A', ownerId: 'dude' },
        { id: 's2', title: 'A2', artist: 'Artist A', ownerId: 'dude' },
        { id: 's3', title: 'B1', artist: 'Artist B', ownerId: 'dude' },
        { id: 's4', title: 'B2', artist: 'Artist B', ownerId: 'dude' },
        { id: 's5', title: 'C1', artist: 'Artist C', ownerId: 'dude' },
        { id: 's6', title: 'C2', artist: 'Artist C', ownerId: 'dude' },
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(6);
      expect(new Set(result.map((s) => s.artist)).size).toBe(3);
    });
  });

  describe('fetchSongById', () => {
    it('returns null when Firestore document does not exist', async () => {
      mockDoc.mockReturnValue('song-doc-ref');
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await fetchSongById('missing-song');

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'songs', 'missing-song');
      expect(mockGetDoc).toHaveBeenCalledWith('song-doc-ref');
      expect(result).toBeNull();
    });

    it('maps existing Firestore document into Song', async () => {
      mockDoc.mockReturnValue('song-doc-ref');
      mockGetDoc.mockResolvedValue({
        id: 'song-1',
        exists: () => true,
        data: () => ({
          title: 'Song title',
          artist: 'Artist name',
          text: '[G] line',
          chords: ['G', 'D'],
          createdAt: 'ts',
        }),
      });

      const result = await fetchSongById('song-1');

      expect(result).toEqual({
        id: 'song-1',
        title: 'Song title',
        artist: 'Artist name',
        text: '[G] line',
        chords: ['G', 'D'],
        createdAt: 'ts',
      });
    });
  });

  describe('createSong', () => {
    it('persists song data and returns created song with id', async () => {
      mockCollection.mockReturnValue('songs-collection-ref');
      mockAddDoc.mockResolvedValue({ id: 'new-song-id' });

      const result = await createSong({
        title: 'New song',
        artist: 'New artist',
        text: '[Am] new line',
        chords: ['Am', 'C'],
        ownerId: 'dude',
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        'songs-collection-ref',
        expect.objectContaining({
          title: 'New song',
          artist: 'New artist',
          text: '[Am] new line',
          chords: ['Am', 'C'],
          ownerId: 'dude',
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'new-song-id',
          title: 'New song',
          artist: 'New artist',
          text: '[Am] new line',
          chords: ['Am', 'C'],
          ownerId: 'dude',
        })
      );
    });
  });

  describe('updateSong', () => {
    it('updates Firestore document and returns merged result', async () => {
      mockDoc.mockReturnValue('song-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await updateSong('song-9', {
        title: 'Updated title',
        artist: 'Updated artist',
        text: '[D] updated',
        chords: ['D', 'A'],
        ownerId: 'dude',
      });

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'songs', 'song-9');
      expect(mockUpdateDoc).toHaveBeenCalledWith('song-doc-ref', {
        title: 'Updated title',
        artist: 'Updated artist',
        text: '[D] updated',
        chords: ['D', 'A'],
        ownerId: 'dude',
      });
      expect(result).toEqual({
        id: 'song-9',
        title: 'Updated title',
        artist: 'Updated artist',
        text: '[D] updated',
        chords: ['D', 'A'],
        ownerId: 'dude',
      });
    });
  });
});
