import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/hooks/useAuth';
import { apiClient } from '../../../core/network/api_client';
import * as yup from 'yup';
import type { LoginCredentials } from '../../../shared/types';

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Please enter your email'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Please enter your password'),
});

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.post<any>('/auth/login', data);
      console.log('Login API response:', response);
      
      // Wait for state to be persisted before redirecting
      setAuth(response);
      
      // Give Zustand time to persist the data
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      console.log('Login error:', err);
      // ApiException stores message in .message property
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '400px' }}>
        <Card
          sx={{
            width: '100%',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            borderRadius: 2,
          }}
        >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img
              src="/admin/logo.png"
              alt="Logo"
              style={{ height: 60, marginBottom: 24 }}
            />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: theme.colors.primary,
                fontSize: '1.25rem',
              }}
            >
              Library Login
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 2, '& .MuiInputBase-root': { height: '42px' } }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 2, '& .MuiInputBase-root': { height: '42px' } }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="small"
              disabled={isLoading}
              sx={{
                backgroundColor: theme.colors.primary,
                py: 1,
                mb: 2,
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: theme.colors.secondary,
                },
              }}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>

            {/* <Button
              type="button"
              fullWidth
              variant="text"
              sx={{ color: theme.colors.primary, fontSize: '0.875rem' }}
            >
              Forgot Password?
            </Button> */}
          </form>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
};
