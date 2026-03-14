import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Email,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { theme } from '../../../core/theme';
import { apiClient } from '../../../core/network/api_client';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/users/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (err.response?.status === 404) {
        setError('No account found with this email address');
      } else {
        setError('Failed to send reset email. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

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
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#e8f5e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <CheckCircle sx={{ fontSize: 30, color: '#4caf50' }} />
                </Box>
                <Typography variant="h5" component="h1" gutterBottom>
                  Check Your Email
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  We've sent a password reset link to
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {email}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  The link will expire in 2 hours for security reasons.
                </Typography>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/login')}
                  sx={{ mb: 1 }}
                >
                  Back to Login
                </Button>
                
                <Button
                  variant="text"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                    setError('');
                  }}
                >
                  Try Another Email
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                Didn't receive the email? Check your spam folder or contact support.
              </Typography>
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
                Forgot Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your email address and we'll send you a link to reset your password
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
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" />
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
                disabled={loading}
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
                  'Send Reset Link'
                )}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  onClick={() => navigate('/login')}
                  sx={{
                    color: theme.colors.primary,
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textTransform: 'none',
                  }}
                >
                  <ArrowBack sx={{ fontSize: 16 }} />
                  Back to Login
                </Button>
              </Box>
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
