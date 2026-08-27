'use client'
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { type Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type {} from '@mui/material/themeCssVarsAugmentation';
import SidebarContext from '../context/sidebar-context';
import getDrawerSxTransitionMixin from '@/utils/mixins';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '@/utils/constants';
import ViewportContext from '@/context/viewport-context';
import strings from "../locales/en.json";
import { useToast } from '@/providers/toast-provider';

export interface SidebarProps {
  disableCollapsibleSidebar?: boolean;
  container?: Element;
}

type NavItem = {
  id: string;
  label: string;
  href?: string;
  path: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', path: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
  { id: 'classes', label: 'My Classes', href: '/classes', path: 'M3 9l9-5 9 5-9 5-9-5zm0 6l9 5 9-5' },
  { id: 'students', label: 'Students', href: '/students', path: 'M17 20v-2a4 4 0 0 0-8 0v2M13 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm8 12v-2a4 4 0 0 0-3-3.9' },
  { id: 'worksheets', label: 'Worksheets', href: '/worksheets', path: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4' },
  { id: 'bank', label: 'Question Bank', href: '/question-bank', path: 'M4 7h16v12H4zM4 7l2-3h12l2 3M9 12h6' },
  { id: 'marking', label: 'AI Review', href: '/marking', path: 'M12 3a9 9 0 1 0 9 9M12 8v4l3 2M17 3l1.5 3L22 7.5 18.5 9 17 12l-1.5-3L12 7.5 15.5 6z' },
  { id: 'reports', label: 'Reports', href: '/reports', path: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { id: 'settings', label: 'Settings', href: '/settings', path: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-2.87-1.2l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.6 15H2.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.87l-.06-.06A2 2 0 1 1 6.57 5.24l.06.06A1.7 1.7 0 0 0 9.5 4.1V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.87 1.2l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.4 11h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.99 0z' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto' }}>
      <path d={d} />
    </svg>
  );
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (!item.href) return false;
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
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
   } = sidebarContext;

  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const getDrawerContent = React.useCallback(
    (viewport: 'phone' | 'tablet' | 'desktop') => (
      <Box
        component="nav"
        aria-label={`${viewport.charAt(0).toUpperCase()}${viewport.slice(1)}`}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FBF9F5',
          overflow: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Toolbar sx={{ display: 'block', px: mini ? 1 : '22px', pt: '22px', pb: '16px' }}>
          <Typography
            sx={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: '#2A2622',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {mini ? strings.common.sidebarTitle.slice(0, 1) : strings.common.sidebarTitle}
          </Typography>
          {!mini && (
            <Typography sx={{ fontSize: 12, color: '#A09488', mt: 0.375 }}>
              {strings.common.sidebarSubtitle}
            </Typography>
          )}
        </Toolbar>

        <Box sx={{ px: mini ? 1 : '14px', pb: '16px' }}>
          <ButtonBase
            onClick={() => router.push('/worksheets/generate')}
            sx={{
              width: '100%',
              justifyContent: 'center',
              gap: 1,
              backgroundColor: '#9E3A24',
              color: '#FBF9F5',
              borderRadius: '9px',
              px: mini ? 1 : 1.75,
              py: 1.375,
              fontSize: 13.5,
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(42,38,34,.12)',
              '&:hover': { backgroundColor: '#8A3120' },
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            {!mini && 'New Worksheet'}
          </ButtonBase>
        </Box>

        <Stack component="ul" sx={{ flex: 1, px: '12px', gap: '2px', listStyle: 'none', m: 0 }}>
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item, pathname);
            const content = (
              <ButtonBase
                onClick={item.href ? undefined : () => showToast(`${item.label} is coming soon.`)}
                sx={{
                  width: '100%',
                  justifyContent: mini ? 'center' : 'flex-start',
                  gap: '11px',
                  textAlign: 'left',
                  px: mini ? 1 : '12px',
                  py: '9px',
                  borderRadius: '8px',
                  fontSize: 13.5,
                  fontWeight: 500,
                  backgroundColor: active ? '#F4E4DE' : 'transparent',
                  color: active ? '#9E3A24' : '#5A544C',
                  '&:hover': { backgroundColor: active ? '#F4E4DE' : '#F4EFE6' },
                }}
              >
                <NavIcon d={item.path} />
                {!mini && <Box component="span" sx={{ flex: 1 }}>{item.label}</Box>}
              </ButtonBase>
            );
            return (
              <Box component="li" key={item.id}>
                {item.href ? (
                  <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </Box>
            );
          })}
        </Stack>

        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', p: '14px', borderTop: '1px solid #EDE6DB' }}
        >
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#9E3A24', color: '#FBF9F5', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flex: '0 0 auto' }}>
            SC
          </Box>
          {!mini && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sarah Chen
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#A09488' }}>Lead Instructor</Typography>
            </Box>
          )}
        </Stack>
      </Box>
    ),
    [mini, pathname, router, showToast],
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
          position: 'absolute',
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundImage: 'none',
          borderRight: '1px solid #EDE6DB',
          ...widthTransitionStyles,
          overflowX: 'hidden',
        },
      };
    },
    [isNavigationExpanded, mini],
  );

  return (
    <div style={{ height: '100vh' }}>
      <Drawer
        container={container}
        variant="temporary"
        open={isNavigationExpanded}
        onClose={handleSetSidebarExpanded(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={[
          {
            display: {
              xs: 'block',
              sm: disableCollapsibleSidebar ? 'block' : 'none',
              md: 'none',
            },
          },
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
    </div>
  );
}
