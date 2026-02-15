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

interface UserRole {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  deletedAt?: string;
}

interface UserRoleFormData {
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

const UserRolesManagement: React.FC = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<UserRoleFormData>({
    name: '',
    description: '',
    permissions: [],
    isActive: true,
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_ROLES.LIST, {
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
        setUserRoles(data);
        setTotal(data.length);
      } else {
        // Paginated response
        setUserRoles(data.data || data);
        setTotal(data.total || data.length);
      }
    } catch (error: any) {
      setMessage(`Failed to fetch user roles: ${error.message || 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [page, rowsPerPage, search]);

  const handleOpenDialog = (userRole?: UserRole) => {
    if (userRole) {
      setEditingUserRole(userRole);
      setFormData({
        name: userRole.name,
        description: userRole.description || '',
        permissions: userRole.permissions || [],
        isActive: userRole.isActive,
      });
    } else {
      setEditingUserRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUserRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (editingUserRole) {
        await apiClient.patch(API_CONFIG.ENDPOINTS.USER_ROLES.UPDATE.replace(':id', editingUserRole.id.toString()), formData);
        setMessage('User role updated successfully!');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.USER_ROLES.CREATE, formData);
        setMessage('User role created successfully!');
      }
      setMessageType('success');
      handleCloseDialog();
      fetchUserRoles();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save user role');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user role?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.USER_ROLES.DELETE.replace(':id', id.toString()));
      setMessage('User role deleted successfully!');
      setMessageType('success');
      fetchUserRoles();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete user role');
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
          User Roles Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontSize: '0.75rem' }}
        >
          Add User Role
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search user roles..."
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
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Permissions</TableCell>
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
            ) : userRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ fontSize: '0.75rem' }}>No user roles found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              userRoles.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{userRole.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{userRole.description || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {userRole.permissions.map((permission, index) => (
                        <Chip
                          key={index}
                          label={permission}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={userRole.isActive ? 'Active' : 'Inactive'}
                      color={userRole.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(userRole)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(userRole.id)}
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
          {editingUserRole ? 'Edit User Role' : 'Add New User Role'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Role Name"
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
              <InputLabel>Permissions</InputLabel>
              <Select
                multiple
                value={formData.permissions}
                onChange={(e) => {
                  const selectedPermissions = e.target.value as string[];
                  setFormData({ ...formData, permissions: selectedPermissions });
                }}
                label="Permissions"
                renderValue={(selectedPermissions) => selectedPermissions.join(', ')}
                >
                <MenuItem value="users.read">Read Users</MenuItem>
                <MenuItem value="users.write">Write Users</MenuItem>
                <MenuItem value="users.delete">Delete Users</MenuItem>
                <MenuItem value="users.manage">Manage Users</MenuItem>
                <MenuItem value="books.read">Read Books</MenuItem>
                <MenuItem value="books.write">Write Books</MenuItem>
                <MenuItem value="loans.read">Read Loans</MenuItem>
                <MenuItem value="loans.write">Write Loans</MenuItem>
                <MenuItem value="loans.return">Return Loans</MenuItem>
                <MenuItem value="loans.renew">Renew Loans</MenuItem>
                <MenuItem value="loans.return">Return Loans</MenuItem>
                <MenuItem value="dashboard.read">View Dashboard</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingUserRole ? 'Update' : 'Create'}
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

export default UserRolesManagement;
