import React from 'react';
import { Box } from '@mui/material';
import { LeftSidebar } from '../../../shared/components/Layout/LeftSidebar';
import { Topbar } from './Topbar';
import { RightSidebar } from './RightSidebar';
import { theme } from '../../../core/theme';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showTopbar?: boolean;
  showRightSidebar?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  showTopbar = false,
  showRightSidebar = false 
}) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: theme.colors.background }}>
      <LeftSidebar />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showTopbar && <Topbar />}
        
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Box sx={{ 
            flexGrow: 1, 
            minWidth: 0, 
            overflow: 'auto', 
            p: 3, 
            width: '100%',
            maxWidth: '100%',
            scrollbarWidth: 'none', 
            '&::-webkit-scrollbar': { display: 'none' } 
          }}>
            {children}
          </Box>
          
          {showRightSidebar && (
            <Box sx={{ width: 280, flexShrink: 0, overflow: 'hidden' }}>
              <RightSidebar />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
