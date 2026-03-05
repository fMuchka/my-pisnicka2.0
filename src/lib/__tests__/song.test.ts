import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectHomeSongs, fetchHomeSongs } from '../song';
import type { Song } from '../song';

// Mock Firestore
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    limit: (...args: unknown[]) => mockLimit(...args),
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
        { id: 's1', title: 'Song A', artist: 'Artist 1' },
        { id: 's2', title: 'Song B', artist: 'Artist 2' },
        { id: 's3', title: 'Song C', artist: 'Artist 3' },
      ];

      const result = selectHomeSongs(songs);
      expect(result).toHaveLength(3);
      expect(result).toEqual(songs);
    });

    it('limits to 2 songs per artist', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Song A1', artist: 'Artist A' },
        { id: 's2', title: 'Song A2', artist: 'Artist A' },
        { id: 's3', title: 'Song A3', artist: 'Artist A' }, // Should be excluded
        { id: 's4', title: 'Song B1', artist: 'Artist B' },
        { id: 's5', title: 'Song B2', artist: 'Artist B' },
        { id: 's6', title: 'Song C1', artist: 'Artist C' },
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(5); // 2+2+1 (limited to max 6, but also 2 per artist)
      expect(result.filter((s) => s.artist === 'Artist A')).toHaveLength(2);
      expect(result.find((s) => s.id === 's3')).toBeUndefined(); // Third song from Artist A excluded
    });

    it('limits to 3 artists total', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Song A', artist: 'Artist A' },
        { id: 's2', title: 'Song B', artist: 'Artist B' },
        { id: 's3', title: 'Song C', artist: 'Artist C' },
        { id: 's4', title: 'Song D', artist: 'Artist D' }, // Fourth artist - excluded
        { id: 's5', title: 'Song E', artist: 'Artist E' }, // Fifth artist - excluded
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
        { id: 's1', title: 'Song A1', artist: 'Artist A' },
        { id: 's2', title: 'Song A2', artist: 'Artist A' },
        { id: 's3', title: 'Song B1', artist: 'Artist B' },
        { id: 's4', title: 'Song B2', artist: 'Artist B' },
        { id: 's5', title: 'Song C1', artist: 'Artist C' },
        { id: 's6', title: 'Song C2', artist: 'Artist C' },
        { id: 's7', title: 'Song D1', artist: 'Artist D' }, // Fourth artist - should be excluded
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(6); // Maximum 6 songs
      expect(result.find((s) => s.id === 's7')).toBeUndefined();
    });

    it('is deterministic - same input produces same output', () => {
      const songs: Song[] = [
        { id: 's1', title: 'Hádam', artist: 'Chinaski' },
        { id: 's2', title: 'Klára', artist: 'Chinaski' },
        { id: 's3', title: 'Andělé', artist: 'Kabát' },
        { id: 's4', title: 'Malá dáma', artist: 'Kabát' },
        { id: 's5', title: 'Holky', artist: 'Žlutý pes' },
        { id: 's6', title: 'Tancuj', artist: 'Žlutý pes' },
      ];

      const result1 = selectHomeSongs(songs);
      const result2 = selectHomeSongs(songs);
      const result3 = selectHomeSongs(songs);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('maintains order from input (artist ASC, title ASC assumed)', () => {
      const songs: Song[] = [
        { id: 's1', title: 'A Song', artist: 'Artist A' },
        { id: 's2', title: 'B Song', artist: 'Artist A' },
        { id: 's3', title: 'C Song', artist: 'Artist B' },
        { id: 's4', title: 'D Song', artist: 'Artist B' },
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
        { id: 's1', title: 'A1', artist: 'Artist A' },
        { id: 's2', title: 'A2', artist: 'Artist A' },
        { id: 's3', title: 'A3', artist: 'Artist A' },
        // Artist B: 1 song (all selected)
        { id: 's4', title: 'B1', artist: 'Artist B' },
        // Artist C: 2 songs (all selected)
        { id: 's5', title: 'C1', artist: 'Artist C' },
        { id: 's6', title: 'C2', artist: 'Artist C' },
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(5); // 2 from A, 1 from B, 2 from C
      expect(result.filter((s) => s.artist === 'Artist A')).toHaveLength(2);
      expect(result.filter((s) => s.artist === 'Artist B')).toHaveLength(1);
      expect(result.filter((s) => s.artist === 'Artist C')).toHaveLength(2);
    });

    it('stops at 3 artists even if more artists have songs', () => {
      const songs: Song[] = [
        { id: 's1', title: 'A1', artist: 'Artist A' },
        { id: 's2', title: 'A2', artist: 'Artist A' },
        { id: 's3', title: 'B1', artist: 'Artist B' },
        { id: 's4', title: 'B2', artist: 'Artist B' },
        { id: 's5', title: 'C1', artist: 'Artist C' },
        { id: 's6', title: 'C2', artist: 'Artist C' },
        { id: 's7', title: 'D1', artist: 'Artist D' }, // 4th artist
        { id: 's8', title: 'E1', artist: 'Artist E' }, // 5th artist
      ];

      const result = selectHomeSongs(songs);

      const artists = new Set(result.map((s) => s.artist));
      expect(artists.size).toBe(3);
      expect(artists.has('Artist D')).toBe(false);
      expect(artists.has('Artist E')).toBe(false);
    });

    it('handles edge case: exactly 6 songs from 3 artists (2 each)', () => {
      const songs: Song[] = [
        { id: 's1', title: 'A1', artist: 'Artist A' },
        { id: 's2', title: 'A2', artist: 'Artist A' },
        { id: 's3', title: 'B1', artist: 'Artist B' },
        { id: 's4', title: 'B2', artist: 'Artist B' },
        { id: 's5', title: 'C1', artist: 'Artist C' },
        { id: 's6', title: 'C2', artist: 'Artist C' },
      ];

      const result = selectHomeSongs(songs);

      expect(result).toHaveLength(6);
      expect(new Set(result.map((s) => s.artist)).size).toBe(3);
    });
  });

  describe('fetchHomeSongs - Firestore Query', () => {
    it('queries songs ordered by artist ASC, title ASC with limit 30', async () => {
      const mockDocs = [
        {
          id: 's1',
          data: () => ({ title: 'Song A', artist: 'Artist A', chords: ['C', 'G', 'Am'] }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });
      mockQuery.mockReturnValue('mock-query');
      mockOrderBy.mockReturnValue('mock-orderBy');
      mockLimit.mockReturnValue('mock-limit');

      await fetchHomeSongs();

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'songs');
      expect(mockOrderBy).toHaveBeenCalledWith('artist', 'asc');
      expect(mockOrderBy).toHaveBeenCalledWith('title', 'asc');
      expect(mockLimit).toHaveBeenCalledWith(30);
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('maps Firestore documents to Song objects', async () => {
      const mockDocs = [
        {
          id: 's1',
          data: () => ({ title: 'Hádam', artist: 'Chinaski', chords: ['Am', 'C', 'G'] }),
        },
        {
          id: 's2',
          data: () => ({ title: 'Andělé', artist: 'Kabát' }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await fetchHomeSongs();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 's1',
        title: 'Hádam',
        artist: 'Chinaski',
        text: undefined,
        chords: ['Am', 'C', 'G'],
        createdAt: undefined,
      });
      expect(result[1]).toEqual({
        id: 's2',
        title: 'Andělé',
        artist: 'Kabát',
        text: undefined,
        chords: undefined,
        createdAt: undefined,
      });
    });

    it('applies selectHomeSongs filtering to results', async () => {
      const mockDocs = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        data: () => ({
          title: `Song ${i}`,
          artist: `Artist ${Math.floor(i / 2)}`, // 2 songs per artist
        }),
      }));

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await fetchHomeSongs();

      // Should be filtered by selectHomeSongs: max 6 songs, 3 artists, 2 per artist
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('returns empty array when no songs in Firestore', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await fetchHomeSongs();

      expect(result).toEqual([]);
    });

    it('throws error on Firestore failure', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(fetchHomeSongs()).rejects.toThrow('Firestore error');
    });
  });
});
