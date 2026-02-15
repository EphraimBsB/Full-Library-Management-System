import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../../core/network/api_client';

const PasswordSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/users/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setMessage('Password changed successfully!');
      setMessageType('success');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to change password');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setMessage('');
  };

  return (
    <Box>
      {/* <Typography variant="h5" gutterBottom sx={{ fontSize: '1.3rem' }}>
        change Password
      </Typography> */}
      
      <Card sx={{ maxWidth: 600, margin: '0 auto' }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Change your password to keep your account secure.
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  helperText="Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  error={formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword}
                  helperText={formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword ? 'Passwords do not match' : ''}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={messageType}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PasswordSettings;
