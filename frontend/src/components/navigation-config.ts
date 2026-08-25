import type { SvgIconComponent } from '@mui/icons-material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SubjectOutlinedIcon from '@mui/icons-material/SubjectOutlined';
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import type { AuthRole } from '@/lib/auth';

export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  icon: SvgIconComponent;
}

const TUTOR_NAVIGATION: readonly NavigationItem[] = [
  { id: 'classes', title: 'Classes', href: '/classes', icon: SchoolOutlinedIcon },
  { id: 'students', title: 'Students', href: '/students', icon: GroupsOutlinedIcon },
  { id: 'upload', title: 'Upload', href: '/upload', icon: FileUploadOutlinedIcon },
  { id: 'profile', title: 'Profile', href: '/profile', icon: PersonIcon },
];

const STUDENT_NAVIGATION: readonly NavigationItem[] = [
  { id: 'home', title: 'Home', href: '/', icon: HomeOutlinedIcon },
  { id: 'worksheets', title: 'Worksheets', href: '/worksheets', icon: DescriptionOutlinedIcon },
  { id: 'upload', title: 'Upload', href: '/upload', icon: FileUploadOutlinedIcon },
  { id: 'mistakes', title: 'Mistakes', href: '/mistakes', icon: WarningAmberOutlinedIcon },
  { id: 'progress', title: 'Progress', href: '/progress', icon: TrendingUpOutlinedIcon },
  { id: 'topics', title: 'Topics', href: '/topics', icon: TopicOutlinedIcon },
  { id: 'subject-profile', title: 'Subject Profile', href: '/subject-profile', icon: SubjectOutlinedIcon },
  { id: 'profile', title: 'Profile', href: '/profile', icon: PersonIcon },
];

export function getNavigationItems(role: AuthRole): readonly NavigationItem[] {
  return role === 'TUTOR' ? TUTOR_NAVIGATION : STUDENT_NAVIGATION;
}

export function isNavigationItemSelected(item: NavigationItem, pathname: string): boolean {
  return item.href === '/'
    ? pathname === '/'
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getWorkspaceLabel(role: AuthRole): string {
  return role === 'TUTOR' ? 'Tutor Workspace' : 'Student Workspace';
}
