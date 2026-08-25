'use client';

import * as React from 'react';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import ViewportContext from '@/context/viewport-context';
import {
  clearAuthSession,
  getBrowserSession,
  getRoleHome,
  type AuthSession,
} from '@/lib/auth';
import strings from '@/locales/en.json';
import ColorModeSelect from '@/theme/color-mode-select';

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
  const viewportContext = React.useContext(ViewportContext);
  if (!viewportContext) {
    throw new Error('Viewport context was used without a provider.');
  }

  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [accountAnchor, setAccountAnchor] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSession(getBrowserSession());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const closeAccountMenu = () => setAccountAnchor(null);

  const openProfile = () => {
    closeAccountMenu();
    router.push('/profile');
  };

  const handleLogout = () => {
    closeAccountMenu();
    clearAuthSession();
    router.replace('/login');
  };

  return (
    <AppBar position="relative" sx={{ displayPrint: 'none' }} data-testid="topbar">
      <Toolbar sx={{ backgroundColor: 'inherit', gap: 1 }}>
        <IconButton
          aria-label="Open navigation menu"
          color="inherit"
          edge="start"
          onClick={() => viewportContext.handleToggleHeaderMenu(true)}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Link
          href={session ? getRoleHome(session.role) : '/'}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}
          >
            {strings.common.topbarTitle}
          </Typography>
        </Link>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: 'auto' }}>
          <ColorModeSelect />
          <IconButton
            aria-label="Open account menu"
            aria-controls={accountAnchor ? 'account-menu' : undefined}
            aria-expanded={accountAnchor ? 'true' : undefined}
            aria-haspopup="menu"
            color="inherit"
            onClick={(event) => setAccountAnchor(event.currentTarget)}
          >
            <AccountCircleOutlinedIcon />
          </IconButton>
        </Stack>

        <Menu
          id="account-menu"
          anchorEl={accountAnchor}
          open={Boolean(accountAnchor)}
          onClose={closeAccountMenu}
          slotProps={{ list: { 'aria-label': 'Account options' } }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          {session ? (
            <Box sx={{ px: 2, py: 1, maxWidth: 280 }}>
              <Typography variant="body2" noWrap>{session.email}</Typography>
              <Typography variant="caption" color="text.secondary">
                {session.role === 'TUTOR' ? 'Tutor' : 'Student'}
              </Typography>
            </Box>
          ) : null}
          <Divider />
          <MenuItem onClick={openProfile}>
            <PersonOutlineIcon fontSize="small" sx={{ mr: 1.5 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
