import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Logout,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginDialog from '../auth/LoginDialog';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Debug user state
  React.useEffect(() => {
    console.log('Header - User state:', { user, isAuthenticated });
  }, [user, isAuthenticated]);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: 'white', 
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
          zIndex: 1300
        }}
      >
        <Toolbar>
          {/* Logo */}
          <Box
            component="img"
            src="/assets/logo.png"
            alt="ISBAT LMS"
            sx={{
              height: isMobile ? 40 : 50,
              cursor: 'pointer',
              marginRight: 2,
            }}
            onClick={() => navigate('/')}
          />

          <Box sx={{ flexGrow: 1 }} />

          {/* Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={() => navigate('/')}
                sx={{
                  color: '#BF0019',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: 12,
                }}
              >
                Home
              </Button>
            </Box>
          )}

          {/* User Actions */}
          {isAuthenticated ? (
            <>
              {!isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Avatar
                    src={user.avatarUrl}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      mr: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(191, 0, 25, 0.1)',
                      }
                    }}
                    onClick={handleMenuOpen}
                  >
                    {getUserInitials()}
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: 12,
                        cursor: 'pointer',
                        color: '#333333',
                        '&:hover': {
                          color: '#BF0019',
                        }
                      }}
                      onClick={handleMenuOpen}
                    >
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: 8.5, color: '#666' }}>
                      {user.degree}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: 8.5, color: '#666' }}>
                      {user.semester && `${user.semester}`}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {isMobile && (
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  color="inherit"
                >
                  <Avatar
                    src={user?.avatarUrl}
                    sx={{ width: 32, height: 32 }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              )}

              {/* Profile Menu */}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  <Person sx={{ mr: 1, fontSize: 16 }} />
                  <Typography sx={{ fontSize: 10 }}>My Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1, fontSize: 16, color: 'red' }} />
                  <Typography sx={{ fontSize: 10, color: 'red' }}>Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {!isMobile && (
                <Button
                  onClick={handleLoginClick}
                  sx={{
                    color: '#333333',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontSize: 12,
                  }}
                >
                  Sign In
                </Button>
              )}
              {/* <Button
                variant="contained"
                onClick={() => navigate('/signup')}
                sx={{
                  backgroundColor: '#BF0019',
                  '&:hover': { backgroundColor: '#A00015' },
                  borderRadius: 5,
                  textTransform: 'none',
                  fontSize: 12,
                }}
              >
                Sign Up
              </Button> */}
            </Box>
          )}
        </Toolbar>
        <LoginDialog 
          open={loginDialogOpen} 
          onClose={() => setLoginDialogOpen(false)} 
        />
      </AppBar>
    </>
  );
};

export default Header;
