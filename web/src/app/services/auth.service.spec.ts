import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { AuthService } from './auth.service';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

const values = new Map<string, string>();

const storage = {
  getItem(key: string): string | null {
    return values.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    values.set(key, value);
  },
  removeItem(key: string): void {
    values.delete(key);
  }
};

describe('AuthService characterization', () => {
  let service: AuthService;

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', storage);
    vi.mocked(axios.post).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts the existing login contract and returns its response body', async () => {
    const response = { token: 'test-token', user: { username: 'student', displayName: 'Student', role: 'STUDENT' } };
    vi.mocked(axios.post).mockResolvedValueOnce({ data: response } as never);
    service = new AuthService();

    const result = await service.login({ username: 'student', password: 'Workshop123!', client: 'angular-workshop' });

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/auth/login',
      { username: 'student', password: 'Workshop123!', client: 'angular-workshop' },
      { timeout: 5000 }
    );
    expect(result).toEqual(response);
  });

  it('stores and reads the session in localStorage and clears it on logout', () => {
    service = new AuthService();
    const user = { username: 'student', displayName: 'Student', role: 'STUDENT' };
    service.saveSession({ token: 'test-token', user });

    expect(service.getToken()).toBe('test-token');
    expect(service.getUser()).toEqual(user);

    service.clearSession();
    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
  });

  it('merges saved preferences over defaults and falls back on malformed JSON', () => {
    service = new AuthService();
    values.set('workshop_preferences', JSON.stringify({ compact: true }));
    expect(service.getPreferences()).toEqual({ theme: 'light', showTips: true, compact: true });

    values.set('workshop_preferences', '{invalid');
    expect(service.getPreferences()).toEqual({ theme: 'light', showTips: true, compact: false });
  });

  it('saves preferences using the existing storage key', () => {
    service = new AuthService();
    service.savePreferences({ theme: 'dark', showTips: false, compact: true });
    expect(values.get('workshop_preferences')).toBe(JSON.stringify({ theme: 'dark', showTips: false, compact: true }));
  });
});