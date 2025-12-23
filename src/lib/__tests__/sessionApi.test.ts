import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// TDD: module to be implemented
import { joinSession } from '../sessionApi';

const originalFetch = globalThis.fetch;

describe('Session API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
  });

  it('sends POST /api/join-session with { pin, deviceId }', async () => {
    const resp = {
      sessionId: 's1',
      sessionName: 'Zkouška',
      hostName: 'Hostitel',
    };
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => resp } as any);

    const result = await joinSession('1234', 'device-abc');

    expect(fetch).toHaveBeenCalledWith(
      '/api/join-session',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ pin: '1234', deviceId: 'device-abc' }),
      })
    );
    expect(result).toEqual(resp);
  });

  it('maps typed failures to Czech-friendly messages', async () => {
    const errorBody = { code: 'invalid' } as const;
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => errorBody,
    } as any);

    await expect(joinSession('9999', 'd1')).rejects.toMatchObject({
      code: 'invalid',
      message: 'Neplatný PIN',
    });
  });

  it('maps "expired" to "PIN vypršel"', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ code: 'expired' }),
    } as any);
    await expect(joinSession('9999', 'd1')).rejects.toMatchObject({
      code: 'expired',
      message: 'PIN vypršel',
    });
  });

  it('maps "rate_limited" to "Příliš mnoho pokusů, zkuste to později"', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ code: 'rate_limited' }),
    } as any);
    await expect(joinSession('9999', 'd1')).rejects.toMatchObject({
      code: 'rate_limited',
      message: 'Příliš mnoho pokusů, zkuste to později',
    });
  });

  it('maps "closed" to "Session je ukončena"', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ code: 'closed' }),
    } as any);
    await expect(joinSession('9999', 'd1')).rejects.toMatchObject({
      code: 'closed',
      message: 'Session je ukončena',
    });
  });

  it('network errors are propagated without consuming attempts', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    await expect(joinSession('1234', 'd1')).rejects.toThrow('Network error');
  });
});
