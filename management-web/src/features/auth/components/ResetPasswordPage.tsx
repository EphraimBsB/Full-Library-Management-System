import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { theme } from '../../../core/theme';
import { apiClient } from '../../../core/network/api_client';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Password strength requirements
  const passwordRequirements = {
    minLength: 8,
    hasUppercase: /[A-Z]/.test(formData.newPassword),
    hasLowercase: /[a-z]/.test(formData.newPassword),
    hasNumber: /\d/.test(formData.newPassword),
  };

  const isPasswordValid = () => {
    return (
      formData.newPassword.length >= passwordRequirements.minLength &&
      passwordRequirements.hasUppercase &&
      passwordRequirements.hasLowercase &&
      passwordRequirements.hasNumber
    );
  };

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setValidatingToken(false);
      return;
    }

    // Validate token format (basic check)
    if (token.length !== 64) {
      setError('Invalid reset link. Please request a new password reset.');
      setValidatingToken(false);
      return;
    }

    // Token format looks valid
    setTokenValid(true);
    setValidatingToken(false);
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid()) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/users/reset-password', {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid or expired reset token');
      } else {
        setError('Failed to reset password. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  if (validatingToken) {
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
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6">Validating reset link...</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  if (!tokenValid) {
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
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Error sx={{ fontSize: 48, color: '#f44336', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Invalid Reset Link
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {error}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  if (success) {
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
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom>
                Password Reset Successful
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your password has been successfully reset. You can now log in with your new password.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
                sx={{ mt: 3 }}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

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
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
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
                  mb: 1,
                }}
              >
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your new password below
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, fontSize: '0.875rem' }}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
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
                        aria-label="toggle password visibility"
                        onClick={toggleShowPassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2, '& .MuiInputBase-root': { height: '42px' } }}
              />

              {/* Password Requirements */}
              {formData.newPassword && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password must contain:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: formData.newPassword.length >= passwordRequirements.minLength ? '#4caf50' : '#f44336',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {formData.newPassword.length >= passwordRequirements.minLength ? '✓' : '○'} At least 8 characters
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: passwordRequirements.hasUppercase ? '#4caf50' : '#f44336',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {passwordRequirements.hasUppercase ? '✓' : '○'} One uppercase letter
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: passwordRequirements.hasLowercase ? '#4caf50' : '#f44336',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {passwordRequirements.hasLowercase ? '✓' : '○'} One lowercase letter
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: passwordRequirements.hasNumber ? '#4caf50' : '#f44336',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {passwordRequirements.hasNumber ? '✓' : '○'} One number
                    </Typography>
                  </Box>
                </Box>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
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
                        aria-label="toggle password visibility"
                        onClick={toggleShowConfirmPassword}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3, '& .MuiInputBase-root': { height: '42px' } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="small"
                disabled={loading || !isPasswordValid() || !formData.confirmPassword}
                sx={{
                  backgroundColor: theme.colors.primary,
                  py: 1.5,
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: theme.colors.secondary,
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Reset Password'
                )}
              </Button>
            </Box>

            {/* Help Text */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Need help? Contact library support at{' '}
                <a 
                  href="mailto:ilims@isbatuniversity.com" 
                  style={{ color: theme.colors.primary, textDecoration: 'none' }}
                >
                  ilims@isbatuniversity.com
                </a>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
