import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useAuthStore } from '../../../core/hooks';
import { TokenStorage } from '../../../core/utils/token_storage';
import { apiClient } from '../../../core/network/api_client';

const ProfileSettings: React.FC = () => {
  const { user, setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    degree: '',
    semester: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        degree: user.degree || '',
        semester: user.semester || '',
      });
    }
  }, [user]);

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

    // Clean form data - remove empty strings for optional fields
    const cleanedFormData = {
      firstName: formData.firstName?.trim() || undefined,
      lastName: formData.lastName?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      degree: formData.degree?.trim() || undefined,
      semester: formData.semester?.trim() || undefined,
    };

    try {
      const response = await apiClient.patch('/users/profile', cleanedFormData);
      const responseData = (response as any).data;
      
      // Update user in auth store
      setAuth({
        access_token: TokenStorage.getToken() || '',
        refresh_token: TokenStorage.getRefreshToken() || '',
        user: { ...user!, ...responseData },
      });

      setMessage('Profile updated successfully!');
      setMessageType('success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setMessage(errorMessage);
      setMessageType('error');
      console.error('Profile update error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setMessage('');
  };

  return (
    <Box>
      
      <Card sx={{ maxWidth: 600, margin: '0 auto', mt:'2rem' }}>
        <CardContent>
          <Avatar
            src={user?.avatarUrl || ''}
            alt={`${user?.firstName} ${user?.lastName}` || 'User Avatar'}
            sx={{ width: 80, height: 80, margin: '0 auto 12px', display: 'block' }}
          />
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  size="small"
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
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  size="small"
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
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  size="small"
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
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Degree/Program"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  size="small"
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
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  size="small"
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
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ fontSize: 12, py: 1 }}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
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

export default ProfileSettings;
