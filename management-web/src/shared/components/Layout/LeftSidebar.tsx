import React from 'react';
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  MenuBook,
  LibraryBooks,
  People,
  Settings,
  Logout,
} from '@mui/icons-material';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/hooks';

interface LeftSidebarProps {
  currentIndex?: number;
  onItemSelected?: (index: number) => void;
}

const navigationItems = [
  {
    icon: <Dashboard />,
    label: 'Dashboard',
    route: '/',
  },
  {
    icon: <MenuBook />,
    label: 'Books',
    route: '/books',
  },
  {
    icon: <LibraryBooks />,
    label: 'Loans',
    route: '/loans',
  },
  {
    icon: <People />,
    label: 'Members',
    route: '/members',
  },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = () => {
  const { user, logout } = useAuthStore();

  // Get current route to determine selected index
  const getCurrentIndex = () => {
    const currentPath = window.location.pathname;
    const routes = ['/', '/books', '/loans', '/members'];
    return routes.indexOf(currentPath);
  };

  const selectedIndex = getCurrentIndex();

  const handleNavigation = (index: number) => {
    const routes = ['/', '/books', '/loans', '/members'];
    if (routes[index]) {
      window.location.href = routes[index];
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <Box
      sx={{
        width: 220,
        backgroundColor: theme.colors.surface,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ height: 34 }} />
      
      {/* Logo and App Name */}
      <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: 120 }}
        />
        <Box sx={{ height: 20 }} />
        <Avatar
          sx={{
            width: 50,
            height: 50,
            mb: 1,
            backgroundColor: theme.colors.background,
          }}
          src={user?.avatarUrl || "/default_avatar.png"}
        >
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ height: 6 }} />
        <Typography sx={{ fontSize: 10, fontWeight: 600 }}>
          {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}
        </Typography>
        <Typography
          sx={{
            fontSize: 8,
            color: theme.colors.textSecondary,
          }}
        >
          {user?.role?.name || 'Role'}
        </Typography>
      </Box>

      <Box sx={{ height: 32 }} />
      <Divider sx={{ mx: 2, borderColor: theme.colors.textSecondary, opacity: 0.5 }} />
      <Box sx={{ height: 19 }} />

      {/* Navigation Items */}
      <Box sx={{ px: 1.5, flex: 1 }}>
        {navigationItems.map((item, index) => {
          const isSelected = selectedIndex === index;
          return (
            <Box
              key={item.label}
              sx={{
                mb: 0.25,
                backgroundColor: isSelected ? '#FFF4F2' : 'transparent',
                borderRadius: 1.5,
              }}
            >
              <ListItemButton
                onClick={() => handleNavigation(index)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 'auto',
                    mr: 2,
                    color: isSelected ? theme.colors.primary : '#667085',
                  }}
                >
                  <Box sx={{ fontSize: 12 }}>
                    {item.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? theme.colors.primary : '#344054',
                    },
                    margin: 0,
                  }}
                />
              </ListItemButton>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 'auto' }}>
        {/* Settings */}
        <ListItemButton
          onClick={() => window.location.href = '/settings'}
          sx={{
            px: 3,
            py: 1,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 'auto',
              mr: 2,
            }}
          >
            <Box sx={{ fontSize: 14 }}>
              <Settings />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: 11,
                color: '#344054',
                fontWeight: 400,
              },
              margin: 0,
            }}
          />
        </ListItemButton>

        {/* Log Out */}
        <ListItemButton
          onClick={handleLogout}
          sx={{
            px: 3,
            py: 1,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 'auto',
              mr: 2,
            }}
          >
            <Box sx={{ fontSize: 14 }}>
              <Logout />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary="Log Out"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: 11,
                color: '#344054',
                fontWeight: 400,
              },
              margin: 0,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
};
