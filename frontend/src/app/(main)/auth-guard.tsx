'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

const PROTECTED_PATHS = ['/classes', '/students', '/std_upload'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('auth_token='));

    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

    if (isProtectedPath && !token) {
      setShowMessage(true);
      const timer = window.setTimeout(() => {
        router.replace('/login');
      }, 1500);

      return () => window.clearTimeout(timer);
    }
  }, [pathname, router]);

  return (
    <>
      {showMessage ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="info">Please log in to continue. You will be redirected shortly.</Alert>
        </Box>
      ) : null}
      {children}
    </>
  );
}
