import React from 'react';
import {
  Card,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Email,
  Phone,
  Badge,
  School,
  CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { theme } from '../../../core/theme';
import type { User } from '../services/user.service';

interface MemberCardProps {
  member: User;
  onClick?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  const isNewMember = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(member.joinDate) > thirtyDaysAgo;
  }, [member.joinDate]);

  // Get membership status from memberships array
  const currentMembership = member.memberships?.[0]; // Get first (most recent) membership
  const membershipStatus = currentMembership?.status || 'inactive';
  const membershipTypeName = currentMembership?.type?.name.toUpperCase() || 'No Membership';

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid #EAECF0',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: theme.colors.primary,
          boxShadow: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Avatar
            src={member.avatarUrl}
            sx={{
              width: 40,
              height: 40,
              backgroundColor: `${theme.colors.primary}15`,
              color: theme.colors.primary,
              fontWeight: 700,
            }}
          >
            {member.firstName[0]}
            {member.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#101828', fontSize: '0.8rem' }}>
              {member.firstName} {member.lastName}
            </Typography>
            <Chip
              label={membershipStatus?.toUpperCase() || 'NO MEMBERSHIP'}
              size="small"
              sx={{
                height: '20px',
                fontSize: '9px',
                fontWeight: 700,
                backgroundColor: membershipStatus === 'active' ? '#059669' : 
                                 membershipStatus === 'inactive' ? '#9CA3AF' : 
                                 membershipStatus === 'expired' ? '#D97706' :
                                 membershipStatus === 'suspended' ? '#7C3AED' :
                                 membershipStatus === 'cancelled' ? '#EF4444' :
                                 '#6B7280',
                color: '#FFFFFF',
                borderRadius: '12px',
                ml: 1,
                letterSpacing: '0.5px',
                boxShadow: membershipStatus === 'active' ? '0 2px 4px rgba(5, 150, 105, 0.3)' : 
                          membershipStatus === 'inactive' ? '0 2px 4px rgba(156, 163, 175, 0.3)' : 
                          membershipStatus === 'expired' ? '0 2px 4px rgba(217, 119, 6, 0.3)' :
                          membershipStatus === 'suspended' ? '0 2px 4px rgba(124, 58, 237, 0.3)' :
                          membershipStatus === 'cancelled' ? '0 2px 4px rgba(239, 68, 68, 0.3)' :
                          '0 2px 4px rgba(107, 114, 128, 0.2)',
              }}
            />
            <Chip
              label={membershipTypeName || 'NO TYPE'}
              size="small"
              sx={{
                height: '20px',
                fontSize: '9px',
                fontWeight: 600,
                backgroundColor: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                ml: 1,
                letterSpacing: '0.3px',
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        <InfoRow icon={<Email sx={{ fontSize: 14 }} />} text={member.email} />
        {member.phoneNumber && (
          <InfoRow icon={<Phone sx={{ fontSize: 14 }} />} text={member.phoneNumber} />
        )}
        <InfoRow
          icon={<Badge sx={{ fontSize: 14 }} />}
          text={`Roll No: ${member.rollNumber || 'N/A'}`}
        />
        {member.degree && (
          <InfoRow icon={<School sx={{ fontSize: 14 }} />} text={member.degree} />
        )}
      </Box>

      <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#667085' }}>
          <CalendarToday sx={{ fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Since {format(new Date(member.joinDate), 'MMM yyyy')}
          </Typography>
        </Box>
        {isNewMember && (
          <Chip
            label="NEW"
            size="small"
            sx={{
              height: '18px',
              fontSize: '9px',
              fontWeight: 700,
              backgroundColor: '#F9F5FF',
              color: '#6941C6',
              borderRadius: '4px',
            }}
          />
        )}
      </Box>
    </Card>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475467' }}>
    <Box sx={{ color: '#98A2B3', display: 'flex' }}>{icon}</Box>
    <Typography
      variant="body2"
      sx={{
        fontSize: '11px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </Typography>
  </Box>
);

