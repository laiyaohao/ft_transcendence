'use client';

import * as React from 'react';
import Box from '@mui/material/Box';

import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

export default function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const [layoutContainer, setLayoutContainer] = React.useState<HTMLDivElement | null>(null);

  return (
    <Box
      ref={setLayoutContainer}
      sx={{
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <Sidebar container={layoutContainer ?? undefined} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
        }}
      >
        <Topbar />
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
