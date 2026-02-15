import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TablePagination,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { apiClient } from '../../../core/network/api_client';
import { API_CONFIG } from '../../../core/config/api';

interface Location {
  id: number;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  deletedAt?: string;
}

interface LocationFormData {
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
}

const LocationsManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    description: '',
    address: '',
    isActive: true,
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.LOCATIONS.LIST, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search || undefined,
        },
      });
      
      // The response is a direct data array, not nested under 'data'
      const data = (response as any).data || (response as any);
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(data)) {
        // Direct array response
        setLocations(data);
        setTotal(data.length);
      } else {
        // Paginated response
        setLocations(data.data || data);
        setTotal(data.total || data.length);
      }
    } catch (error: any) {
      setMessage(`Failed to fetch locations: ${error.message || 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [page, rowsPerPage, search]);

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        description: location.description || '',
        address: location.address || '',
        isActive: location.isActive,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        description: '',
        address: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingLocation) {
        await apiClient.patch(API_CONFIG.ENDPOINTS.LOCATIONS.UPDATE.replace(':id', editingLocation.id.toString()), formData);
        setMessage('Location updated successfully!');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.LOCATIONS.CREATE, formData);
        setMessage('Location created successfully!');
      }
      setMessageType('success');
      handleCloseDialog();
      fetchLocations();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save location');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.LOCATIONS.DELETE.replace(':id', id.toString()));
      setMessage('Location deleted successfully!');
      setMessageType('success');
      fetchLocations();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete location');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '0.9rem' }}>
          Locations Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: '0.75rem' }}
        >
          Add Location
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search locations..."
        variant="outlined"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ fontSize: '0.75rem' }}>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ fontSize: '0.75rem' }}>No locations found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{location.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{location.description || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{location.address || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={location.isActive ? 'Active' : 'Inactive'}
                      color={location.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(location)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(location.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem' }}>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Location Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Address"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingLocation ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Message Snackbar */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setMessage('')}
          severity={messageType}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationsManagement;
