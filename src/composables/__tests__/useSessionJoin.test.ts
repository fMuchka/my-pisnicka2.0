import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';

// TDD: modules to be implemented
import { useSessionJoin } from '../useSessionJoin';
import * as api from '../../lib/sessionApi';

// Mock router
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: router.push }) }));

// Mock api
vi.spyOn(api, 'joinSession');

function setUrl(url: string) {
  // Simulate current URL for auto-detect logic
  Object.defineProperty(window, 'location', {
    value: new URL(url, 'http://localhost'),
    writable: true,
  });
}

describe('useSessionJoin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-detects ?pin= from URL and attempts join when length is 4', async () => {
    setUrl('/join?pin=1234');
    vi.mocked(api.joinSession).mockResolvedValue({
      sessionId: 's1',
      sessionName: 'Zkouška',
      hostName: 'Hostitel',
    } as any);

    const state = useSessionJoin();
    expect(state.status.value).toBe('loading');
    await nextTick();
    expect(api.joinSession).toHaveBeenCalledWith('1234', expect.any(String));
  });

  it('state machine: idle → loading → success; submit disabled while loading', async () => {
    setUrl('/join');
    vi.mocked(api.joinSession).mockResolvedValue({
      sessionId: 's1',
      sessionName: 'Zkouška',
      hostName: 'Hostitel',
    } as any);

    const state = useSessionJoin();
    expect(state.status.value).toBe('idle');
    state.pin.value = '1234';
    const promise = state.submit();
    expect(state.status.value).toBe('loading');
    expect(state.canSubmit.value).toBe(false);
    await promise;
    expect(state.status.value).toBe('success');
    expect(state.canSubmit.value).toBe(true);
  });

  it('on error, retains input and exposes message + retry()', async () => {
    setUrl('/join');
    vi.mocked(api.joinSession).mockRejectedValue({ code: 'invalid', message: 'Neplatný PIN' });

    const state = useSessionJoin();
    state.pin.value = '9999';
    await state.submit();
    expect(state.status.value).toBe('error');
    expect(state.pin.value).toBe('9999');
    expect(state.message.value).toBe('Neplatný PIN');

    vi.mocked(api.joinSession).mockResolvedValue({
      sessionId: 's2',
      sessionName: 'Zkouška 2',
      hostName: 'Hostitel',
    } as any);
    await state.retry();
    expect(state.status.value).toBe('success');
  });

  it('on success, stores metadata and navigates to session view', async () => {
    setUrl('/join');
    vi.mocked(api.joinSession).mockResolvedValue({
      sessionId: 's9',
      sessionName: 'Představení',
      hostName: 'Hostitel',
    } as any);

    const state = useSessionJoin();
    state.pin.value = '1234';
    await state.submit();

    expect(state.session.value).toMatchObject({ sessionId: 's9' });
    expect(router.push).toHaveBeenCalled();
  });
});
