import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Home from '../Home.vue';
import { Timestamp } from 'firebase/firestore';

// Mock router for navigation assertions
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock auth composable - default to authenticated host
const mockUser = vi.hoisted(() => ({ value: { uid: 'host-123', displayName: 'Test Host' } }));
const mockIsAuthenticated = vi.hoisted(() => ({ value: true }));
vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock session and song services
const mockFetchLatestSessions = vi.fn();
const mockCreateSession = vi.fn();
const mockFetchHomeSongs = vi.fn();

vi.mock('../../lib/session', () => ({
  fetchLatestSessions: mockFetchLatestSessions,
  createSession: mockCreateSession,
}));

vi.mock('../../lib/song', () => ({
  fetchHomeSongs: mockFetchHomeSongs,
}));

// Type definitions based on current_task.md requirements
export interface Session {
  id: string;
  name: string;
  hostId: string;
  hostDisplayName: string;
  isActive: boolean;
  pin: string;
  joinedBy: string[];
  createdAt: Timestamp;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  chords?: string;
  createdAt?: Timestamp;
}

describe('Home Page - Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchLatestSessions.mockResolvedValue([]);
    mockFetchHomeSongs.mockResolvedValue([]);
  });

  describe('Basic Rendering', () => {
    it('renders home view with test ID', async () => {
      render(Home);
      expect(screen.getByTestId('home-view')).toBeInTheDocument();
    });

    it('renders top navigation', async () => {
      render(Home);
      // TopNavigation component should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders sessions section with heading', async () => {
      render(Home);
      expect(screen.getByTestId('home-sessions-section')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /relace|session/i })).toBeInTheDocument();
    });

    it('renders songs section with heading', async () => {
      render(Home);
      expect(screen.getByTestId('home-songs-section')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /písn|song/i })).toBeInTheDocument();
    });
  });

  describe('Sessions Display', () => {
    it('displays latest 3 sessions when available', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          name: 'Večerní Jam',
          hostId: 'host-123',
          hostDisplayName: 'Test Host',
          isActive: true,
          pin: '1234',
          joinedBy: ['host-123'],
          createdAt: Timestamp.fromDate(new Date('2026-01-31T20:00:00')),
        },
        {
          id: 'session-2',
          name: 'Ranní Cvičení',
          hostId: 'other-host',
          hostDisplayName: 'Other Host',
          isActive: true,
          pin: '5678',
          joinedBy: ['host-123', 'other-host'],
          createdAt: Timestamp.fromDate(new Date('2026-01-31T10:00:00')),
        },
        {
          id: 'session-3',
          name: 'Odpolední Hudba',
          hostId: 'host-123',
          hostDisplayName: 'Test Host',
          isActive: false,
          pin: '9999',
          joinedBy: ['host-123'],
          createdAt: Timestamp.fromDate(new Date('2026-01-30T15:00:00')),
        },
      ];

      mockFetchLatestSessions.mockResolvedValue(mockSessions);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Večerní Jam')).toBeInTheDocument();
        expect(screen.getByText('Ranní Cvičení')).toBeInTheDocument();
        expect(screen.getByText('Odpolední Hudba')).toBeInTheDocument();
      });
    });

    it('shows empty state when no sessions exist', async () => {
      mockFetchLatestSessions.mockResolvedValue([]);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText(/žádné relace|no session/i)).toBeInTheDocument();
      });
    });

    it('displays View all sessions link', async () => {
      render(Home);

      const viewAllLink = screen.getByRole('link', { name: /zobrazit všechny|view all/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute('href', expect.stringContaining('/sessions'));
    });

    it('fetches latest sessions on mount', async () => {
      render(Home);

      await waitFor(() => {
        expect(mockFetchLatestSessions).toHaveBeenCalledWith('host-123');
      });
    });
  });

  describe('Songs Display', () => {
    it('displays deterministic selection of songs (≤6 songs, ≤3 artists)', async () => {
      const mockSongs: Song[] = [
        { id: 's1', title: 'Hádam', artist: 'Chinaski', chords: 'Am C G' },
        { id: 's2', title: 'Klára', artist: 'Chinaski', chords: 'D A E' },
        { id: 's3', title: 'Andělé', artist: 'Kabát', chords: 'Em G D' },
        { id: 's4', title: 'Malá dáma', artist: 'Kabát', chords: 'C G Am' },
        { id: 's5', title: 'Holky z naší školky', artist: 'Žlutý pes', chords: 'G D C' },
        { id: 's6', title: 'Tancuj', artist: 'Žlutý pes', chords: 'A E D' },
      ];

      mockFetchHomeSongs.mockResolvedValue(mockSongs);

      render(Home);

      await waitFor(() => {
        // Should show up to 2 songs per artist, up to 3 artists, max 6 songs
        expect(screen.getByText('Hádam')).toBeInTheDocument();
        expect(screen.getByText('Klára')).toBeInTheDocument();
        expect(screen.getByText('Andělé')).toBeInTheDocument();
        expect(screen.getByText('Malá dáma')).toBeInTheDocument();
        expect(screen.getByText('Holky z naší školky')).toBeInTheDocument();
        expect(screen.getByText('Tancuj')).toBeInTheDocument();
      });
    });

    it('limits to 2 songs per artist', async () => {
      const mockSongs: Song[] = [
        { id: 's1', title: 'Song A1', artist: 'Artist A' },
        { id: 's2', title: 'Song A2', artist: 'Artist A' },
        { id: 's3', title: 'Song A3', artist: 'Artist A' }, // Should be excluded
        { id: 's4', title: 'Song B1', artist: 'Artist B' },
        { id: 's5', title: 'Song B2', artist: 'Artist B' },
        { id: 's6', title: 'Song C1', artist: 'Artist C' },
      ];

      mockFetchHomeSongs.mockResolvedValue(mockSongs);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Song A1')).toBeInTheDocument();
        expect(screen.getByText('Song A2')).toBeInTheDocument();
        expect(screen.queryByText('Song A3')).not.toBeInTheDocument(); // Third song from Artist A excluded
      });
    });

    it('limits to 3 artists', async () => {
      const mockSongs: Song[] = [
        { id: 's1', title: 'Song A', artist: 'Artist A' },
        { id: 's2', title: 'Song B', artist: 'Artist B' },
        { id: 's3', title: 'Song C', artist: 'Artist C' },
        { id: 's4', title: 'Song D', artist: 'Artist D' }, // Fourth artist, should be excluded
      ];

      mockFetchHomeSongs.mockResolvedValue(mockSongs);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Song A')).toBeInTheDocument();
        expect(screen.getByText('Song B')).toBeInTheDocument();
        expect(screen.getByText('Song C')).toBeInTheDocument();
        expect(screen.queryByText('Song D')).not.toBeInTheDocument(); // Fourth artist excluded
      });
    });

    it('displays View all songs link', async () => {
      render(Home);

      const viewAllLink = screen.getByRole('link', {
        name: /zobrazit všechny písně|view all songs/i,
      });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute('href', expect.stringContaining('/songs'));
    });

    it('fetches home songs on mount', async () => {
      render(Home);

      await waitFor(() => {
        expect(mockFetchHomeSongs).toHaveBeenCalled();
      });
    });
  });

  describe('Action Buttons', () => {
    it('renders create session button with aria-label', async () => {
      render(Home);

      const createButton = screen.getByLabelText(/vytvořit|create.*session/i);
      expect(createButton).toBeInTheDocument();
      expect(createButton.tagName).toBe('BUTTON');
    });

    it('renders join session link', async () => {
      render(Home);

      const joinLink = screen.getByRole('link', { name: /připojit|join/i });
      expect(joinLink).toBeInTheDocument();
      expect(joinLink).toHaveAttribute('href', expect.stringContaining('/join'));
    });

    it('opens create-session dialog when create button clicked', async () => {
      const user = userEvent.setup();
      render(Home);

      const createButton = screen.getByLabelText(/vytvořit|create.*session/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-session-dialog')).toBeInTheDocument();
        expect(
          screen.getByRole('dialog', { name: /vytvořit partu|create session/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Create Session Dialog', () => {
    it('renders dialog with session name input', async () => {
      const user = userEvent.setup();
      render(Home);

      const createButton = screen.getByLabelText(/vytvořit|create/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/název relace|session name/i)).toBeInTheDocument();
        expect(screen.getByTestId('create-session-submit')).toBeInTheDocument();
      });
    });

    it('creates session with valid name', async () => {
      const user = userEvent.setup();
      const newSession: Session = {
        id: 'new-session-id',
        name: 'Nová Relace',
        hostId: 'host-123',
        hostDisplayName: 'Test Host',
        isActive: true,
        pin: '4567',
        joinedBy: ['host-123'],
        createdAt: Timestamp.now(),
      };

      mockCreateSession.mockResolvedValue(newSession);
      mockFetchLatestSessions.mockResolvedValueOnce([]).mockResolvedValueOnce([newSession]);

      render(Home);

      // Open dialog
      const createButton = screen.getByLabelText(/vytvořit|create/i);
      await user.click(createButton);

      // Fill in session name
      const nameInput = screen.getByLabelText(/název relace|session name/i);
      await user.type(nameInput, 'Nová Relace');

      // Submit
      const submitButton = screen.getByTestId('create-session-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSession).toHaveBeenCalledWith({
          name: 'Nová Relace',
          hostId: 'host-123',
          hostDisplayName: 'Test Host',
        });
      });
    });

    it('closes dialog and refreshes sessions list after successful creation', async () => {
      const user = userEvent.setup();
      const newSession: Session = {
        id: 'new-session-id',
        name: 'Nová Relace',
        hostId: 'host-123',
        hostDisplayName: 'Test Host',
        isActive: true,
        pin: '4567',
        joinedBy: ['host-123'],
        createdAt: Timestamp.now(),
      };

      mockCreateSession.mockResolvedValue(newSession);
      mockFetchLatestSessions.mockResolvedValueOnce([]).mockResolvedValueOnce([newSession]);

      render(Home);

      // Open and submit
      await user.click(screen.getByLabelText(/vytvořit|create/i));
      await user.type(screen.getByLabelText(/název relace|session name/i), 'Nová Relace');
      await user.click(screen.getByTestId('create-session-submit'));

      await waitFor(() => {
        // Dialog should close
        expect(screen.queryByTestId('create-session-dialog')).not.toBeInTheDocument();
        // Sessions list should be refreshed
        expect(mockFetchLatestSessions).toHaveBeenCalledTimes(2);
        // New session should appear
        expect(screen.getByText('Nová Relace')).toBeInTheDocument();
      });
    });

    it('shows error message on creation failure', async () => {
      const user = userEvent.setup();
      mockCreateSession.mockRejectedValue(new Error('Firestore error'));

      render(Home);

      await user.click(screen.getByLabelText(/vytvořit|create/i));
      await user.type(screen.getByLabelText(/název relace|session name/i), 'Test');
      await user.click(screen.getByTestId('create-session-submit'));

      await waitFor(() => {
        expect(screen.getByText(/chyba|error/i)).toBeInTheDocument();
      });
    });

    it('requires session name to be non-empty', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/vytvořit|create/i));

      const submitButton = screen.getByTestId('create-session-submit');
      expect(submitButton).toBeDisabled();
    });

    it('can close dialog with close button', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/vytvořit|create/i));

      const closeButton = screen.getByLabelText(/zavřít|close/i);
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('create-session-dialog')).not.toBeInTheDocument();
      });
    });

    it('can close dialog with Escape key', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/vytvořit|create/i));

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('create-session-dialog')).not.toBeInTheDocument();
      });
    });

    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/vytvořit|create/i));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(Home);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Sections should use h2
      const sessionsHeading = screen.getByRole('heading', { name: /relace|session/i });
      expect(sessionsHeading.tagName).toBe('H2');

      const songsHeading = screen.getByRole('heading', { name: /písn|song/i });
      expect(songsHeading.tagName).toBe('H2');
    });

    it('uses list semantics for sessions', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          name: 'Test Session',
          hostId: 'host-123',
          hostDisplayName: 'Test Host',
          isActive: true,
          pin: '1234',
          joinedBy: ['host-123'],
          createdAt: Timestamp.now(),
        },
      ];

      mockFetchLatestSessions.mockResolvedValue(mockSessions);
      render(Home);

      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();
        expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
      });
    });

    it('uses list semantics for songs', async () => {
      const mockSongs: Song[] = [{ id: 's1', title: 'Test Song', artist: 'Test Artist' }];

      mockFetchHomeSongs.mockResolvedValue(mockSongs);
      render(Home);

      await waitFor(() => {
        const lists = screen.getAllByRole('list');
        expect(lists.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('has visible focus states on interactive elements', async () => {
      render(Home);

      const createButton = screen.getByLabelText(/vytvořit|create/i);
      createButton.focus();

      // Button should be focused
      expect(createButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when fetching sessions fails', async () => {
      mockFetchLatestSessions.mockRejectedValue(new Error('Network error'));

      render(Home);

      await waitFor(() => {
        expect(screen.getByText(/chyba.*načítání|error.*loading/i)).toBeInTheDocument();
      });
    });

    it('shows error message when fetching songs fails', async () => {
      mockFetchHomeSongs.mockRejectedValue(new Error('Network error'));

      render(Home);

      await waitFor(() => {
        expect(screen.getByText(/chyba.*načítání|error.*loading/i)).toBeInTheDocument();
      });
    });

    it('continues to show UI even when data fetch fails', async () => {
      mockFetchLatestSessions.mockRejectedValue(new Error('Network error'));
      mockFetchHomeSongs.mockRejectedValue(new Error('Network error'));

      render(Home);

      // Home view should still be visible
      expect(screen.getByTestId('home-view')).toBeInTheDocument();
      expect(screen.getByTestId('home-sessions-section')).toBeInTheDocument();
      expect(screen.getByTestId('home-songs-section')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator while fetching sessions', async () => {
      // Make the promise never resolve during this test
      mockFetchLatestSessions.mockImplementation(() => new Promise(() => {}));

      render(Home);

      expect(screen.getByText(/načítání|loading/i)).toBeInTheDocument();
    });

    it('shows loading indicator while fetching songs', async () => {
      mockFetchHomeSongs.mockImplementation(() => new Promise(() => {}));

      render(Home);

      expect(screen.getByText(/načítání|loading/i)).toBeInTheDocument();
    });
  });
});
