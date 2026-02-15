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

interface Publisher {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  deletedAt?: string;
}

interface PublisherFormData {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

const PublishersManagement: React.FC = () => {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [formData, setFormData] = useState<PublisherFormData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    isActive: true,
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchPublishers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PUBLISHERS.LIST, {
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
        setPublishers(data);
        setTotal(data.length);
      } else {
        // Paginated response
        setPublishers(data.data || data);
        setTotal(data.total || data.length);
      }
    } catch (error: any) {
      setMessage(`Failed to fetch publishers: ${error.message || 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, [page, rowsPerPage, search]);

  const handleOpenDialog = (publisher?: Publisher) => {
    if (publisher) {
      setEditingPublisher(publisher);
      setFormData({
        name: publisher.name,
        description: publisher.description || '',
        phone: publisher.phone || '',
        email: publisher.email || '',
        address: publisher.address || '',
        isActive: publisher.isActive,
      });
    } else {
      setEditingPublisher(null);
      setFormData({
        name: '',
        description: '',
        phone: '',
        email: '',
        address: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPublisher(null);
    setFormData({
      name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingPublisher) {
        await apiClient.patch(API_CONFIG.ENDPOINTS.PUBLISHERS.UPDATE.replace(':id', editingPublisher.id.toString()), formData);
        setMessage('Publisher updated successfully!');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.PUBLISHERS.CREATE, formData);
        setMessage('Publisher created successfully!');
      }
      setMessageType('success');
      handleCloseDialog();
      fetchPublishers();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save publisher');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this publisher?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.PUBLISHERS.DELETE.replace(':id', id.toString()));
      setMessage('Publisher deleted successfully!');
      setMessageType('success');
      fetchPublishers();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete publisher');
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
          Publishers Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: '0.75rem' }}
        >
          Add Publisher
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search publishers..."
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
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography sx={{ fontSize: '0.75rem' }}>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : publishers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography sx={{ fontSize: '0.75rem' }}>No publishers found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              publishers.map((publisher) => (
                <TableRow key={publisher.id}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{publisher.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{publisher.email || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{publisher.phone || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{publisher.address || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={publisher.isActive ? 'Active' : 'Inactive'}
                      color={publisher.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(publisher)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(publisher.id)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem' }}>
          {editingPublisher ? 'Edit Publisher' : 'Add New Publisher'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Publisher Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Email"
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Phone"
              fullWidth
              variant="outlined"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              {editingPublisher ? 'Update' : 'Create'}
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

export default PublishersManagement;
