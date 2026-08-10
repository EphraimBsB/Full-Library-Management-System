import React from 'react';
import {
  Card,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import {
  MenuBook,
  People,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { theme } from '../../../core/theme';
import { DashboardService } from '../services/dashboard.service';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card
    sx={{
      flex: 1,
      p: 2,
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #EAECF0',
      boxShadow: 'none',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}15`,
        borderRadius: '8px',
        color: color,
        mr: 1.5,
        flexShrink: 0,
      }}
    >
      {React.cloneElement(icon as React.ReactElement<SvgIconProps>, { sx: { fontSize: 16 } })}
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#101828',
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: '10px',
          color: '#667085',
          mt: 0.25,
        }}
      >
        {title}
      </Typography>
    </Box>
  </Card>
);

export const DashboardSummary: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: DashboardService.getSummary,
    refetchInterval: 10000,
  });

  const { data: visitorData } = useQuery({
    queryKey: ['visitorStats'],
    queryFn: DashboardService.getVisitorStats,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard stats</Alert>;
  }

  const stats = [
    {
      title: 'Total Copies',
      value: data?.stats.totalCopies || 0,
      icon: <MenuBook />,
      color: theme.colors.primary,
    },
    {
      title: 'Issued Books',
      value: data?.stats.activeLoans || 0,
      icon: <TrendingUp />,
      color: theme.colors.warning,
    },
    {
      title: 'Total Users',
      value: data?.stats.totalUsers || 0,
      icon: <People />,
      color: theme.colors.info,
    },
    {
      title: 'Site Visitors (Today)',
      value: visitorData?.uniqueSessionsToday || 0,
      icon: <Visibility />,
      color: '#4caf50',
    }
    //  {
    //   title: 'Overdue Loans',
    //   value: data?.stats.overdueLoans || 0,
    //   icon: <TrendingUp />,
    //   color: theme.colors.secondary,
    // },
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      {stats.map((stat, index) => (
        <Box key={index} sx={{ flex: '1 1 0', minWidth: { xs: '100%', sm: 'calc(50% - 14px)', md: 'calc(33.33% - 14px)' } }}>
          <StatCard {...stat} />
        </Box>
      ))}
    </Box>
  );
};
