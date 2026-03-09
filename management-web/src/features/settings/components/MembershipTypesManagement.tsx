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

interface MembershipType {
  id: number;
  name: string;
  description?: string;
  maxBooks: number;
  maxDurationDays: number;
  loanPeriodDays: number;
  renewalLimit: number;
  fineRate: number;
  gracePeriodDays: number;
  isActive: boolean;
  deletedAt?: string;
}

interface MembershipTypeFormData {
  name: string;
  description?: string;
  maxBooks: number;
  maxDurationDays: number;
  loanPeriodDays: number;
  renewalLimit: number;
  fineRate: number;
  gracePeriodDays: number;
  isActive: boolean;
}

const MembershipTypesManagement: React.FC = () => {
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMembershipType, setEditingMembershipType] = useState<MembershipType | null>(null);
  const [formData, setFormData] = useState<MembershipTypeFormData>({
    name: '',
    description: '',
    maxBooks: 3,
    maxDurationDays: 14,
    loanPeriodDays: 14,
    renewalLimit: 1,
    fineRate: 100,
    gracePeriodDays: 0,
    isActive: true,
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchMembershipTypes = async () => {
    setLoading(true);
    try {
      
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.MEMBERSHIP_TYPES.LIST, {
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
        setMembershipTypes(data);
        setTotal(data.length);
      } else {
        // Paginated response
        setMembershipTypes(data.data || data);
        setTotal(data.total || data.length);
      }
    } catch (error: any) {
      setMessage(`Failed to fetch membership types: ${error.message || 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipTypes();
  }, [page, rowsPerPage, search]);

  const handleOpenDialog = (membershipType?: MembershipType) => {
    if (membershipType) {
      setEditingMembershipType(membershipType);
      setFormData({
        name: membershipType.name,
        description: membershipType.description || '',
        maxBooks: membershipType.maxBooks,
        maxDurationDays: membershipType.maxDurationDays,
        loanPeriodDays: membershipType.loanPeriodDays,
        renewalLimit: membershipType.renewalLimit,
        fineRate: membershipType.fineRate,
        gracePeriodDays: membershipType.gracePeriodDays,
        isActive: membershipType.isActive,
      });
    } else {
      setEditingMembershipType(null);
      setFormData({
        name: '',
        description: '',
        maxBooks: 3,
        maxDurationDays: 14,
        loanPeriodDays: 14,
        renewalLimit: 1,
        fineRate: 100,
        gracePeriodDays: 0,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMembershipType(null);
    setFormData({
      name: '',
      description: '',
      maxBooks: 3,
      maxDurationDays: 14,
      loanPeriodDays: 14,
      renewalLimit: 1,
      fineRate: 100,
      gracePeriodDays: 0,
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingMembershipType) {
        await apiClient.patch(API_CONFIG.ENDPOINTS.MEMBERSHIP_TYPES.UPDATE.replace(':id', editingMembershipType.id.toString()), formData);
        setMessage('Membership type updated successfully!');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.MEMBERSHIP_TYPES.CREATE, formData);
        setMessage('Membership type created successfully!');
      }
      setMessageType('success');
      handleCloseDialog();
      fetchMembershipTypes();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save membership type');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this membership type?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.MEMBERSHIP_TYPES.DELETE.replace(':id', id.toString()));
      setMessage('Membership type deleted successfully!');
      setMessageType('success');
      fetchMembershipTypes();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete membership type');
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
          Membership Types Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: 12 }}
        >
          Add Membership Type
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search membership types..."
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
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Max Books</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Max Duration</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Loan Period</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Grace Period</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Renewal Limit</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Fine Rate</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: 11 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography sx={{ fontSize: 11 }}>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : membershipTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography sx={{ fontSize: 11 }}>No membership types found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              membershipTypes.map((membershipType) => (
                <TableRow key={membershipType.id}>
                  <TableCell sx={{ fontSize: 11 }}>{membershipType.name}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{membershipType.description || '-'}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{membershipType.maxBooks}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{membershipType.maxDurationDays} days</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{membershipType.loanPeriodDays} days</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{membershipType.gracePeriodDays} days</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{membershipType.renewalLimit}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>${membershipType.fineRate}</TableCell>
                  <TableCell>
                    <Chip
                      label={membershipType.isActive ? 'Active' : 'Inactive'}
                      color={membershipType.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ fontSize: 10 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(membershipType)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(membershipType.id)}
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
          {editingMembershipType ? 'Edit Membership Type' : 'Add New Membership Type'}
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
              label="Max Books"
              fullWidth
              variant="outlined"
              type="number"
              value={formData.maxBooks}
              onChange={(e) => setFormData({ ...formData, maxBooks: parseInt(e.target.value) })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Max Duration (Days)"
              fullWidth
              variant="outlined"
              type="number"
              value={formData.maxDurationDays}
              onChange={(e) => setFormData({ ...formData, maxDurationDays: parseInt(e.target.value) })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Loan Period (Days)"
              fullWidth
              variant="outlined"
              type="number"
              value={formData.loanPeriodDays}
              onChange={(e) => setFormData({ ...formData, loanPeriodDays: parseInt(e.target.value) })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Renewal Limit"
              fullWidth
              variant="outlined"
              type="number"
              value={formData.renewalLimit}
              onChange={(e) => setFormData({ ...formData, renewalLimit: parseInt(e.target.value) })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Grace Period (Days)"
              fullWidth
              variant="outlined"
              type="number"
              value={formData.gracePeriodDays}
              onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Fine Rate"
              fullWidth
              variant="outlined"
              type="number"
              value={formData.fineRate}
              onChange={(e) => setFormData({ ...formData, fineRate: parseFloat(e.target.value) })}
              required
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingMembershipType ? 'Update' : 'Create'}
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

export default MembershipTypesManagement;
