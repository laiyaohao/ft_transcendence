import * as React from 'react';

const SidebarContext = React.createContext<{
  expandedItemIds: string[];
  handleSetSidebarExpanded: (newExpanded: boolean) => () => void
  handlePageItemClick: (id: string, hasNestedNavigation: boolean) => void;
  mini: boolean;
  isFullyExpanded: boolean;
  setIsFullyExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isFullyCollapsed: boolean;
  setIsFullyCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  hasDrawerTransitions: boolean;
} | null>(null);

export default SidebarContext;