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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { apiClient } from '../../../core/network/api_client';
import { API_CONFIG } from '../../../core/config/api';

interface BookType {
  id: number;
  name: string;
  format: string;
  description?: string;
  isActive: boolean;
  deletedAt?: string;
}

interface BookTypeFormData {
  name: string;
  format: string;
  description?: string;
  isActive: boolean;
}

const BookTypesManagement: React.FC = () => {
  const [bookTypes, setBookTypes] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBookType, setEditingBookType] = useState<BookType | null>(null);
  const [formData, setFormData] = useState<BookTypeFormData>({
    name: '',
    format: 'physical',
    description: '',
    isActive: true,
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchBookTypes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOK_TYPES.LIST, {
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
        setBookTypes(data);
        setTotal(data.length);
      } else {
        // Paginated response
        setBookTypes(data.data || data);
        setTotal(data.total || data.length);
      }
    } catch (error: any) {
      setMessage(`Failed to fetch book types: ${error.message || 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookTypes();
  }, [page, rowsPerPage, search]);

  const handleOpenDialog = (bookType?: BookType) => {
    if (bookType) {
      setEditingBookType(bookType);
      setFormData({
        name: bookType.name,
        format: bookType.format,
        description: bookType.description || '',
        isActive: bookType.isActive,
      });
    } else {
      setEditingBookType(null);
      setFormData({
        name: '',
        format: 'physical',
        description: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBookType(null);
    setFormData({
      name: '',
      format: 'physical',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingBookType) {
        await apiClient.patch(API_CONFIG.ENDPOINTS.BOOK_TYPES.UPDATE.replace(':id', editingBookType.id.toString()), formData);
        setMessage('Book type updated successfully!');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.BOOK_TYPES.CREATE, formData);
        setMessage('Book type created successfully!');
      }
      setMessageType('success');
      handleCloseDialog();
      fetchBookTypes();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save book type');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this book type?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.BOOK_TYPES.DELETE.replace(':id', id.toString()));
      setMessage('Book type deleted successfully!');
      setMessageType('success');
      fetchBookTypes();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete book type');
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
          Book Types Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: '0.75rem' }}
        >
          Add Book Type
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search book types..."
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
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Format</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Description</TableCell>
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
            ) : bookTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ fontSize: '0.75rem' }}>No book types found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              bookTypes.map((bookType) => (
                <TableRow key={bookType.id}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{bookType.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    <Chip
                      label={bookType.format}
                      color={bookType.format === 'physical' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{bookType.description || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    <Chip
                      label={bookType.isActive ? 'Active' : 'Inactive'}
                      color={bookType.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(bookType)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(bookType.id)}
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
          {editingBookType ? 'Edit Book Type' : 'Add New Book Type'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Type Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Format</InputLabel>
              <Select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as string })}
                label="Format"
              >
                <MenuItem value="physical">Physical</MenuItem>
                <MenuItem value="digital">Digital</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingBookType ? 'Update' : 'Create'}
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

export default BookTypesManagement;
