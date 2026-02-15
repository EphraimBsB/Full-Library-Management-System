import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  Email,
  Phone,
  Badge,
  School,
  History,
  Star,
  Note,
  Person,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { UserService, type User } from '../services/user.service';
import { theme } from '../../../core/theme';

interface MemberDetailsDialogProps {
  open: boolean;
  onClose: (success?: boolean) => void;
  userId: string;
  onEdit: (member: User) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return { bg: '#ECFDF3', color: '#027A48' };
    case 'suspended':
      return { bg: '#FEF3F2', color: '#B42318' };
    case 'expired':
      return { bg: '#FFFAEB', color: '#B54708' };
    default:
      return { bg: '#F2F4F7', color: '#344054' };
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const MemberDetailsDialog: React.FC<MemberDetailsDialogProps> = ({ open, onClose, userId, onEdit }) => {
  const [activeTab, setActiveTab] = useState(0);
  const queryClient = useQueryClient();

  const { data: profileSummary, isLoading, error } = useQuery({
    queryKey: ['member-summary', userId],
    queryFn: () => UserService.getProfileSummary(userId),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: () => UserService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose(true);
    },
  });

  if (isLoading) {
    return (
      <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogContent sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></DialogContent>
      </Dialog>
    );
  }

  if (error || !profileSummary) {
    return (
      <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogContent sx={{ p: 6 }}><Alert severity="error">Failed to load member details.</Alert></DialogContent>
      </Dialog>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '12px', maxHeight: '90vh' } }}
    >
      <DialogContent sx={{ p: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header / Profile Info */}
          <Box sx={{ p: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Avatar
                src={profileSummary.avatar || undefined}
                sx={{ width: 64, height: 64, fontSize: 28, fontWeight: 700, backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}
              >
                {profileSummary.name[0]}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#101828', mb: 0.5, fontSize: '1.2rem' }}>
                  {profileSummary.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={profileSummary.membershipStatus.toUpperCase()}
                    size="small"
                    sx={{
                      height: '20px',
                      fontWeight: 600,
                      fontSize: '10px',
                      backgroundColor: getStatusColor(profileSummary.membershipStatus).bg,
                      color: getStatusColor(profileSummary.membershipStatus).color,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#667085', fontWeight: 500, fontSize: '0.85rem' }}>
                    Member since {format(new Date(profileSummary.joinedAt), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', color: '#667085' }}>
                    <Email sx={{ fontSize: 14 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{profileSummary.email}</Typography>
                  </Box>
                  {profileSummary.phoneNumber && (
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', color: '#667085' }}>
                      <Phone sx={{ fontSize: 14 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{profileSummary.phoneNumber}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => {
                  const memberData: User = {
                    id: profileSummary.id,
                    firstName: profileSummary.name.split(' ')[0],
                    lastName: profileSummary.name.split(' ').slice(1).join(' '),
                    email: profileSummary.email,
                    phoneNumber: profileSummary.phoneNumber || undefined,
                    rollNumber: profileSummary.rollNumber || undefined,
                    degree: profileSummary.program || undefined,
                    course: undefined,
                    isActive: profileSummary.membershipStatus === 'active',
                    joinDate: profileSummary.joinedAt,
                    roleId: 1, // Default role
                    activeLoansCount: profileSummary.stats.borrow.active,
                    memberships: [{
                      id: 1,
                      status: profileSummary.membershipStatus as any,
                      startDate: profileSummary.joinedAt,
                      expiryDate: profileSummary.expiryDate || '',
                      membershipType: {
                        id: 1,
                        name: profileSummary.membershipType,
                        maxBooks: 5,
                        loanDurationDays: 14,
                        finePerDay: 1
                      }
                    }]
                  };
                  onEdit(memberData);
                }}
                sx={{ textTransform: 'none', borderRadius: '8px', color: '#344054', borderColor: '#D0D5DD' }}
              >
                Edit
              </Button>
              <IconButton onClick={() => onClose()} size="small" sx={{ color: '#667085' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          {/* Stats Cards */}
          <Box sx={{ p: 4, py: 3, display: 'flex', gap: 3 }}>
            <StatCard label="Active Loans" value={profileSummary.stats.borrow.active} color="#027A48" bg="#ECFDF3" />
            <StatCard label="Overdue" value={profileSummary.stats.borrow.overdue} color="#B42318" bg="#FEF3F2" />
            <StatCard label="Total Borrows" value={profileSummary.stats.borrow.returned + profileSummary.stats.borrow.active} color="#6941C6" bg="#F9F5FF" />
            <StatCard label="Favorites" value={profileSummary.stats.favoritesCount} color="#B54708" bg="#FFFAEB" />
          </Box>

          {/* Tabs */}
          <Box sx={{ px: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                borderBottom: '1px solid #EAECF0',
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 0, mr: 4, px: 0, fontSize: '0.85rem' },
              }}
            >
              <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
              <Tab icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" label="Borrowing History" />
              <Tab icon={<Star sx={{ fontSize: 18 }} />} iconPosition="start" label="Favorites" />
              <Tab icon={<Note sx={{ fontSize: 18 }} />} iconPosition="start" label="Notes" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem' }}>Personal details</Typography>
                  <InfoField icon={<Badge />} label="Roll Number" value={profileSummary.rollNumber || 'N/A'} />
                  <InfoField icon={<School />} label="Program" value={profileSummary.program || 'N/A'} />
                  <InfoField icon={<Person />} label="Role" value={profileSummary.role} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem' }}>Membership</Typography>
                  <InfoField label="Plan" value={profileSummary.membershipType} />
                  <InfoField label="Status" value={profileSummary.membershipStatus.toUpperCase()} />
                  <InfoField label="Expiry Date" value={profileSummary.expiryDate ? format(new Date(profileSummary.expiryDate), 'MMM d, yyyy') : 'N/A'} />
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <Typography variant="body2" color="text.secondary">Borrowing history logic coming soon...</Typography>
                {/* We could use the profileSummary.stats.borrow to show it's working */}
              </Box>
            </TabPanel>
          </Box>

          <Box sx={{ p: 4, pt: 0, mt: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="text"
              startIcon={<Delete />}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              sx={{ color: '#B42318', textTransform: 'none', fontWeight: 600 }}
            >
              Delete Member
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const StatCard = ({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) => (
  <Box sx={{ flex: 1, p: 2, borderRadius: '8px', backgroundColor: bg, border: `1px solid ${color}20` }}>
    <Typography variant="caption" sx={{ color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px' }}>{label}</Typography>
    <Typography variant="h4" sx={{ color, fontWeight: 700, mt: 0.5, fontSize: '1.2rem' }}>{value}</Typography>
  </Box>
);

const InfoField = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) => (
  <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-start' }}>
    {icon && <Box sx={{ color: '#98A2B3', mt: 0.2 }}>{icon}</Box>}
    <Box>
      <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500, fontSize: '11px' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054', fontSize: '13px' }}>{value}</Typography>
    </Box>
  </Box>
);
