import React from 'react';
import { Box } from '@mui/material';
import { ActiveMembers } from './ActiveMembers';
import { InHouseReadings } from './InHouseReadings';

export const RightSidebar: React.FC = () => {
  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto', 
      bgcolor: 'white',
      borderLeft: '1px solid #EAECF0',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    }}>
      <InHouseReadings />
      <ActiveMembers />
    </Box>
  );
};
