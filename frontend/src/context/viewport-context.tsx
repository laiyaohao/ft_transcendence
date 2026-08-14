import * as React from 'react';
import { type Theme } from '@mui/material/styles';


const ViewportContext = React.createContext<{
  theme: Theme;
  isOverSmViewport: boolean;
  isOverMdViewport: boolean;
  isNavigationExpanded: boolean;
  setIsNavigationExpanded: (newExpanded: boolean) => void;
  handleToggleHeaderMenu: (isExpanded: boolean) => void;
} | null>(null);

export default ViewportContext;