import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Sort,
  Check,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { theme } from '../../../core/theme';
import { UserService, type User } from '../services/user.service';
import { MemberCard } from './MemberCard';
import { MemberFormDialog } from './MemberFormDialog';
import { MemberDetailsDialog } from './MemberDetailsDialog';

import { Pagination } from '@mui/material';

export const MembersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'firstName' | 'joinDate' | 'rollNumber'>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [accountFilterMenuAnchor, setAccountFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [membershipFilterMenuAnchor, setMembershipFilterMenuAnchor] = useState<null | HTMLElement>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: statsResponse } = useQuery({
    queryKey: ['members-stats'],
    queryFn: () => UserService.getStats(),
  });

  const { data: membersResponse, isLoading, error } = useQuery({
    queryKey: ['members', search, accountFilter, membershipFilter, sortBy, sortOrder, page],
    queryFn: () => UserService.getUsers({ 
      search, 
      page, 
      limit: 12, // Using 12 for better grid rendering
      sortBy, 
      sortOrder, 
      isActive: accountFilter === 'all' ? undefined : accountFilter === 'active' ? true : false,
      isMembershipActive: membershipFilter === 'all' ? undefined : membershipFilter === 'active' ? true : false
    }),
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1); // Reset page on search
  };

  const members = membersResponse?.data || [];
  const totalPages = Math.ceil((membersResponse?.total || 0) / (membersResponse?.limit || 12));

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: 18 }}>
            Library Members
          </Typography>
          <Typography variant="body2" sx={{ color: '#667085', fontSize: 12 }}>
            Manage and monitor your library's community.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedMember(null);
            setIsFormOpen(true);
          }}
          sx={{
            backgroundColor: theme.colors.primary,
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            px: 2.5,
            py: 1,
            '&:hover': { backgroundColor: theme.colors.secondary },
          }}
        >
          Add New Member
        </Button>
      </Box>

      {/* Stats Cards */}
      {statsResponse && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1, fontSize: 11 }}>Total Accounts</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>{statsResponse.totalAccounts}</Typography>
            <Typography variant="caption" sx={{ color: '#98A2B3', display: 'block', mt: 0.5, fontSize: 10 }}>All registered users</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1, fontSize: 11 }}>Active Accounts</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#12B76A' }}>{statsResponse.activeAccounts}</Typography>
            <Typography variant="caption" sx={{ color: '#98A2B3', display: 'block', mt: 0.5, fontSize: 10 }}>Verified login access</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1, fontSize: 11 }}>Inactive Accounts</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#F04438' }}>{statsResponse.inactiveAccounts}</Typography>
            <Typography variant="caption" sx={{ color: '#98A2B3', display: 'block', mt: 0.5, fontSize: 10 }}>Disabled or unverified</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1, fontSize: 11 }}>Active Memberships</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#12B76A' }}>{statsResponse.activeMemberships}</Typography>
            <Typography variant="caption" sx={{ color: '#98A2B3', display: 'block', mt: 0.5, fontSize: 10 }}>Valid library access</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1, fontSize: 11 }}>Inactive Memberships</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#F04438' }}>{statsResponse.inactiveMemberships}</Typography>
            <Typography variant="caption" sx={{ color: '#98A2B3', display: 'block', mt: 0.5, fontSize: 10 }}>Expired or suspended</Typography>
          </Box>
        </Box>
      )}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          placeholder="Search members by name, email or roll number..."
          value={search}
          onChange={handleSearchChange}
          size="small"
          sx={{ 
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'white',
              height: '36px'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#667085', fontSize: 16 }} />
              </InputAdornment>
            ),
            sx: { fontSize: 12 }
          }}
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={(e) => setAccountFilterMenuAnchor(e.currentTarget)}
          sx={{ 
            textTransform: 'none', 
            borderRadius: '8px', 
            color: '#344054', 
            borderColor: '#D0D5DD',
            backgroundColor: 'white',
            fontWeight: 600,
            fontSize: 12
          }}
        >
          Account Filter
        </Button>

        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={(e) => setMembershipFilterMenuAnchor(e.currentTarget)}
          sx={{ 
            textTransform: 'none', 
            borderRadius: '8px', 
            color: '#344054', 
            borderColor: '#D0D5DD',
            backgroundColor: 'white',
            fontWeight: 600,
            fontSize: 12
          }}
        >
          Membership Filter
        </Button>

        <Button
          variant="outlined"
          startIcon={<Sort />}
          onClick={(e) => setSortMenuAnchor(e.currentTarget)}
          sx={{ 
            textTransform: 'none', 
            borderRadius: '8px', 
            color: '#344054', 
            borderColor: '#D0D5DD',
            backgroundColor: 'white',
            fontWeight: 600,
            fontSize: 12
          }}
        >
          Sort
        </Button>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="error">Failed to load members. Please try again.</Typography>
        </Box>
      ) : members.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #EAECF0' }}>
          <Typography sx={{ color: '#667085', mb: 1 }}>No members found matching your criteria.</Typography>
          <Button 
            variant="text" 
            onClick={() => { setSearch(''); setAccountFilter('all'); setMembershipFilter('all'); setPage(1); }}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Clear all filters
          </Button>
        </Box>
      ) : (
        <>
          <Box 
            sx={{ 
              display: 'grid', 
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            }, 
            columnGap: '15px', 
            rowGap: '15px',
            width: '100%',
            alignItems: 'start'
          }}
        >
          {members.map((member) => (
            <MemberCard 
              key={member.id}
              member={member} 
              onClick={() => {
                setSelectedUserId(member.id);
                setIsDetailsOpen(true);
              }}
            />
          ))}
        </Box>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, value) => setPage(value)} 
              color="primary" 
              size="medium"
            />
          </Box>
        )}
        </>
      )}

      {/* Account Filter Menu */}
      <Menu
        anchorEl={accountFilterMenuAnchor}
        open={Boolean(accountFilterMenuAnchor)}
        onClose={() => setAccountFilterMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: '8px', mt: 1, minWidth: 160 } }}
      >
        <MenuItem onClick={() => { setAccountFilter('all'); setAccountFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{accountFilter === 'all' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>All Accounts</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAccountFilter('active'); setAccountFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{accountFilter === 'active' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Active Accounts Only</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAccountFilter('inactive'); setAccountFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{accountFilter === 'inactive' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Inactive Accounts Only</ListItemText>
        </MenuItem>
      </Menu>

      {/* Membership Filter Menu */}
      <Menu
        anchorEl={membershipFilterMenuAnchor}
        open={Boolean(membershipFilterMenuAnchor)}
        onClose={() => setMembershipFilterMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: '8px', mt: 1, minWidth: 160 } }}
      >
        <MenuItem onClick={() => { setMembershipFilter('all'); setMembershipFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{membershipFilter === 'all' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>All Memberships</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMembershipFilter('active'); setMembershipFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{membershipFilter === 'active' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Active Memberships Only</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMembershipFilter('inactive'); setMembershipFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{membershipFilter === 'inactive' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Inactive Memberships Only</ListItemText>
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: '8px', mt: 1, minWidth: 180 } }}
      >
        <MenuItem onClick={() => { setSortBy('firstName'); setSortMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{sortBy === 'firstName' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Name</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('joinDate'); setSortMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{sortBy === 'joinDate' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Join Date</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('rollNumber'); setSortMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{sortBy === 'rollNumber' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Roll Number</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setSortOrder('asc'); setSortMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{sortOrder === 'asc' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Ascending</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSortOrder('desc'); setSortMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{sortOrder === 'desc' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Descending</ListItemText>
        </MenuItem>
      </Menu>

      <MemberFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember || undefined}
      />

      {selectedUserId && (
        <MemberDetailsDialog
          open={isDetailsOpen}
          userId={selectedUserId}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedUserId(null);
          }}
          onEdit={(member) => {
            setIsDetailsOpen(false);
            setSelectedMember(member);
            setIsFormOpen(true);
          }}
        />
      )}
    </Box>
  );
};
