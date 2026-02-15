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

interface Subject {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  deletedAt?: string;
}

interface SubjectFormData {
  name: string;
  description?: string;
  isActive: boolean;
}

const SubjectsManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    isActive: true,
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.SUBJECTS.LIST, {
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
        setSubjects(data);
        setTotal(data.length);
      } else {
        // Paginated response
        setSubjects(data.data || data);
        setTotal(data.total || data.length);
      }
    } catch (error: any) {
      setMessage(`Failed to fetch subjects: ${error.message || 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [page, rowsPerPage, search]);

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        description: subject.description || '',
        isActive: subject.isActive,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingSubject) {
        await apiClient.patch(API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE.replace(':id', editingSubject.id.toString()), formData);
        setMessage('Subject updated successfully!');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.SUBJECTS.CREATE, formData);
        setMessage('Subject created successfully!');
      }
      setMessageType('success');
      handleCloseDialog();
      fetchSubjects();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save subject');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.SUBJECTS.DELETE.replace(':id', id.toString()));
      setMessage('Subject deleted successfully!');
      setMessageType('success');
      fetchSubjects();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete subject');
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
          Subjects Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: '0.75rem' }}
        >
          Add Subject
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search subjects..."
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
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ fontSize: '0.75rem' }}>No subjects found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{subject.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{subject.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={subject.isActive ? 'Active' : 'Inactive'}
                      color={subject.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(subject)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(subject.id)}
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
          {editingSubject ? 'Edit Subject' : 'Add New Subject'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Subject Name"
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingSubject ? 'Update' : 'Create'}
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

export default SubjectsManagement;
