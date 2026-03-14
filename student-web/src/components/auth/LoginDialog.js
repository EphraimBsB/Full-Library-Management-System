import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Link,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  ErrorOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginDialog = ({ open, onClose, message = 'Please log in to continue' }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrRollNumber: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.emailOrRollNumber) {
      newErrors.emailOrRollNumber = 'Please enter your email or roll number';
    } else {
      // Check if it's an email or roll number (matching Flutter validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const rollNumberRegex = /^[A-Za-z0-9]+$/;
      
      if (!emailRegex.test(formData.emailOrRollNumber) && !rollNumberRegex.test(formData.emailOrRollNumber)) {
        newErrors.emailOrRollNumber = 'Please enter a valid email or roll number';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Determine if it's email or roll number and send appropriate data
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(formData.emailOrRollNumber);
      
      const credentials = {
        email: isEmail ? formData.emailOrRollNumber : undefined,
        rollNumber: !isEmail ? formData.emailOrRollNumber : undefined,
        password: formData.password,
      };
      
      await login(credentials);
      onClose();
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Login failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ emailOrRollNumber: '', password: '' });
    setErrors({});
    onClose();
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#BF0019' }}>
          Sign In
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 3 }}>
          {/* Message */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {message}
          </Typography>

          {/* Error Display */}
          {errors.submit && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              icon={<ErrorOutline />}
            >
              {errors.submit}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email or Roll Number"
            name="emailOrRollNumber"
            value={formData.emailOrRollNumber}
            onChange={handleChange}
            error={!!errors.emailOrRollNumber}
            helperText={errors.emailOrRollNumber}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: '#BF0019' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#BF0019',
                },
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#BF0019' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#BF0019',
                },
              },
            }}
          />

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              onClick={handleForgotPassword}
              variant="text"
              sx={{ 
                color: '#BF0019',
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
            >
              Forgot your password?
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose}
            disabled={isLoading}
            sx={{ 
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              }
            }}
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{
              backgroundColor: '#BF0019',
              '&:hover': { backgroundColor: '#A00015' },
              minWidth: 120,
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 16, 
                    height: 16, 
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    }
                  }} 
                />
                LOGIN
              </Box>
            ) : (
              'LOGIN'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LoginDialog;
