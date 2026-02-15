import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import DataManagement from './DataManagement';
import PasswordSettings from './PasswordSettings';
import ProfileSettings from './ProfileSettings';
import SystemConfigs from './SystemConfigs';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, fontSize: '1.5rem' }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: '#667085', fontSize: '0.8rem', mb: 2 }}>
          Manage your profile, security settings, system configurations, and data operations
        </Typography>
      </Box>
      
      <Box>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: '0.75rem',
              minHeight: 48,
            }
          }}
        >
          <Tab label="Profile" {...a11yProps(0)} />
          <Tab label="Security" {...a11yProps(1)} />
          <Tab label="System Configs" {...a11yProps(2)} />
          <Tab label="Data Management" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <ProfileSettings />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <PasswordSettings />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <SystemConfigs />
      </TabPanel>

      <TabPanel value={value} index={3}>
        <DataManagement />
      </TabPanel>
    </Box>
  );
};

export default SettingsPage;
