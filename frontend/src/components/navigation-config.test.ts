import { describe, expect, it } from 'vitest';

import {
  getNavigationItems,
  getWorkspaceLabel,
  isNavigationItemSelected,
} from './navigation-config';

describe('role-aware navigation configuration', () => {
  it('returns only Tutor destinations for a Tutor', () => {
    const items = getNavigationItems('TUTOR');

    expect(items.map(({ title, href }) => ({ title, href }))).toEqual([
      { title: 'Classes', href: '/classes' },
      { title: 'Students', href: '/students' },
      { title: 'Upload', href: '/upload' },
      { title: 'Profile', href: '/profile' },
    ]);
    expect(items.some((item) => item.href === '/progress')).toBe(false);
    expect(getWorkspaceLabel('TUTOR')).toBe('Tutor Workspace');
  });

  it('returns only Student destinations for a Student', () => {
    const items = getNavigationItems('STUDENT');

    expect(items.map((item) => item.href)).toEqual([
      '/',
      '/worksheets',
      '/upload',
      '/mistakes',
      '/progress',
      '/topics',
      '/subject-profile',
      '/profile',
    ]);
    expect(items.some((item) => item.href === '/classes')).toBe(false);
    expect(getWorkspaceLabel('STUDENT')).toBe('Student Workspace');
  });

  it('selects exact and nested destinations without selecting Home for every path', () => {
    const home = getNavigationItems('STUDENT')[0];
    const worksheets = getNavigationItems('STUDENT')[1];

    expect(isNavigationItemSelected(home, '/')).toBe(true);
    expect(isNavigationItemSelected(home, '/worksheets')).toBe(false);
    expect(isNavigationItemSelected(worksheets, '/worksheets')).toBe(true);
    expect(isNavigationItemSelected(worksheets, '/worksheets/42')).toBe(true);
    expect(isNavigationItemSelected(worksheets, '/progress')).toBe(false);
  });
});
