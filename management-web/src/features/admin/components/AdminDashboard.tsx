import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Tab, 
  Tabs,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

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
      id={`admin-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [logType, setLogType] = useState<'error' | 'combined' | 'system'>('combined');
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  
  const { data: healthData, isLoading: isLoadingHealth, error: healthError } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: adminService.getSystemHealth,
    refetchInterval: 30000, // Refetch every 30s
  });

  const { data: logsData, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['systemLogs', logType],
    queryFn: () => adminService.getLogs(logType, 200),
    refetchInterval: 5000, // Auto-refresh logs every 5 seconds
  });

  const { data: queueData, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['queueStats'],
    queryFn: adminService.getQueueStats,
    refetchInterval: 30000,
  });

  const { data: dbData, isLoading: isLoadingDb } = useQuery({
    queryKey: ['dbStats'],
    queryFn: adminService.getDbStats,
    refetchInterval: 60000,
  });

  const { data: backupsData, refetch: refetchBackups } = useQuery({
    queryKey: ['listBackups'],
    queryFn: adminService.listBackups,
  });

  const clearCacheMutation = useMutation({
    mutationFn: adminService.clearCache,
    onSuccess: (data) => {
      alert(data.message);
    }
  });

  const triggerBackupMutation = useMutation({
    mutationFn: adminService.triggerBackup,
    onSuccess: (data) => {
      alert(data.message);
      refetchBackups();
    }
  });

  const restoreBackupMutation = useMutation({
    mutationFn: adminService.restoreBackup,
    onSuccess: (data) => {
      alert(data.message);
    },
    onError: () => {
      alert('Failed to restore backup. Please check the server logs.');
    }
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        System Administration
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="System Health" />
          <Tab label="Server Logs" />
          <Tab label="Data & Queues" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {isLoadingHealth ? (
          <CircularProgress />
        ) : healthError ? (
          <Alert severity="error">Failed to load system health data.</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Typography color="textSecondary" gutterBottom>
                  Memory Usage
                </Typography>
                <Typography variant="h5">
                  {healthData?.memory?.usagePercentage}%
                </Typography>
                <Typography variant="body2">
                  {((healthData?.memory?.used || 0) / 1024 / 1024 / 1024).toFixed(2)} GB / {((healthData?.memory?.total || 0) / 1024 / 1024 / 1024).toFixed(2)} GB
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Typography color="textSecondary" gutterBottom>
                  CPU Load Average (1m, 5m, 15m)
                </Typography>
                <Typography variant="h5">
                  {healthData?.cpu?.loadAverage.map(l => l.toFixed(2)).join(', ')}
                </Typography>
                <Typography variant="body2">
                  Cores: {healthData?.cpu?.cores}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Typography color="textSecondary" gutterBottom>
                  System Uptime
                </Typography>
                <Typography variant="h5">
                  {((healthData?.uptime || 0) / 3600).toFixed(2)} Hours
                </Typography>
                <Typography variant="body2">
                  Node: {healthData?.nodeVersion} ({healthData?.platform})
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Log Type</InputLabel>
            <Select
              value={logType}
              label="Log Type"
              onChange={(e) => setLogType(e.target.value as 'error' | 'combined' | 'system')}
            >
              <MenuItem value="combined">Combined (All)</MenuItem>
              <MenuItem value="error">Errors Only</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => refetchLogs()}>
            Refresh Logs
          </Button>
        </Box>

        <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', overflowX: 'auto' }}>
          {isLoadingLogs ? (
            <CircularProgress />
          ) : logsData?.message ? (
            <Typography color="error">{logsData.message}</Typography>
          ) : (
            <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 600, overflowY: 'auto' }}>
              {logsData?.logs?.length === 0 ? (
                <Typography>No logs found.</Typography>
              ) : (
                logsData?.logs?.map((log, index) => (
                  <div key={index} style={{ marginBottom: 8, borderBottom: '1px solid #333', paddingBottom: 4 }}>
                    {typeof log === 'string' ? log : (
                      <>
                        <span style={{ color: '#569cd6' }}>[{log.timestamp || new Date().toISOString()}]</span>{' '}
                        <span style={{ color: log.level === 'error' ? '#f44336' : (log.level === 'warn' ? '#ff9800' : '#4caf50') }}>
                          {log.level ? `[${log.level.toUpperCase()}]` : '[INFO]'}
                        </span>{' '}
                        <span>{log.message || log.context || JSON.stringify(log)}</span>
                        {log.trace && (
                          <div style={{ color: '#f44336', marginTop: 4, paddingLeft: 16, fontSize: '0.9em' }}>
                            {log.trace}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </Box>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
             <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                System Caching
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Clear the in-memory cache manually to forcefully sync data.
              </Typography>
              <Button 
                variant="contained" 
                color="warning" 
                onClick={() => clearCacheMutation.mutate()}
                disabled={clearCacheMutation.isPending}
              >
                {clearCacheMutation.isPending ? 'Clearing...' : 'Clear System Cache'}
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Database Management
              </Typography>
              {isLoadingDb ? <CircularProgress size={24} /> : (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">Status: <strong>{dbData?.status}</strong></Typography>
                  <Typography variant="body2">Type: <strong>{dbData?.type?.toUpperCase()}</strong></Typography>
                  <Typography variant="body2">Estimated Size: <strong>{dbData?.sizeMb} MB</strong></Typography>
                </Box>
              )}
              <Box sx={{ mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => triggerBackupMutation.mutate()}
                  disabled={triggerBackupMutation.isPending}
                  fullWidth
                >
                  {triggerBackupMutation.isPending ? 'Triggering...' : 'Trigger Manual Backup'}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Restore from Backup
              </Typography>
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                Warning: Restoring will completely overwrite current data.
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Select Backup File</InputLabel>
                <Select
                  value={selectedBackup}
                  label="Select Backup File"
                  onChange={(e) => setSelectedBackup(e.target.value)}
                >
                  {backupsData?.backups?.map((file) => (
                    <MenuItem key={file} value={file}>{file}</MenuItem>
                  ))}
                  {(!backupsData?.backups || backupsData.backups.length === 0) && (
                    <MenuItem value="" disabled>No backups found</MenuItem>
                  )}
                </Select>
              </FormControl>

              <Button 
                variant="outlined" 
                color="error" 
                fullWidth
                disabled={!selectedBackup || restoreBackupMutation.isPending}
                onClick={() => {
                  if (window.confirm('Are you absolutely sure? This will wipe all current users and books and replace them with the backup data!')) {
                    restoreBackupMutation.mutate(selectedBackup);
                  }
                }}
              >
                {restoreBackupMutation.isPending ? 'Restoring...' : 'Restore Selected Backup'}
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Background Queues (BullMQ)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {isLoadingQueue ? <CircularProgress size={24} /> : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography color="textSecondary">Waiting</Typography>
                    <Typography variant="h6">{queueData?.stats.waiting || 0}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography color="textSecondary">Active</Typography>
                    <Typography variant="h6">{queueData?.stats.active || 0}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography color="textSecondary">Failed</Typography>
                    <Typography variant="h6" color="error">{queueData?.stats.failed || 0}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography color="textSecondary">Completed</Typography>
                    <Typography variant="h6" color="success.main">{queueData?.stats.completed || 0}</Typography>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}
