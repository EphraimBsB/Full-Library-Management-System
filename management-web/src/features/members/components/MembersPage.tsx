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
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'firstName' | 'joinDate' | 'rollNumber'>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: statsResponse } = useQuery({
    queryKey: ['members-stats'],
    queryFn: () => UserService.getStats(),
  });

  const { data: membersResponse, isLoading, error } = useQuery({
    queryKey: ['members', search, filter, sortBy, sortOrder, page],
    queryFn: () => UserService.getUsers({ 
      search, 
      page, 
      limit: 12, // Using 12 for better grid rendering
      sortBy, 
      sortOrder, 
      isActive: filter === 'all' ? undefined : filter === 'active' ? true : false 
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1 }}>Total Members</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>{statsResponse.total}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1 }}>Active Members</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#12B76A' }}>{statsResponse.active}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #EAECF0' }}>
            <Typography variant="body2" sx={{ color: '#667085', mb: 1 }}>Inactive Members</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#F04438' }}>{statsResponse.inactive}</Typography>
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
          onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
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
          Filter
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
            onClick={() => { setSearch(''); setFilter('all'); setPage(1); }}
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

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: '8px', mt: 1, minWidth: 160 } }}
      >
        <MenuItem onClick={() => { setFilter('all'); setFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{filter === 'all' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>All Members</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setFilter('active'); setFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{filter === 'active' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Active Only</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setFilter('inactive'); setFilterMenuAnchor(null); setPage(1); }}>
          <ListItemIcon>{filter === 'inactive' && <Check fontSize="small" />}</ListItemIcon>
          <ListItemText sx={{ fontSize: 12 }}>Inactive Only</ListItemText>
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
