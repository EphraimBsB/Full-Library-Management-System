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
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/hooks';
import { LoanService, BookRequestStatus } from '../../../features/loans/services/loan.service';

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
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch pending requests count for notification
  const { data: pendingRequests } = useQuery({
    queryKey: ['book-requests', BookRequestStatus.PENDING],
    queryFn: () => LoanService.getAllBookRequests(BookRequestStatus.PENDING),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const { data: renewalRequests } = useQuery({
    queryKey: ['renewal-requests', BookRequestStatus.RENEWAL_PENDING],
    queryFn: () => LoanService.getRenewalRequests(BookRequestStatus.RENEWAL_PENDING),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const pendingCount = (pendingRequests?.length || 0) + (renewalRequests?.length || 0);

  // Get current route to determine selected index
  const getCurrentIndex = () => {
    const currentPath = location.pathname;
    const routes = ['/dashboard', '/books', '/loans', '/members'];
    return routes.findIndex(route => currentPath.includes(route));
  };

  const selectedIndex = getCurrentIndex();

  const handleNavigation = (index: number) => {
    const routes = ['/dashboard', '/books', '/loans', '/members'];
    if (routes[index]) {
      navigate(routes[index]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          src="/admin/logo.png"
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
          src={user?.avatarUrl || "/admin/default_avatar.png"}
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
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{item.label}</span>
                      {item.label === 'Loans' && pendingCount > 0 && (
                        <Box
                          sx={{
                            backgroundColor: theme.colors.primary,
                            color: 'white',
                            borderRadius: '10px',
                            px: 0.8,
                            py: 0.1,
                            fontSize: '9px',
                            fontWeight: 600,
                            lineHeight: 1.5,
                            minWidth: '16px',
                            textAlign: 'center',
                            ml: 1
                          }}
                        >
                          {pendingCount}
                        </Box>
                      )}
                    </Box>
                  }
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
          onClick={() => navigate('/settings')}
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

        {/* Admin Dashboard */}
        {user?.role?.name === 'Admin' && (
          <ListItemButton
            onClick={() => navigate('/admin')}
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
                <AdminPanelSettings />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Admin System"
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
        )}

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
