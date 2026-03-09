import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TablePagination,
  Alert,
  Snackbar,
  LinearProgress,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  Container,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Download,
  Delete,
  Edit,
  Visibility,
  CloudUpload,
  Storage,
  Image,
  VideoLibrary,
  AudioFile,
  PictureAsPdf,
  Description,
  Archive,
  TextSnippet,
  InsertDriveFile,
  Refresh,
  CleaningServices,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileManagementService, type FileRecord, type FileManagementQuery, type StorageStats, type SyncStatusResponse, type SyncResponse } from '../services/file-management.service';
import { useAuthStore } from '../../../core/hooks/useAuth';

interface FileManagementProps { }

const FileManagement: React.FC<FileManagementProps> = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === 'Admin';
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filterMimeType, setFilterMimeType] = useState('');
  const [filterPublic, setFilterPublic] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'createdAt' | 'size' | 'originalName' | 'mimeType'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileRecord | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFilePublic, setEditFilePublic] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFileForMenu, setSelectedFileForMenu] = useState<FileRecord | null>(null);

  // Build query object
  const buildQuery = (): FileManagementQuery => ({
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm || undefined,
    mimeType: filterMimeType || undefined,
    isPublic: filterPublic,
    sortBy,
    sortOrder,
  });

  // Fetch files
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ['files', buildQuery()],
    queryFn: () => fileManagementService.getFiles(buildQuery()),
  });

  // Fetch storage stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: () => fileManagementService.getStorageStats(),
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => fileManagementService.deleteFile(id),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'File deleted successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: `Failed to delete file: ${error.message}`, severity: 'error' });
    },
  });

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: (fileIds: string[]) => fileManagementService.batchDeleteFiles(fileIds),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: `Deleted ${data.deletedCount} files successfully${data.errors.length > 0 ? ` (${data.errors.length} errors)` : ''}`,
        severity: 'success'
      });
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: `Failed to delete files: ${error.message}`, severity: 'error' });
    },
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fileManagementService.updateFile(id, data),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'File updated successfully', severity: 'success' });
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: `Failed to update file: ${error.message}`, severity: 'error' });
    },
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: () => fileManagementService.cleanupOrphanedFiles(),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: `Cleanup completed: deleted ${data.deletedCount} files, freed ${fileManagementService.formatFileSize(data.freedSpace)}`,
        severity: 'success'
      });
      setCleanupDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Cleanup failed';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    },
  });

  // Get sync status query
  const {
    data: syncStatus,
    refetch: refetchSyncStatus,
  } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => fileManagementService.getSyncStatus(),
    enabled: isAdmin,
  });

  // Sync files mutation
  const syncMutation = useMutation({
    mutationFn: () => fileManagementService.syncOrphanedFiles(),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: data.message,
        severity: 'success'
      });
      setSyncDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Sync failed';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    },
  });

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedFiles(filesData?.data?.map(file => file.id) || []);
    } else {
      setSelectedFiles([]);
    }
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFileMutation.mutate(fileId);
  };

  const handleBatchDelete = () => {
    if (selectedFiles.length > 0) {
      batchDeleteMutation.mutate(selectedFiles);
    }
  };

  const handleEditFile = (file: FileRecord) => {
    setEditingFile(file);
    setEditFileName(file.originalName);
    setEditFilePublic(file.isPublic);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingFile) {
      updateFileMutation.mutate({
        id: editingFile.id,
        data: {
          originalName: editFileName,
          isPublic: editFilePublic,
        },
      });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: FileRecord) => {
    setAnchorEl(event.currentTarget);
    setSelectedFileForMenu(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFileForMenu(null);
  };

  const getFileIcon = (mimeType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'image': <Image />,
      'video': <VideoLibrary />,
      'audio': <AudioFile />,
      'pdf': <PictureAsPdf />,
      'document': <Description />,
      'archive': <Archive />,
      'text': <TextSnippet />,
    };

    const category = fileManagementService.getFileTypeCategory(mimeType);
    return iconMap[category] || <InsertDriveFile />;
  };

  const formatFileSize = (bytes: number) => {
    return fileManagementService.formatFileSize(bytes);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    refetchFiles();
    refetchStats();
  };

  return (
    // <Container maxWidth="xl">
    <Paper sx={{ padding: 3 }}>
      <Box>
        {/* Header with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography component="div" sx={{ fontWeight: 600, fontSize: 14 }}>
            <Storage sx={{ fontSize: 16 }} /> File Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleRefresh} disabled={filesLoading}>
              <Refresh />
            </IconButton>
            {isAdmin && (
              <IconButton onClick={() => setCleanupDialogOpen(true)}>
                <CleaningServices />
              </IconButton>
            )}
            {isAdmin && (
              <IconButton onClick={() => setSyncDialogOpen(true)}>
                <CloudUpload />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Storage Stats */}
        {stats && (
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, fontSize: 12 }}>Storage Overview</Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Card sx={{ minWidth: 200 }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: 16 }}>
                    {stats.totalFiles.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 10 }}>Total Files</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 200 }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: 16 }}>
                    {formatFileSize(stats.totalSize)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 10 }}>Total Size</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 300 }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={stats.storageUsage.percentage}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ minWidth: 60, fontSize: 10 }}>
                      {Math.round(stats.storageUsage.percentage)}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: 10 }}>
                    {formatFileSize(stats.storageUsage.used)} used of {formatFileSize(stats.storageUsage.used + stats.storageUsage.available)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Filters and Search */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, fontSize: 12 }}>Filters</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 14 }} />,
                sx: { fontSize: 11 }
              }}
              sx={{
                minWidth: 250,
                '& .MuiFormLabel-root': {
                  fontSize: 11
                }
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: 11 }}>File Type</InputLabel>
              <Select
                value={filterMimeType}
                onChange={(e) => setFilterMimeType(e.target.value)}
                sx={{
                  fontSize: 12,
                  '& .MuiSelect-select': {
                    fontSize: 11
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: 11 }}>All Types</MenuItem>
                <MenuItem value="image/" sx={{ fontSize: 11 }}>Images</MenuItem>
                <MenuItem value="video/" sx={{ fontSize: 11 }}>Videos</MenuItem>
                <MenuItem value="audio/" sx={{ fontSize: 11 }}>Audio</MenuItem>
                <MenuItem value="pdf" sx={{ fontSize: 11 }}>PDF</MenuItem>
                <MenuItem value="epub" sx={{ fontSize: 11 }}>E-books</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: 11 }}>Visibility</InputLabel>
              <Select
                value={filterPublic === undefined ? '' : filterPublic.toString()}
                onChange={(e) => setFilterPublic(e.target.value === '' ? undefined : e.target.value === 'true')}
                label="Visibility"
                sx={{
                  fontSize: 12,
                  '& .MuiSelect-select': {
                    fontSize: 11
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: 11 }}>All</MenuItem>
                <MenuItem value="true" sx={{ fontSize: 11 }}>Public</MenuItem>
                <MenuItem value="false" sx={{ fontSize: 11 }}>Private</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: 11 }}>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                label="Sort By"
                sx={{
                  fontSize: 12,
                  '& .MuiSelect-select': {
                    fontSize: 11
                  }
                }}
              >
                <MenuItem value="createdAt" sx={{ fontSize: 11 }}>Created Date</MenuItem>
                <MenuItem value="size" sx={{ fontSize: 11 }}>Size</MenuItem>
                <MenuItem value="originalName" sx={{ fontSize: 11 }}>Name</MenuItem>
                <MenuItem value="mimeType" sx={{ fontSize: 11 }}>Type</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ fontSize: 11 }}>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                label="Order"
                sx={{
                  fontSize: 12,
                  '& .MuiSelect-select': {
                    fontSize: 11
                  }
                }}
              >
                <MenuItem value="DESC" sx={{ fontSize: 11 }}>Desc</MenuItem>
                <MenuItem value="ASC" sx={{ fontSize: 11 }}>Asc</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Files Table */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {filesLoading && <LinearProgress />}
          {filesError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading files: {(filesError as any).message}
            </Alert>
          )}

          <TableContainer component={Paper} sx={{
            height: 'auto',
          }}>
            <Table stickyHeader sx={{ fontSize: 12 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ fontSize: 12 }}>
                    <Checkbox
                      indeterminate={selectedFiles.length > 0 && selectedFiles.length < (filesData?.data?.length || 0)}
                      checked={(filesData?.data?.length || 0) > 0 && selectedFiles.length === (filesData?.data?.length || 0)}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>Name</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>Type</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>Size</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>Visibility</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>Uploaded</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filesData?.data?.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleSelectFile(file.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(file.mimeType)}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 11 }}>
                            {file.originalName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                            {file.mimeType}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Chip
                        label={fileManagementService.getFileTypeCategory(file.mimeType)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 10 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{formatFileSize(file.size)}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Chip
                        label={file.isPublic ? 'Public' : 'Private'}
                        size="small"
                        color={file.isPublic ? 'success' : 'default'}
                        sx={{ fontSize: 10 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Typography variant="body2" sx={{ fontSize: 11 }}>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, file)}
                      >
                        <MoreVert sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component="div"
            count={filesData?.total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>

        {/* Action Bar */}
        {selectedFiles.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontSize: 11 }}>
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={handleBatchDelete}
              disabled={batchDeleteMutation.isPending}
              sx={{ fontSize: 12 }}
            >
              Delete Selected
            </Button>
          </Box>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItemComponent onClick={() => {
            if (selectedFileForMenu) {
              window.open(selectedFileForMenu.url, '_blank');
            }
            handleMenuClose();
          }}>
            <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ fontSize: 11 }}>View File</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={() => {
            if (selectedFileForMenu) {
              window.open(selectedFileForMenu.url, '_blank');
            }
            handleMenuClose();
          }}>
            <ListItemIcon><Download fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ fontSize: 11 }}>Download</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={() => {
            if (selectedFileForMenu) {
              handleEditFile(selectedFileForMenu);
            }
            handleMenuClose();
          }}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ fontSize: 11 }}>Edit</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent onClick={() => {
            if (selectedFileForMenu) {
              handleDeleteFile(selectedFileForMenu.id);
            }
            handleMenuClose();
          }}>
            <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ fontSize: 11 }}>Delete</ListItemText>
          </MenuItemComponent>
        </Menu>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: 14, fontWeight: 600 }}>Edit File</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="File Name"
                fullWidth
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                sx={{
                  fontSize: 12,
                  '& .MuiFormLabel-root': {
                    fontSize: 11
                  },
                  '& .MuiInputBase-input': {
                    fontSize: 11
                  }
                }}
              />
              <FormControl>
                <InputLabel sx={{ fontSize: 11 }}>Visibility</InputLabel>
                <Select
                  value={editFilePublic.toString()}
                  onChange={(e) => setEditFilePublic(e.target.value === 'true')}
                  label="Visibility"
                  sx={{
                    fontSize: 12,
                    '& .MuiSelect-select': {
                      fontSize: 11
                    }
                  }}
                >
                  <MenuItem value="true" sx={{ fontSize: 11 }}>Public</MenuItem>
                  <MenuItem value="false" sx={{ fontSize: 11 }}>Private</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ fontSize: 12 }}>Cancel</Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={updateFileMutation.isPending}
              sx={{ fontSize: 12 }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cleanup Dialog */}
        <Dialog open={cleanupDialogOpen} onClose={() => setCleanupDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: 14, fontWeight: 600 }}>Cleanup Orphaned Files</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, fontSize: 12 }}>
              This will permanently delete all files that have been marked as deleted in the database but still exist on disk.
              This action cannot be undone.
            </Typography>
            <Alert severity="warning" sx={{ fontSize: 12 }}>
              This will free up disk space by removing orphaned files.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCleanupDialogOpen(false)} sx={{ fontSize: 12 }}>Cancel</Button>
            <Button
              onClick={() => cleanupMutation.mutate()}
              variant="contained"
              color="warning"
              disabled={cleanupMutation.isPending}
              sx={{ fontSize: 12 }}
            >
              Cleanup Files
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sync Dialog */}
        <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontSize: 14, fontWeight: 600 }}>Sync Storage Files</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 3, fontSize: 12 }}>
              This will scan the storage directory and create database records for any files that exist on disk
              but are not currently tracked in the database. This is useful for files that were uploaded
              outside the normal API process.
            </Typography>

            {syncStatus && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: 12 }}>Current Sync Status:</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Card sx={{ minWidth: 120 }}>
                    <CardContent sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {syncStatus.totalFilesInStorage}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Files in Storage</Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ minWidth: 120 }}>
                    <CardContent sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {syncStatus.totalFilesInDatabase}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Files in Database</Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ minWidth: 120 }}>
                    <CardContent sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: syncStatus.orphanedFiles > 0 ? 'warning.main' : 'success.main' }}>
                        {syncStatus.orphanedFiles}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Orphaned Files</Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ minWidth: 120 }}>
                    <CardContent sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {fileManagementService.formatFileSize(syncStatus.storageSize)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Storage Size</Typography>
                    </CardContent>
                  </Card>
                </Box>

                {syncStatus.orphanedFiles > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Found {syncStatus.orphanedFiles} files that need to be synced to the database.
                  </Alert>
                )}

                {syncStatus.orphanedFiles === 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    All files are already synced with the database!
                  </Alert>
                )}
              </Box>
            )}

            <Alert severity="info">
              The sync process will extract metadata from existing files and create proper database records.
              This may take a few moments depending on the number of files.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => refetchSyncStatus()}
              variant="outlined"
              disabled={false}
            >
              Refresh Status
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              variant="contained"
              disabled={syncMutation.isPending || (syncStatus?.orphanedFiles === 0)}
            >
              {syncMutation.isPending ? 'Syncing...' : 'Sync Files'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Paper>
    // </Container>
  );
};

export default FileManagement;
