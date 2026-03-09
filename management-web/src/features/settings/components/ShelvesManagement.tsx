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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { apiClient } from '../../../core/network/api_client';
import { API_CONFIG } from '../../../core/config/api';

interface Shelf {
  id: number;
  name: string;
  description?: string;
  locationId: number;
  location?: {
    id: number;
    name: string;
    address?: string;
  };
  isActive: boolean;
  deletedAt?: string;
}

interface ShelfFormData {
  name: string;
  description?: string;
  locationId: number;
  isActive: boolean;
}

const ShelvesManagement: React.FC = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [formData, setFormData] = useState<ShelfFormData>({
    name: '',
    description: '',
    locationId: 0,
    isActive: true,
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchShelves = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.SHELVES.LIST, {
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
        setShelves(data);
        setTotal(data.length);
      } else {
        // Paginated response
        setShelves(data.data || data);
        setTotal(data.total || data.length);
      }
    } catch (error: any) {
      setMessage(`Failed to fetch shelves: ${error.message || 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, [page, rowsPerPage, search]);

  const handleOpenDialog = (shelf?: Shelf) => {
    if (shelf) {
      setEditingShelf(shelf);
      setFormData({
        name: shelf.name,
        description: shelf.description || '',
        locationId: shelf.location?.id || 0,
        isActive: shelf.isActive,
      });
    } else {
      setEditingShelf(null);
      setFormData({
        name: '',
        description: '',
        locationId: 0,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShelf(null);
    setFormData({
      name: '',
      description: '',
      locationId: 0,
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingShelf) {
        await apiClient.patch(API_CONFIG.ENDPOINTS.SHELVES.UPDATE.replace(':id', editingShelf.id.toString()), formData);
        setMessage('Shelf updated successfully!');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.SHELVES.CREATE, formData);
        setMessage('Shelf created successfully!');
      }
      setMessageType('success');
      handleCloseDialog();
      fetchShelves();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save shelf');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this shelf?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.SHELVES.DELETE.replace(':id', id.toString()));
      setMessage('Shelf deleted successfully!');
      setMessageType('success');
      fetchShelves();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete shelf');
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
        <Typography variant="h6" gutterBottom sx={{ fontSize: 14, fontWeight: 600 }}>
          Shelves Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: 12 }}
        >
          Add Shelf
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search shelves..."
        variant="outlined"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ 
          mb: 2, 
          fontSize: 12,
          '& .MuiFormLabel-root': {
            fontSize: 11
          },
          '& .MuiInputBase-input': {
            fontSize: 11
          }
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography sx={{ fontSize: 11 }}>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : shelves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography sx={{ fontSize: 11 }}>No shelves found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              shelves.map((shelf) => (
                <TableRow key={shelf.id}>
                  <TableCell sx={{ fontSize: 11 }}>{shelf.name}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{shelf.description || '-'}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{shelf.location?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={shelf.isActive ? 'Active' : 'Inactive'}
                      color={shelf.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ fontSize: 10 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(shelf)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(shelf.id)}
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
          {editingShelf ? 'Edit Shelf' : 'Add New Shelf'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Shelf Name"
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: parseInt(e.target.value.toString()) })}
                label="Location"
              >
                <MenuItem value={0}>Select a location</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingShelf ? 'Update' : 'Create'}
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

export default ShelvesManagement;
