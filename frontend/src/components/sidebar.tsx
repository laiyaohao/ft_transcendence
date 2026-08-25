'use client';

import * as React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { type Theme } from '@mui/material/styles';
import { usePathname } from 'next/navigation';

import SidebarContext from '@/context/sidebar-context';
import ViewportContext from '@/context/viewport-context';
import { getBrowserSession, type AuthRole } from '@/lib/auth';
import strings from '@/locales/en.json';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '@/utils/constants';
import getDrawerSxTransitionMixin from '@/utils/mixins';

import {
  getNavigationItems,
  getWorkspaceLabel,
  isNavigationItemSelected,
} from './navigation-config';
import SidebarPageItem from './sidebar-page-item';

export interface SidebarProps {
  disableCollapsibleSidebar?: boolean;
  container?: Element;
}

export default function Sidebar({
  disableCollapsibleSidebar = false,
  container,
}: SidebarProps) {
  const viewportContext = React.useContext(ViewportContext);
  if (!viewportContext) {
    throw new Error('Viewport context was used without a provider.');
  }
  const { isNavigationExpanded } = viewportContext;

  const sidebarContext = React.useContext(SidebarContext);
  if (!sidebarContext) {
    throw new Error('Sidebar context was used without a provider.');
  }
  const {
    handleSetSidebarExpanded,
    mini,
    isFullyExpanded,
    hasDrawerTransitions,
  } = sidebarContext;

  const pathname = usePathname();
  const [role, setRole] = React.useState<AuthRole | null>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setRole(getBrowserSession()?.role ?? null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const getDrawerContent = React.useCallback(
    (viewport: 'phone' | 'tablet' | 'desktop') => (
      <>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Stack direction="column" sx={{ alignItems: 'start', minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}
            >
              {strings.common.sidebarTitle}
            </Typography>
            {role ? (
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, mt: 0.5, whiteSpace: 'nowrap' }}
              >
                {getWorkspaceLabel(role)}
              </Typography>
            ) : null}
          </Stack>
          {viewport === 'phone' ? (
            <IconButton
              aria-label="Close navigation menu"
              edge="end"
              onClick={handleSetSidebarExpanded(false)}
            >
              <CloseIcon />
            </IconButton>
          ) : null}
        </Toolbar>
        <Box
          component="nav"
          aria-label={`${viewport.charAt(0).toUpperCase()}${viewport.slice(1)} navigation`}
          sx={[
            {
              height: '100%',
              overflow: 'auto',
              scrollbarGutter: mini ? 'stable' : 'auto',
              overflowX: 'hidden',
              pt: !mini ? 0 : 2,
            },
            hasDrawerTransitions
              ? getDrawerSxTransitionMixin(isFullyExpanded, 'padding')
              : null,
          ]}
        >
          <List
            dense
            sx={{
              padding: mini ? 0 : 0.5,
              width: mini ? MINI_DRAWER_WIDTH : 'auto',
            }}
          >
            {role
              ? getNavigationItems(role).map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarPageItem
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      icon={<Icon />}
                      href={item.href}
                      selected={isNavigationItemSelected(item, pathname)}
                    />
                  );
                })
              : null}
          </List>
        </Box>
      </>
    ),
    [handleSetSidebarExpanded, hasDrawerTransitions, isFullyExpanded, mini, pathname, role],
  );

  const getDrawerSharedSx = React.useCallback(
    (isTemporary: boolean) => (drawerTheme: Theme) => {
      const drawerWidth = mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;
      const widthTransitionStyles = getDrawerSxTransitionMixin(
        isNavigationExpanded,
        'width',
      )(drawerTheme);

      return {
        displayPrint: 'none',
        width: drawerWidth,
        flexShrink: 0,
        ...widthTransitionStyles,
        overflowX: 'hidden',
        ...(isTemporary ? { position: 'absolute' } : {}),
        [`& .MuiDrawer-paper`]: {
          position: isTemporary ? 'fixed' : 'absolute',
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundImage: 'none',
          ...widthTransitionStyles,
          overflowX: 'hidden',
        },
      };
    },
    [isNavigationExpanded, mini],
  );

  return (
    <Box component="aside" sx={{ height: '100vh' }}>
      <Drawer
        container={container}
        variant="temporary"
        open={isNavigationExpanded}
        onClose={handleSetSidebarExpanded(false)}
        ModalProps={{ keepMounted: true }}
        sx={[
          { display: { xs: 'block', sm: disableCollapsibleSidebar ? 'block' : 'none', md: 'none' } },
          getDrawerSharedSx(true),
        ]}
      >
        {getDrawerContent('phone')}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={[
          {
            display: {
              xs: 'none',
              sm: disableCollapsibleSidebar ? 'none' : 'block',
              md: 'none',
            },
          },
          getDrawerSharedSx(false),
        ]}
      >
        {getDrawerContent('tablet')}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={[{ display: { xs: 'none', md: 'block' } }, getDrawerSharedSx(false)]}
      >
        {getDrawerContent('desktop')}
      </Drawer>
    </Box>
  );
}
