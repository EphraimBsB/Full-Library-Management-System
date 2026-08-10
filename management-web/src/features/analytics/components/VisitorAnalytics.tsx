import React, { useMemo, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid
} from '@mui/material';
import { 
  MenuBook, 
  Search, 
  AccessTime, 
  Devices
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { theme } from '../../../core/theme';

export const VisitorAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [searchQueryFilter, setSearchQueryFilter] = useState('');

  const { data: visits, isLoading, error } = useQuery({
    queryKey: ['recentVisits'],
    queryFn: DashboardService.getRecentVisits,
    refetchInterval: 10000, // Refresh every 10 seconds
  });


  const getDeviceFromUserAgent = (ua: string) => {
    if (!ua) return 'Desktop';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'Mobile';
    if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablet';
    return 'Desktop';
  };

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    return visits.filter((v: any) => {
      // Date filter
      if (dateFilter) {
        const visitDate = new Date(v.visitedAt).toISOString().split('T')[0];
        if (visitDate !== dateFilter) return false;
      }
      
      // Device filter
      if (deviceFilter !== 'All') {
        const device = getDeviceFromUserAgent(v.userAgent);
        if (device !== deviceFilter) return false;
      }
      
      // Search Query filter
      if (searchQueryFilter) {
        const query = searchQueryFilter.toLowerCase();
        const sq = v.searchQuery ? v.searchQuery.toLowerCase() : '';
        const pv = v.pageVisited ? v.pageVisited.toLowerCase() : '';
        const rt = v.resourceTitle ? v.resourceTitle.toLowerCase() : '';
        if (!sq.includes(query) && !pv.includes(query) && !rt.includes(query)) return false;
      }
      
      return true;
    });
  }, [visits, dateFilter, deviceFilter, searchQueryFilter]);

  // Aggregated Data for Charts
  const deviceData = useMemo(() => {
    if (!visits) return [];
    const counts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    visits.forEach((v: any) => counts[getDeviceFromUserAgent(v.userAgent)]++);
    return Object.keys(counts).map(name => ({ name, value: counts[name] })).filter(d => d.value > 0);
  }, [visits]);

  const pageData = useMemo(() => {
    if (!visits) return [];
    const counts: Record<string, number> = {};
    visits.forEach((v: any) => {
      const page = v.resourceTitle || v.pageVisited || '/';
      // Exclude the Home Page from the top resource calculation
      if (page !== 'Home Page' && page !== '/' && page !== '/?q=') {
        counts[page] = (counts[page] || 0) + 1;
      }
    });
    return Object.keys(counts).map(name => ({ name, views: counts[name] }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5); // top 5
  }, [visits]);

  // Peak Traffic Hours
  const peakHoursData = useMemo(() => {
    if (!visits) return [];
    const counts: Record<string, number> = {};
    visits.forEach((v: any) => {
      const hour = new Date(v.visitedAt).getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const label = `${hour12} ${ampm}`;
      counts[label] = (counts[label] || 0) + 1;
    });
    // Create an ordered array for charting (could just show the top ones, or chronological)
    return Object.keys(counts).map(name => ({ name, visits: counts[name] })).sort((a, b) => b.visits - a.visits).slice(0, 7);
  }, [visits]);

  // Top Search Queries
  const searchData = useMemo(() => {
    if (!visits) return [];
    const counts: Record<string, number> = {};
    visits.forEach((v: any) => {
      if (v.searchQuery) {
        counts[v.searchQuery] = (counts[v.searchQuery] || 0) + 1;
      }
    });
    return Object.keys(counts).map(name => ({ name, searches: counts[name] })).sort((a, b) => b.searches - a.searches).slice(0, 5);
  }, [visits]);

  // Limit data lengths based on user request
  const top5Pages = pageData.slice(0, 5);
  const top3Searches = searchData.slice(0, 3);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load analytics data</Alert>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#101828', mb: 1 }}>
            Visitor Analytics
          </Typography>
          <Typography sx={{ color: '#667085' }}>
            Monitor real-time browsing sessions across the student portal. Auto-updates every 10 seconds.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Browsing Activities" />
          <Tab label={`Top Resources (${top5Pages.length})`} />
          <Tab label={`Top Search (${top3Searches.length})`} />
          <Tab label="Busiest Time" />
          <Tab label="Most Used Devices" />
        </Tabs>
      </Box>

      {/* Tab 0: Browsing Activities */}
      {activeTab === 0 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #EAECF0' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Filter by Date"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Device</InputLabel>
                  <Select
                    value={deviceFilter}
                    label="Device"
                    onChange={(e) => setDeviceFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Devices</MenuItem>
                    <MenuItem value="Desktop">Desktop</MenuItem>
                    <MenuItem value="Mobile">Mobile</MenuItem>
                    <MenuItem value="Tablet">Tablet</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Resource or Query"
                  size="small"
                  value={searchQueryFilter}
                  onChange={(e) => setSearchQueryFilter(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #EAECF0' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Session ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Page / Resource</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Search Query</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Device</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVisits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#667085' }}>
                    No recent visits match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisits.map((visit: any) => (
                  <TableRow key={visit.id} hover>
                    <TableCell>
                      {new Date(visit.visitedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={visit.sessionId.substring(0, 10) + '...'} 
                        size="small"
                        sx={{ backgroundColor: '#F2F4F7', color: '#344054', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.colors.primary, fontWeight: 500 }}>
                      {visit.resourceTitle || visit.pageVisited || '/'}
                    </TableCell>
                    <TableCell>
                      {visit.searchQuery ? (
                        <Chip label={`"${visit.searchQuery}"`} size="small" variant="outlined" color="secondary" />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {visit.duration ? `${visit.duration}s` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getDeviceFromUserAgent(visit.userAgent)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
      )}

      {/* Tab 1: Top Resources */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #EAECF0' }}>
          <List>
            {top5Pages.length > 0 ? top5Pages.map((page, index) => (
              <ListItem key={index} divider={index !== top5Pages.length - 1}>
                <ListItemIcon>
                  <MenuBook sx={{ color: theme.colors.primary }} />
                </ListItemIcon>
                <ListItemText 
                  primary={page.name} 
                  secondary={`${page.views} total views`} 
                  primaryTypographyProps={{ fontWeight: 600, color: '#101828' }}
                />
              </ListItem>
            )) : (
              <Typography sx={{ color: '#667085', p: 2, textAlign: 'center' }}>No resources accessed yet.</Typography>
            )}
          </List>
        </Paper>
      )}

      {/* Tab 2: Top Search */}
      {activeTab === 2 && (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #EAECF0' }}>
          <List>
            {top3Searches.length > 0 ? top3Searches.map((search, index) => (
              <ListItem key={index} divider={index !== top3Searches.length - 1}>
                <ListItemIcon>
                  <Search sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={`"${search.name}"`} 
                  secondary={`${search.searches} students searched for this`} 
                  primaryTypographyProps={{ fontWeight: 600, color: '#101828' }}
                />
              </ListItem>
            )) : (
              <Typography sx={{ color: '#667085', p: 2, textAlign: 'center' }}>No searches recorded yet.</Typography>
            )}
          </List>
        </Paper>
      )}

      {/* Tab 3: Busiest Time */}
      {activeTab === 3 && (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #EAECF0' }}>
          <List>
            {peakHoursData.length > 0 ? peakHoursData.map((hour, index) => (
              <ListItem key={index} divider={index !== peakHoursData.length - 1}>
                <ListItemIcon>
                  <AccessTime sx={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={hour.name} 
                  secondary={`${hour.visits} active sessions during this hour`} 
                  primaryTypographyProps={{ fontWeight: 600, color: '#101828' }}
                />
              </ListItem>
            )) : (
              <Typography sx={{ color: '#667085', p: 2, textAlign: 'center' }}>No traffic recorded yet.</Typography>
            )}
          </List>
        </Paper>
      )}

      {/* Tab 4: Most Used Devices */}
      {activeTab === 4 && (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #EAECF0' }}>
          <List>
            {deviceData.length > 0 ? deviceData.map((device, index) => (
              <ListItem key={index} divider={index !== deviceData.length - 1}>
                <ListItemIcon>
                  <Devices sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={device.name} 
                  secondary={`${device.value} visits from this device type`} 
                  primaryTypographyProps={{ fontWeight: 600, color: '#101828' }}
                />
              </ListItem>
            )) : (
              <Typography sx={{ color: '#667085', p: 2, textAlign: 'center' }}>No device data recorded yet.</Typography>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};
