import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Home from '../Home.vue';
import { Timestamp } from 'firebase/firestore';

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

// Mock router for navigation assertions
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock auth composable - default to authenticated host
const mockUser = vi.hoisted(() => mockRef({ uid: 'host-123', displayName: 'Test Host' }));
const mockIsAuthenticated = vi.hoisted(() => mockRef(true));
vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: router.push }),
}));

// Mock session and song services - hoisted with proper initialization
const mocks = vi.hoisted(() => ({
  mockFetchLatestSessions: vi.fn(),
  mockCreateSession: vi.fn(),
  mockFetchHomeSongs: vi.fn(),
}));

vi.mock('../../lib/session', () => ({
  fetchLatestSessions: mocks.mockFetchLatestSessions,
  createSession: mocks.mockCreateSession,
}));

vi.mock('../../lib/song', () => ({
  fetchHomeSongs: mocks.mockFetchHomeSongs,
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
    mocks.mockFetchLatestSessions.mockResolvedValue([]);
    mocks.mockFetchHomeSongs.mockResolvedValue([]);
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

      mocks.mockFetchLatestSessions.mockResolvedValue(mockSessions);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Večerní Jam')).toBeInTheDocument();
        expect(screen.getByText('Ranní Cvičení')).toBeInTheDocument();
        expect(screen.getByText('Odpolední Hudba')).toBeInTheDocument();
      });
    });

    it('shows empty state when no sessions exist', async () => {
      mocks.mockFetchLatestSessions.mockResolvedValue([]);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText(/žádné relace|no session/i)).toBeInTheDocument();
      });
    });

    it('displays View all sessions', async () => {
      render(Home);

      const viewAllLink = screen.getByText('Zobrazit všechny relace');
      expect(viewAllLink).toBeInTheDocument();
    });

    it('fetches latest sessions on mount', async () => {
      render(Home);

      await waitFor(() => {
        expect(mocks.mockFetchLatestSessions).toHaveBeenCalledWith('host-123');
      });
    });
  });

  describe('Songs Display', () => {
    it('renders songs returned by helper', async () => {
      const mockSongs: Song[] = [
        { id: 's1', title: 'Hádam', artist: 'Chinaski', chords: 'Am C G' },
        { id: 's2', title: 'Klára', artist: 'Chinaski', chords: 'D A E' },
        { id: 's3', title: 'Andělé', artist: 'Kabát', chords: 'Em G D' },
        { id: 's4', title: 'Malá dáma', artist: 'Kabát', chords: 'C G Am' },
        { id: 's5', title: 'Holky z naší školky', artist: 'Žlutý pes', chords: 'G D C' },
        { id: 's6', title: 'Tancuj', artist: 'Žlutý pes', chords: 'A E D' },
      ];

      mocks.mockFetchHomeSongs.mockResolvedValue(mockSongs);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Hádam')).toBeInTheDocument();
        expect(screen.getByText('Klára')).toBeInTheDocument();
        expect(screen.getByText('Andělé')).toBeInTheDocument();
        expect(screen.getByText('Malá dáma')).toBeInTheDocument();
        expect(screen.getByText('Holky z naší školky')).toBeInTheDocument();
        expect(screen.getByText('Tancuj')).toBeInTheDocument();
      });
    });

    it('renders multiple songs for the same artist', async () => {
      const mockSongs: Song[] = [
        { id: 's1', title: 'Song A1', artist: 'Artist A' },
        { id: 's2', title: 'Song A2', artist: 'Artist A' },
        { id: 's3', title: 'Song A3', artist: 'Artist A' },
        { id: 's4', title: 'Song B1', artist: 'Artist B' },
        { id: 's5', title: 'Song B2', artist: 'Artist B' },
        { id: 's6', title: 'Song C1', artist: 'Artist C' },
      ];

      mocks.mockFetchHomeSongs.mockResolvedValue(mockSongs);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Song A1')).toBeInTheDocument();
        expect(screen.getByText('Song A2')).toBeInTheDocument();
        expect(screen.getByText('Song A3')).toBeInTheDocument();
      });
    });

    it('renders songs across multiple artists', async () => {
      const mockSongs: Song[] = [
        { id: 's1', title: 'Song A', artist: 'Artist A' },
        { id: 's2', title: 'Song B', artist: 'Artist B' },
        { id: 's3', title: 'Song C', artist: 'Artist C' },
        { id: 's4', title: 'Song D', artist: 'Artist D' },
      ];

      mocks.mockFetchHomeSongs.mockResolvedValue(mockSongs);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Song A')).toBeInTheDocument();
        expect(screen.getByText('Song B')).toBeInTheDocument();
        expect(screen.getByText('Song C')).toBeInTheDocument();
        expect(screen.getByText('Song D')).toBeInTheDocument();
      });
    });

    it('renders all songs returned by helper', async () => {
      const mockSongs: Song[] = [
        { id: 's1', title: 'Song 1', artist: 'Artist A' },
        { id: 's2', title: 'Song 2', artist: 'Artist A' },
        { id: 's3', title: 'Song 3', artist: 'Artist B' },
        { id: 's4', title: 'Song 4', artist: 'Artist B' },
        { id: 's5', title: 'Song 5', artist: 'Artist C' },
        { id: 's6', title: 'Song 6', artist: 'Artist C' },
        { id: 's7', title: 'Song 7', artist: 'Artist D' },
      ];

      mocks.mockFetchHomeSongs.mockResolvedValue(mockSongs);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument();
        expect(screen.getByText('Song 2')).toBeInTheDocument();
        expect(screen.getByText('Song 3')).toBeInTheDocument();
        expect(screen.getByText('Song 4')).toBeInTheDocument();
        expect(screen.getByText('Song 5')).toBeInTheDocument();
        expect(screen.getByText('Song 6')).toBeInTheDocument();
        expect(screen.getByText('Song 7')).toBeInTheDocument();
      });
    });

    it('displays View all songs', async () => {
      render(Home);

      const viewAllLink = screen.getByText(/zobrazit všechny písně|view all songs/i);
      expect(viewAllLink).toBeInTheDocument();
    });

    it('fetches home songs on mount', async () => {
      render(Home);

      await waitFor(() => {
        expect(mocks.mockFetchHomeSongs).toHaveBeenCalled();
      });
    });
  });

  describe('Action Buttons', () => {
    it('renders create session button with aria-label', async () => {
      render(Home);

      const createButton = screen.getByLabelText(/Vytvořit novou relaci/i);
      expect(createButton).toBeInTheDocument();
      expect(createButton.tagName).toBe('BUTTON');
    });

    it('renders join session link', async () => {
      render(Home);

      const joinLink = screen.getByLabelText('Připojit se k relaci');
      expect(joinLink).toBeInTheDocument();
    });

    it('opens create-song dialog when create song button is clicked', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/Vytvořit novou píseň/i));

      await waitFor(() => {
        expect(screen.getByTestId('create-song-dialog')).toBeInTheDocument();
      });
    });

    it('navigates to song detail when a song item is clicked', async () => {
      const user = userEvent.setup();

      mocks.mockFetchHomeSongs.mockResolvedValue([
        { id: 'song-1', title: 'Song One', artist: 'ArtistA' },
      ]);

      render(Home);

      await waitFor(() => {
        expect(screen.getByText('Song One')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Song One'));

      expect(router.push).toHaveBeenCalledWith({ path: '/song/song-1' });
    });

    it('opens create-session dialog when create button clicked', async () => {
      const user = userEvent.setup();
      render(Home);

      const createButton = screen.getByLabelText(/Vytvořit novou relaci/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-session-dialog')).toBeInTheDocument();
        expect(
          screen.getByRole('dialog', { name: /vytvořit relaci|create session/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Create Session Dialog', () => {
    it('renders dialog with session name input', async () => {
      const user = userEvent.setup();
      render(Home);

      const createButton = screen.getByLabelText(/Vytvořit novou relaci/i);
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

      mocks.mockCreateSession.mockResolvedValue(newSession);
      mocks.mockFetchLatestSessions.mockResolvedValueOnce([]).mockResolvedValueOnce([newSession]);

      render(Home);

      // Open dialog
      const createButton = screen.getByLabelText(/Vytvořit novou relaci/i);
      await user.click(createButton);

      // Fill in session name
      const nameInput = screen.getByLabelText(/název relace|session name/i);
      await user.type(nameInput, 'Nová Relace');

      // Submit
      const submitButton = screen.getByTestId('create-session-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mocks.mockCreateSession).toHaveBeenCalledWith({
          name: 'Nová Relace',
          hostId: 'host-123',
          hostDisplayName: 'Test Host',
        });
      });
    });

    it('closes dialog and routes to session after successful creation', async () => {
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

      mocks.mockCreateSession.mockResolvedValue(newSession);
      mocks.mockFetchLatestSessions.mockResolvedValueOnce([]).mockResolvedValueOnce([newSession]);

      render(Home);

      // Open and submit
      await user.click(screen.getByLabelText(/Vytvořit novou relaci/i));
      await user.type(screen.getByLabelText(/název relace|session name/i), 'Nová Relace');
      await user.click(screen.getByTestId('create-session-submit'));

      await waitFor(() => {
        // Dialog should close
        expect(screen.queryByTestId('create-session-dialog')).not.toBeVisible();

        // Session page should be shown with session ID in query params
        expect(router.push).toHaveBeenCalledWith({
          path: '/session',
          query: {
            sessionId: 'new-session-id',
          },
        });
      });
    });

    it('shows error message on creation failure', async () => {
      const user = userEvent.setup();
      mocks.mockCreateSession.mockRejectedValue(new Error('Firestore error'));

      render(Home);

      await user.click(screen.getByLabelText(/Vytvořit novou relaci/i));
      await user.type(screen.getByLabelText(/název relace|session name/i), 'Test');
      await user.click(screen.getByTestId('create-session-submit'));

      await waitFor(() => {
        expect(
          screen.getByText(/Nepodařilo se vytvořit relaci. Zkus to prosím znovu./i)
        ).toBeInTheDocument();
      });
    });

    it('requires session name to be non-empty', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/Vytvořit novou relaci/i));

      // Wait for input field to be in the document (ensures dialog is fully ready)
      await waitFor(() => {
        expect(screen.getByLabelText(/název relace|session name/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('create-session-submit');
      expect(submitButton).toBeDisabled();
    });

    it('can close dialog with close button', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/Vytvořit novou relaci/i));

      // Wait for close button to be in the document
      await waitFor(() => {
        expect(screen.getByLabelText(/Zavřít dialog relace/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/Zavřít dialog relace/i);
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('create-session-dialog')).not.toBeVisible();
      });
    });

    it('can close dialog with Escape key', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/Vytvořit novou relaci/i));

      // Wait for input field to be ready (ensures ARK dialog is fully mounted)
      const nameInput = await waitFor(() => screen.getByLabelText(/název relace|session name/i));

      // Focus the input for better keyboard testing
      nameInput.focus();

      // Small delay to ensure ARK internal focus management is complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('create-session-dialog')).not.toBeVisible();
      });
    });

    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(Home);

      await user.click(screen.getByLabelText(/Vytvořit novou relaci/i));

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

      mocks.mockFetchLatestSessions.mockResolvedValue(mockSessions);
      render(Home);

      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();
        expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
      });
    });

    it('uses list semantics for songs', async () => {
      const mockSongs: Song[] = [{ id: 's1', title: 'Test Song', artist: 'Test Artist' }];

      mocks.mockFetchHomeSongs.mockResolvedValue(mockSongs);
      render(Home);

      await waitFor(() => {
        const lists = screen.getAllByRole('list');
        expect(lists.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('has visible focus states on interactive elements', async () => {
      render(Home);

      const createButton = screen.getByLabelText(/Vytvořit novou píseň/i);
      createButton.focus();

      // Button should be focused
      expect(createButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when fetching sessions fails', async () => {
      mocks.mockFetchLatestSessions.mockRejectedValue(new Error('Network error'));

      render(Home);

      await waitFor(() => {
        expect(screen.getByText(/chyba.*načítání|error.*loading/i)).toBeInTheDocument();
      });
    });

    it('shows error message when fetching songs fails', async () => {
      mocks.mockFetchHomeSongs.mockRejectedValue(new Error('Network error'));

      render(Home);

      await waitFor(() => {
        expect(screen.getByText(/chyba.*načítání|error.*loading/i)).toBeInTheDocument();
      });
    });

    it('continues to show UI even when data fetch fails', async () => {
      mocks.mockFetchLatestSessions.mockRejectedValue(new Error('Network error'));
      mocks.mockFetchHomeSongs.mockRejectedValue(new Error('Network error'));

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
      mocks.mockFetchLatestSessions.mockImplementation(() => new Promise(() => {}));

      render(Home);

      expect(screen.getByText(/načítání|loading/i)).toBeInTheDocument();
    });

    it('shows loading indicator while fetching songs', async () => {
      mocks.mockFetchHomeSongs.mockImplementation(() => new Promise(() => {}));

      render(Home);

      expect(screen.getByText(/načítání|loading/i)).toBeInTheDocument();
    });
  });
});
