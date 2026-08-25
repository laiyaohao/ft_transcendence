'use client';

import * as React from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import ColorModeSelect from '@/theme/color-mode-select';
import strings from "../locales/en.json";
import Button from '@mui/material/Button';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useRouter } from 'next/navigation';
import { clearAuthSession } from '@/lib/auth';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: 'solid',
  borderColor: (theme.vars ?? theme).palette.divider,
  boxShadow: 'none',
  zIndex: theme.zIndex.drawer + 1,
}));

export default function Topbar() {
  const router = useRouter();

  const handleLogout = () => {
    clearAuthSession();
    router.replace('/login');
  };

  return (
    <AppBar position="relative" sx={{ displayPrint: 'none' }} data-testid="topbar">
      <Toolbar sx={{ backgroundColor: 'inherit', }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Stack direction="row" sx={{ alignItems: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: '700',
                    ml: 1,
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                  }}
                >
                  {strings.common.topbarTitle}
                </Typography>
              </Stack>
            </Link>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', marginLeft: 'auto' }}
          >
            <Stack direction="row" sx={{ alignItems: 'center' }}>
              {/* <ThemeSwitcher /> */}
              <ColorModeSelect />
              <Button
                color="inherit"
                startIcon={<LogoutOutlinedIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
