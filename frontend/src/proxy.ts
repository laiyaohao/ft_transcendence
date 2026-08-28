import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];
const PROTECTED_PATHS = ['/classes', '/students', '/std_upload'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const isAuthenticated = Boolean(token);
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtectedPath && !isAuthenticated) {
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && isAuthenticated && pathname === '/login') {
    // return NextResponse.redirect(new URL('/classes', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/classes', '/students', '/std_upload', '/login', '/signup'],
};
