'use client'
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme, type Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import type {} from '@mui/material/themeCssVarsAugmentation';
import PersonIcon from '@mui/icons-material/Person';
import SidebarContext from '../context/sidebar-context';
import SidebarPageItem from './sidebar-page-item';
import SidebarHeaderItem from './sidebar-header-item';
import SidebarDividerItem from './sidebar-divider-item';
import getDrawerSxTransitionMixin from '@/utils/mixins';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '@/utils/constants';
import ViewportContext from '@/context/viewport-context';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import strings from "../locales/en.json";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined';
import SubjectOutlinedIcon from '@mui/icons-material/SubjectOutlined';


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
    expandedItemIds,
    handleSetSidebarExpanded,
    mini,
    isFullyExpanded,
    hasDrawerTransitions,
   } = sidebarContext;

  const pathname = usePathname();


  

  const getDrawerContent = React.useCallback(
    (viewport: 'phone' | 'tablet' | 'desktop') => (
      <React.Fragment>
        <Toolbar>
          <Stack direction="column" sx={{ alignItems: 'start' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: '700',
                // ml: 1,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {strings.common.sidebarTitle}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: '700',
                mt: 0.3,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {strings.common.sidebarSubtitle}
            </Typography>
          </Stack>
        </Toolbar>
        <Box
          component="nav"
          aria-label={`${viewport.charAt(0).toUpperCase()}${viewport.slice(1)}`}
          sx={[
            {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
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
              mb: 4,
              width: mini ? MINI_DRAWER_WIDTH : 'auto',
              flexGrow: 1,
            }}
          >
            <SidebarPageItem
              id="home"
              title="Home"
              icon={<HomeOutlinedIcon />}
              href="/"
              selected={pathname === '/'}
            />
            <SidebarPageItem
              id="worksheets"
              title="Worksheets"
              icon={<DescriptionOutlinedIcon />}
              href="/worksheets"
              selected={pathname === '/worksheets'}
            />
            <SidebarPageItem
              id="upload"
              title="Upload"
              icon={<FileUploadOutlinedIcon />}
              href="/upload"
              selected={pathname === '/upload'}
            />
            <SidebarPageItem
              id="mistakes"
              title="Mistakes"
              icon={<WarningAmberOutlinedIcon />}
              href="/mistakes"
              selected={pathname === '/mistakes'}
            />
            <SidebarPageItem
              id="progress"
              title="Progress"
              icon={<TrendingUpOutlinedIcon />}
              href="/progress"
              selected={pathname === '/progress'}
            />
            <SidebarPageItem
              id="topics"
              title="Topics"
              icon={<TopicOutlinedIcon />}
              href="/topics"
              selected={pathname === '/topics'}
            />
            <SidebarPageItem
              id="subject-profile"
              title="Subject Profile"
              icon={<SubjectOutlinedIcon />}
              href="/subject-profile"
              selected={pathname === '/subject-profile'}
            />
            <SidebarPageItem
              id="profile"
              title="Profile"
              icon={<PersonIcon />}
              href="/profile"
              selected={pathname === '/profile'}
            />
            {/* <SidebarDividerItem /> */}
            {/* <SidebarHeaderItem>Example items</SidebarHeaderItem> */}
            {/* <SidebarPageItem
              id="reports"
              title="Reports"
              icon={<BarChartIcon />}
              href="/reports"
              selected={!!pathname.startsWith('/reports/')}
              defaultExpanded={!!pathname.startsWith('/reports/')}
              expanded={expandedItemIds.includes('reports')}
              nestedNavigation={
                <List
                  dense
                  sx={{
                    padding: 0,
                    my: 1,
                    pl: mini ? 0 : 1,
                    minWidth: 240,
                  }}
                >
                  <SidebarPageItem
                    id="sales"
                    title="Sales"
                    icon={<DescriptionIcon />}
                    href="/reports/sales"
                    selected={!!pathname.startsWith('/reports/sales')}
                  />
                  <SidebarPageItem
                    id="traffic"
                    title="Traffic"
                    icon={<DescriptionIcon />}
                    href="/reports/traffic"
                    selected={!!pathname.startsWith('/reports/traffic')}
                  />
                </List>
              }
            /> */}
          </List>
          <Stack direction="column" sx={{ alignItems: 'start' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: '700',
                // ml: 1,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              Upload Button here
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: '700',
                mt: 0.3,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              Student information here
            </Typography>
          </Stack>
        </Box>
      </React.Fragment>
    ),
    [mini, hasDrawerTransitions, isFullyExpanded, expandedItemIds, pathname],
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
          ...widthTransitionStyles,
          overflowX: 'hidden',
        },
      };
    },
    [isNavigationExpanded, mini],
  );

  return (
    <div style={{ height: '100%' }}>
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