import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS } from '../constants/api';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingRollNumber, setVerifyingRollNumber] = useState(false);
  const [rollNumberVerified, setRollNumberVerified] = useState(false);
  const [formData, setFormData] = useState({
    rollNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    course: '',
    degree: '',
    semester: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }

    // Reset verification if roll number changes
    if (name === 'rollNumber') {
      setRollNumberVerified(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleRollNumberCheck = async () => {
    if (!formData.rollNumber.trim()) {
      setError('Please enter your roll number');
      return;
    }

    setVerifyingRollNumber(true);
    setError('');

    try {
      // Check if student is registered via our backend proxy
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_STUDENT || '/auth/verify-student'}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ rollNumber: formData.rollNumber }),
      });
      const data = await response.json();

      if (data.result === false) {
        setError('You are not a registered student');
      } else {
        // Split the full name into first and last name
        const nameParts = (data.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Auto-fill form with student data
        setFormData(prev => ({
          ...prev,
          firstName: firstName,
          lastName: lastName,
          degree: data.programme || '',
          course: data.programme || '',
          semester: data.semester || '',
          email: data.UniversityEmail || '', // Add university email
          phoneNumber: data.Mobile || '',      // Add mobile number
        }));
        setRollNumberVerified(true);
        setError('');
      }
    } catch (error) {
      setError('Failed to verify roll number. Please try again.');
    } finally {
      setVerifyingRollNumber(false);
    }
  };

  const validateForm = () => {
    if (!rollNumberVerified) {
      setError('Please verify your roll number first');
      return false;
    }
    
    if (!formData.firstName || !formData.email || !formData.password) {
      setError('First name, email, and password are required');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create user account in backend
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER_STUDENT}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          rollNumber: formData.rollNumber,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          degree: formData.degree,
          course: formData.course,
          semester: formData.semester,
          joinDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.requiresEmailVerification) {
          // Show success message but don't auto-login
          setError('');
          setLoading(false);
          
          // Show success message that email verification is required
          const successMessage = document.createElement('div');
          successMessage.innerHTML = `
            <div style="text-align: center; padding: 20px;">
              <h3 style="color: #4caf50; margin-bottom: 10px;">✅ Registration Successful!</h3>
              <p style="color: #666; margin-bottom: 15px;">Thank you for registering! We've sent a verification email to <strong>${formData.email}</strong>.</p>
              <p style="color: #666; margin-bottom: 15px;">Please check your inbox and click the verification link to activate your account.</p>
              <p style="color: #ff9800; font-size: 14px;"><strong>⚠️ Important:</strong> You must verify your email before you can log in.</p>
              <button 
                onclick="window.location.href='/login'" 
                style="
                  background: #1976d2; 
                  color: white; 
                  border: none; 
                  padding: 10px 20px; 
                  border-radius: 5px; 
                  cursor: pointer;
                  margin-top: 20px;
                "
              >
                Go to Login
              </button>
            </div>
          `;
          
          document.body.innerHTML = successMessage.innerHTML;
        } else {
          // Legacy flow - auto-login (for backward compatibility)
          await login({
            rollNumber: formData.rollNumber,
            password: formData.password,
          });
          
          navigate('/');
        }
      } else {
        const errorData = await response.json();
        
        // Handle specific error messages
        if (errorData.message) {
          if (errorData.message.includes('already registered')) {
            setError(errorData.message + ' Please try logging in instead.');
          } else if (errorData.message.includes('already exists')) {
            setError(errorData.message + ' Please use a different roll number or email.');
          } else {
            setError(errorData.message);
          }
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
      <Container maxWidth="sm">
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                Student Registration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register with your university roll number
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="body2">{error}</Typography>
                  {error.includes('already registered') && (
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/login')}
                        sx={{ p: 0, minWidth: 'auto' }}
                      >
                        Go to Login
                      </Button>
                    </Box>
                  )}
                </Box>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Roll Number Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Roll Number *"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    disabled={loading || verifyingRollNumber}
                    required
                    sx={{ mb: 2 }}
                    helperText="Enter your university roll number to verify your identity"
                  />
                  {!rollNumberVerified && (
                    <Button
                      variant="outlined"
                      onClick={handleRollNumberCheck}
                      disabled={verifyingRollNumber || !formData.rollNumber.trim()}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      {verifyingRollNumber ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Verify Roll Number'
                      )}
                    </Button>
                  )}
                </Grid>

                {/* Auto-filled Fields (shown after verification) */}
                {rollNumberVerified && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name *"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled
                        required
                        sx={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled
                        sx={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email *"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                        required
                        sx={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        disabled
                        sx={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Degree/Course"
                        name="degree"
                        value={formData.degree}
                        onChange={handleChange}
                        disabled
                        sx={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        disabled
                        sx={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Password *"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirm Password *"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </>
                )}

                {/* Password Fields (shown after verification) */}
                {rollNumberVerified && (
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        mt: 2,
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' },
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                variant="text"
                onClick={() => navigate('/')}
                sx={{ color: 'white' }}
              >
                Back to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Signup;
