'use client'

import * as React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

const Wrapper = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  
  const layoutRef = React.useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={layoutRef}
      sx={{
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        height: '100dvh',
        width: '100%',
        // Content pages are light-only; keep the shell on the same canvas so
        // dark-mode overscroll doesn't reveal a seam behind them.
        backgroundColor: 'rgb(253,251,247)',
      }}
    >
      <Sidebar
        container={layoutRef?.current ?? undefined}
      />
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
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            backgroundColor: 'rgb(253,251,247)',
          }}
        >
          {/* <Outlet /> */}
					{children}
        </Box>
      </Box>
    </Box>
  );
}

export default Wrapper;