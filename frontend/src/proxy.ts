import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRoleHome, isPathAllowed, parseAuthToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup'];
const PROTECTED_PATHS = [
  '/',
  '/classes',
  '/students',
  '/worksheets',
  '/upload',
  '/mistakes',
  '/progress',
  '/topics',
  '/subject-profile',
  '/profile',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  // Middleware performs navigation hygiene; backend services still verify the signature.
  const session = token ? parseAuthToken(token) : null;
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`),
  );
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && session) {
    return NextResponse.redirect(new URL(getRoleHome(session.role), request.url));
  }

  if (isProtectedPath && session && !isPathAllowed(session.role, pathname)) {
    return NextResponse.redirect(new URL(getRoleHome(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/classes/:path*',
    '/students/:path*',
    '/worksheets/:path*',
    '/upload/:path*',
    '/mistakes/:path*',
    '/progress/:path*',
    '/topics/:path*',
    '/subject-profile/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
  ],
};
