'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { getBrowserSession, getRoleHome, isPathAllowed } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = getBrowserSession();
      if (!session) {
        setAuthorized(false);
        router.replace('/login');
        return;
      }

      if (!isPathAllowed(session.role, pathname)) {
        setAuthorized(false);
        router.replace(getRoleHome(session.role));
        return;
      }

      setAuthorized(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  if (authorized) return children;

  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="info">Checking your access…</Alert>
    </Box>
  );
}
