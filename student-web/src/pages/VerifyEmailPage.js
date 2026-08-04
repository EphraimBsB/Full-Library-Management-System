import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { API_BASE_URL, DEFAULT_HEADERS } from '../constants/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link. No token provided.');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/verify-email`, {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          setError('');
        } else {
          setError(data.message || 'Email verification failed');
        }
      } catch (error) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '350px' }}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 350,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            {/* Logo */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.5rem' }}>
                Library Management System
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                Email Verification
              </Typography>
            </Box>

            {/* Loading State */}
            {loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={40} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Verifying your email...
                </Typography>
              </Box>
            )}

            {/* Error State */}
            {error && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ErrorIcon sx={{ fontSize: 40, color: '#f44336', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#f44336', mb: 2, fontSize: '1.25rem' }}>
                  Verification Failed
                </Typography>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
                <Button
                  variant="contained"
                  onClick={handleGoToLogin}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' },
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            )}

            {/* Success State */}
            {success && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#4caf50', mb: 2, fontSize: '1.25rem' }}>
                  Email Verified Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1rem' }}>
                  Your account has been activated. You can now log in with your credentials.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGoToLogin}
                  sx={{
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#45a049' },
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            )}

            {/* Invalid Token State */}
            {!token && !loading && !error && !success && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ErrorIcon sx={{ fontSize: 40, color: '#f44336', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#f44336', mb: 2, fontSize: '1.25rem' }}>
                  Invalid Verification Link
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1rem' }}>
                  The verification link you clicked is invalid or has expired.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGoToLogin}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' },
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default VerifyEmailPage;
