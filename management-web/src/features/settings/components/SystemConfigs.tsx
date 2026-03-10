import React, { useState } from 'react';
import {
  Paper,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import CategoriesManagement from './CategoriesManagement';
import SubjectsManagement from './SubjectsManagement';
import BookTypesManagement from './BookTypesManagement';
import PublishersManagement from './PublishersManagement';
import LocationsManagement from './LocationsManagement';
import ShelvesManagement from './ShelvesManagement';
import MembershipTypesManagement from './MembershipTypesManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`system-config-tabpanel-${index}`}
      aria-labelledby={`system-config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

function a11yProps(index: number) {
  return {
    id: `system-config-tab-${index}`,
    'aria-controls': `system-config-tabpanel-${index}`,
  };
}

const SystemConfigs: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    // <Container maxWidth="lg">
    <Paper sx={{ padding: 3 }}>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="system configuration tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: 12,
              minHeight: 40,
            }
          }}
        >
          <Tab label="Categories" {...a11yProps(0)} />
          <Tab label="Subjects" {...a11yProps(1)} />
          <Tab label="Book Types" {...a11yProps(2)} />
          <Tab label="Publishers" {...a11yProps(3)} />
          <Tab label="Locations" {...a11yProps(4)} />
          <Tab label="Shelves" {...a11yProps(5)} />
          <Tab label="Membership Types" {...a11yProps(6)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <CategoriesManagement />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <SubjectsManagement />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <BookTypesManagement />
      </TabPanel>

      <TabPanel value={value} index={3}>
        <PublishersManagement />
      </TabPanel>

      <TabPanel value={value} index={4}>
        <LocationsManagement />
      </TabPanel>

      <TabPanel value={value} index={5}>
        <ShelvesManagement />
      </TabPanel>

      <TabPanel value={value} index={6}>
        {/* <UserRolesManagement />
        </TabPanel>

        <TabPanel value={value} index={7}> */}
        <MembershipTypesManagement />
      </TabPanel>
    </Paper>
    // </Container>
  );
};

export default SystemConfigs;
