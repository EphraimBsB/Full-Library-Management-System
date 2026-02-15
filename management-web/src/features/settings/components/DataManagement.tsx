import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { apiClient } from '../../../core/network/api_client';
import { API_CONFIG } from '../../../core/config/api';

interface ImportResult {
  row: number;
  title?: string;
  success: boolean;
  errors?: string[];
  createdId?: number;
  status?: 'imported' | 'duplicate' | 'empty' | 'validation_error' | 'worldcat_enriched';
  isbn?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
}

interface ImportSummary {
  total: number;
  imported: number;
  failed: number;
  results: ImportResult[];
  errors: string[];
  warnings: string[];
  duration: number;
  timestamp: Date;
  detailedStats?: {
    duplicates: number;
    emptyRows: number;
    validationErrors: number;
    worldcatEnriched: number;
  };
}

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
      id={`data-management-tabpanel-${index}`}
      aria-labelledby={`data-management-tab-${index}`}
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
    id: `data-management-tab-${index}`,
    'aria-controls': `data-management-tabpanel-${index}`,
  };
}

const DataManagement: React.FC = () => {
  const [value, setValue] = useState(0);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportType, setExportType] = useState('books');
  const [importResults, setImportResults] = useState<ImportSummary | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importProgress, setImportProgress] = useState({
    currentRow: 0,
    totalRows: 0,
    processedRows: 0,
    importedRows: 0,
    failedRows: 0,
    progress: 0,
    message: '',
    type: 'idle' as 'idle' | 'parsing' | 'processing' | 'processing-row' | 'completed' | 'error',
    rowNumber: 0,
  });
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Cleanup SSE connection on unmount
  React.useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setMessage('');
  };

  const startSSEConnection = () => {
    // Close existing connection
    if (eventSource) {
      eventSource.close();
    }

    // Create new SSE connection with token in URL
    const token = localStorage.getItem('access_token');
    const sseUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DATA_IMPORT.IMPORT_PROGRESS}`;
    const urlWithToken = `${sseUrl}?token=${encodeURIComponent(token || '')}`;
    
    const newEventSource = new EventSource(urlWithToken);
    
    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        setImportProgress(prev => ({
          ...prev,
          ...data,
        }));

        // Handle different message types
        switch (data.type) {
          case 'completed':
            setImportProgress(prev => ({ ...prev, progress: 100, type: 'completed' }));
            break;
          case 'error':
            setImportProgress(prev => ({ ...prev, type: 'error' }));
            setMessage(data.message || 'Import failed');
            setMessageType('error');
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    newEventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      console.error('EventSource readyState:', newEventSource.readyState);
      console.error('EventSource URL:', newEventSource.url);
      
      newEventSource.close();
      setEventSource(null);
      
      // Show user-friendly error message
      setMessage('Real-time progress connection failed. Import will continue but progress updates may not be visible.');
      setMessageType('warning');
    };

    setEventSource(newEventSource);
    return newEventSource;
  };

  const stopSSEConnection = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.oasis.opendocument.spreadsheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage('Please upload a valid Excel file (.xlsx, .xls, .ods)');
      setMessageType('error');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size must be less than 10MB');
      setMessageType('error');
      return;
    }

    setImportLoading(true);
    setMessage('');
    setImportResults(null);
    setUploadProgress(0);
    
    // Reset import progress
    setImportProgress({
      currentRow: 0,
      totalRows: 0,
      processedRows: 0,
      importedRows: 0,
      failedRows: 0,
      progress: 0,
      message: 'Starting import...',
      type: 'idle',
      rowNumber: 0,
    });

    // Start SSE connection
    startSSEConnection();

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the centralized API client
      const result = await apiClient.post<ImportSummary>(
        API_CONFIG.ENDPOINTS.DATA_IMPORT.IMPORT_BOOKS,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          },
        }
      );

      setImportResults(result);
      setShowResultsDialog(true);
      
      // Show summary message
      const successRate = ((result.imported / result.total) * 100).toFixed(1);
      setMessage(`Import completed: ${result.imported}/${result.total} books imported successfully (${successRate}% success rate)`);
      setMessageType(result.failed > 0 ? 'warning' : 'success');

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to import data';
      setMessage(errorMessage);
      setMessageType('error');
      setImportProgress(prev => ({ ...prev, type: 'error', message: errorMessage }));
    } finally {
      setImportLoading(false);
      setUploadProgress(0);
      // Stop SSE connection immediately to show results
      stopSSEConnection();
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setMessage('');

    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.DATA_EXPORT.EXPORT_DATA.replace(':type', exportType),
        {
          params: { format: exportFormat },
          responseType: 'blob',
        }
      );

      // Create download link
      const blob = new Blob([response as Blob], {
        type: exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            exportFormat === 'csv' ? 'text/csv' : 'application/json',
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}_export.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage(`Successfully exported ${exportType} data`);
      setMessageType('success');
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export data';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.DATA_IMPORT.DOWNLOAD_TEMPLATE,
        { responseType: 'blob' }
      );

      const blob = new Blob([response as Blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'books_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('Template downloaded successfully');
      setMessageType('success');
    } catch (error: any) {
      console.error('Template download error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download template';
      setMessage(errorMessage);
      setMessageType('error');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'imported':
        return <SuccessIcon color="success" />;
      case 'duplicate':
        return <WarningIcon color="warning" />;
      case 'validation_error':
        return <ErrorIcon color="error" />;
      case 'worldcat_enriched':
        return <InfoIcon color="info" />;
      case 'empty':
        return <InfoIcon color="disabled" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'imported':
        return 'success';
      case 'duplicate':
        return 'warning';
      case 'validation_error':
        return 'error';
      case 'worldcat_enriched':
        return 'info';
      case 'empty':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ padding: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: '1.8rem' }}>
          Data Management
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="data management tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontSize: '0.75rem',
                minHeight: 48,
              }
            }}
          >
            <Tab label="Import Data" {...a11yProps(0)} />
            <Tab label="Export Data" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '0.9rem' }}>
            Import Books from Excel
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ fontSize: '0.75rem' }}>
            Upload an Excel file containing book data to bulk import into the system. The file should contain columns for title, author, ISBN, publisher, etc.
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                    Upload Excel File
                  </Typography>
                  <TextField
                    type="file"
                    fullWidth
                    label="Choose Excel File"
                    inputProps={{
                      accept: '.xlsx,.xls,.ods',
                      onChange: handleImport,
                    }}
                    disabled={importLoading}
                    helperText="Maximum file size: 10MB"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  {uploadProgress > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Uploading: {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                    Import Template
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Download Template
                  </Button>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Download the Excel template with required columns
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {importLoading && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography sx={{ fontSize: '0.75rem' }}>
                  {importProgress.message || 'Processing import...'}
                </Typography>
              </Box>
              
              {/* Real-time Progress Display */}
              {(importProgress.totalRows > 0 || importProgress.progress > 0) && (
                <Card sx={{ mb: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
                      Import Progress
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={importProgress.progress} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {importProgress.progress}% Complete
                      </Typography>
                    </Box>

                    <Grid container spacing={2} sx={{ fontSize: '0.75rem' }}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary" sx={{ fontSize: '1rem' }}>
                            {importProgress.totalRows}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            Total Rows
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="info.main" sx={{ fontSize: '1rem' }}>
                            {importProgress.currentRow}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            Current Row
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="success.main" sx={{ fontSize: '1rem' }}>
                            {importProgress.importedRows}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            Imported
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="error.main" sx={{ fontSize: '1rem' }}>
                            {importProgress.failedRows}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            Failed
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {importProgress.type === 'processing-row' && importProgress.rowNumber && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', fontSize: '0.7rem' }}>
                        Currently processing: Row {importProgress.rowNumber}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                This may take a few minutes for large files. Real-time updates will appear above.
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '0.9rem' }}>
            Export Library Data
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ fontSize: '0.75rem' }}>
            Export various types of library data in different formats for analysis or backup purposes.
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Export Type</InputLabel>
                <Select
                  value={exportType}
                  label="Export Type"
                  onChange={(e) => setExportType(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="books" sx={{ fontSize: '0.75rem' }}>Books</MenuItem>
                  <MenuItem value="users" sx={{ fontSize: '0.75rem' }}>Users</MenuItem>
                  <MenuItem value="loans" sx={{ fontSize: '0.75rem' }}>Loans</MenuItem>
                  <MenuItem value="categories" sx={{ fontSize: '0.75rem' }}>Categories</MenuItem>
                  <MenuItem value="subjects" sx={{ fontSize: '0.75rem' }}>Subjects</MenuItem>
                  <MenuItem value="publishers" sx={{ fontSize: '0.75rem' }}>Publishers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  label="Export Format"
                  onChange={(e) => setExportFormat(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="excel" sx={{ fontSize: '0.75rem' }}>Excel (.xlsx)</MenuItem>
                  <MenuItem value="csv" sx={{ fontSize: '0.75rem' }}>CSV (.csv)</MenuItem>
                  <MenuItem value="json" sx={{ fontSize: '0.75rem' }}>JSON (.json)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={exportLoading}
                startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleExport}
                sx={{ fontSize: '0.75rem' }}
              >
                {exportLoading ? 'Exporting...' : `Export ${exportType.toUpperCase()}`}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Import Results Dialog */}
      <Dialog 
        open={showResultsDialog} 
        onClose={() => setShowResultsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '0.9rem' }}>
          Import Results Summary
          <IconButton
            aria-label="close"
            onClick={() => setShowResultsDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {importResults && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="primary" sx={{ fontSize: '1.2rem' }}>
                        {importResults.total}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        Total Rows
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="success.main" sx={{ fontSize: '1.2rem' }}>
                        {importResults.imported}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        Imported
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="error.main" sx={{ fontSize: '1.2rem' }}>
                        {importResults.failed}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        Failed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="info.main" sx={{ fontSize: '1.2rem' }}>
                        {Math.round(importResults.duration / 1000)}s
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        Duration
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {importResults.detailedStats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Chip 
                      label={`Duplicates: ${importResults.detailedStats.duplicates}`} 
                      color="warning" 
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Chip 
                      label={`Empty Rows: ${importResults.detailedStats.emptyRows}`} 
                      color="default" 
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Chip 
                      label={`Validation Errors: ${importResults.detailedStats.validationErrors}`} 
                      color="error" 
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Chip 
                      label={`WorldCat Enriched: ${importResults.detailedStats.worldcatEnriched}`} 
                      color="info" 
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Grid>
                </Grid>
              )}

              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Row</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Author</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ISBN</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Errors</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importResults.results.slice(0, 50).map((result, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{result.row}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(result.status)}
                            <Chip
                              label={result.status?.replace('_', ' ') || 'Unknown'}
                              color={getStatusColor(result.status) as any}
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{result.title || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{result.author || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{result.isbn || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {result.errors && result.errors.length > 0 ? (
                            <Tooltip title={result.errors.join(', ')}>
                              <Typography variant="caption" color="error">
                                {result.errors.length} error(s)
                              </Typography>
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {importResults.results.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ fontSize: '0.75rem' }}>
                          ... and {importResults.results.length - 50} more rows
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultsDialog(false)} sx={{ fontSize: '0.75rem' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={messageType} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DataManagement;
