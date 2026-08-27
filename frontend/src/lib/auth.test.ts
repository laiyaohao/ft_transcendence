import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearAuthSession,
  getBrowserSession,
  getRoleHome,
  isPathAllowed,
  parseAuthToken,
  saveAuthSession,
} from './auth';

function token(role: string, expiresAtSeconds: number, email = 'user@example.com') {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: email, role, exp: expiresAtSeconds })}.signature`;
}

describe('authentication sessions', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'auth_token=; path=/; max-age=0';
    vi.useRealTimers();
  });

  it('parses a valid Tutor or Student token and rejects expired or malformed tokens', () => {
    const now = 2_000_000_000_000;
    expect(parseAuthToken(token('TUTOR', now / 1000 + 60), now)?.role).toBe('TUTOR');
    expect(parseAuthToken(token('STUDENT', now / 1000 + 60), now)?.role).toBe('STUDENT');
    expect(parseAuthToken(token('STUDENT', now / 1000 - 1), now)).toBeNull();
    expect(parseAuthToken('malformed')).toBeNull();
    expect(parseAuthToken(token('PARENT', now / 1000 + 60), now)).toBeNull();
  });

  it('stores a role-bound session and clears it during logout', () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const jwt = token('STUDENT', expires, 'student@example.com');

    saveAuthSession({ token: jwt, email: 'student@example.com', role: 'STUDENT' });

    expect(getBrowserSession()).toMatchObject({
      token: jwt,
      email: 'student@example.com',
      role: 'STUDENT',
    });
    expect(document.cookie).toContain(`auth_token=${jwt}`);

    clearAuthSession();
    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(document.cookie).not.toContain('auth_token=');
  });

  it('rejects a response whose role does not match its token claim', () => {
    const jwt = token('STUDENT', Math.floor(Date.now() / 1000) + 3600);

    expect(() => saveAuthSession({
      token: jwt,
      email: 'user@example.com',
      role: 'TUTOR',
    })).toThrow('invalid session');
    expect(localStorage.getItem('jwt_token')).toBeNull();
  });

  it('returns distinct role homes and prevents cross-role navigation', () => {
    expect(getRoleHome('TUTOR')).toBe('/tutor/dashboard');
    expect(isPathAllowed('TUTOR', '/tutor/dashboard')).toBe(true);
    expect(getRoleHome('STUDENT')).toBe('/');
    expect(isPathAllowed('TUTOR', '/classes/42')).toBe(true);
    expect(isPathAllowed('TUTOR', '/questions/42/edit')).toBe(true);
    expect(isPathAllowed('TUTOR', '/tutor/worksheets/new')).toBe(true);
    expect(isPathAllowed('TUTOR', '/progress')).toBe(false);
    expect(isPathAllowed('STUDENT', '/progress')).toBe(true);
    expect(isPathAllowed('STUDENT', '/classes')).toBe(false);
    expect(isPathAllowed('STUDENT', '/questions')).toBe(false);
    expect(isPathAllowed('STUDENT', '/tutor/dashboard')).toBe(false);
    expect(isPathAllowed('STUDENT', '/upload')).toBe(true);
  });
});
