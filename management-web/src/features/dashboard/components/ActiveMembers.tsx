import {
  Box,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboard.service';
import { theme } from '../../../core/theme';

export const ActiveMembers: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboardSummary'],
        queryFn: DashboardService.getSummary,
    });
    
    const activeUsers = data?.activeUsers || [];

  return (
    <Box sx={{ width: '100%', p: 2, bgcolor: 'white' }}>
      <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '12px', color: '#101828' }}>Most Active Members</Typography>
      <Divider sx={{ mb: 2 }} />
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: theme.colors.primary }} /></Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activeUsers.map((user) => (
                <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Avatar sx={{ width: 32, height: 32, bgcolor: '#F9FAFB', color: '#667085', fontSize: '10px', fontWeight: 600 }}>
                         {user.firstName[0]}
                     </Avatar>
                     <Box sx={{ flexGrow: 1 }}>
                         <Typography sx={{ fontWeight: 600, fontSize: '10px', color: '#101828' }}>
                             {user.firstName} {user.lastName}
                         </Typography>
                         <Typography sx={{ fontSize: '9px', color: '#667085', fontWeight: 500 }}>
                             {user.rollNumber} • {user.borrowedBooks?.length || 0} books
                         </Typography>
                     </Box>
                     {user.degree && (
                         <Box sx={{ bgcolor: '#F9FAFB', borderRadius: '4px', px: 1, py: 0.25, border: '1px solid #EAECF0' }}>
                             <Typography sx={{ fontWeight: 600, fontSize: '8px', color: '#475467' }}>
                                 {user.degree.substring(0, 3).toUpperCase()}
                             </Typography>
                         </Box>
                     )}
                </Box>
            ))}
            {activeUsers.length === 0 && !isLoading && (
                <Typography sx={{ fontSize: '11px', color: '#667085', textAlign: 'center', py: 2 }}>No active members.</Typography>
            )}
        </Box>
      )}
    </Box>
  );
};
