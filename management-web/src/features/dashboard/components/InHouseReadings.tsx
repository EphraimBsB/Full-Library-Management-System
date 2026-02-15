import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../../core/theme';
import { InhouseUsageService, InhouseUsageStatus } from '../../books/services/inhouse_usage.service';

export const InHouseReadings: React.FC = () => {
  const [filter, setFilter] = useState<InhouseUsageStatus | undefined>(InhouseUsageStatus.active);
  const queryClient = useQueryClient();

  const { data: counts } = useQuery({
    queryKey: ['inhouseCounts'],
    queryFn: InhouseUsageService.getCounts,
  });

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['inhouseUsages', filter],
    queryFn: () => InhouseUsageService.getAll(filter),
  });
  
  const forceEndMutation = useMutation({
      mutationFn: InhouseUsageService.forceEnd,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['inhouseUsages'] });
          queryClient.invalidateQueries({ queryKey: ['inhouseCounts'] });
      }
  });

  const handleForceEnd = (id: string, title: string) => {
      if (window.confirm(`Are you sure you want to force end the session for ${title}?`)) {
          forceEndMutation.mutate(id);
      }
  };


  return (
    <Box sx={{ 
      width: '100%', 
      p: 2, 
      bgcolor: '#FFFFFF', 
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography sx={{ fontWeight: 700, mb: 1, fontSize: '0.9rem', color: '#101828' }}>In Library Readings</Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ 
        display: 'flex', 
        gap: 1.5, 
        mb: 2, 
        overflowX: 'auto', 
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' } 
      }}>
        {Object.values(InhouseUsageStatus).map((status) => {
          const isSelected = filter === status;
          return (
            <Box
              key={status}
              onClick={() => setFilter(isSelected ? undefined : status)}
              sx={{
                padding: '6px 14px',
                borderRadius: '100px',
                cursor: 'pointer',
                fontSize: '9px',
                fontWeight: 600,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: isSelected ? theme.colors.primary : '#F9FAFB',
                border: `1px solid ${isSelected ? theme.colors.primary : '#EAECF0'}`,
                color: isSelected ? '#FFFFFF' : '#475467',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: isSelected ? theme.colors.primary : '#F2F4F7',
                }
              }}
            >
              {status.toUpperCase().replace('_', ' ')} ({counts?.[status] || 0})
            </Box>
          );
        })}
      </Box>

      {isLoading ? (
         <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: theme.colors.primary }} /></Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {usageData?.items.map((item) => {
            return (
              <Box 
                key={item.id} 
                sx={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '8px', 
                  border: '1px solid #EAECF0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'stretch',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                {/* Book Cover */}
                <Box
                  sx={{
                    width: 62,
                    flexShrink: 0,
                    backgroundColor: '#F2F4F7',
                    position: 'relative',
                  }}
                >
                  <img 
                    src={item.copy.book.coverImageUrl || '/default_book.jpg'} 
                    alt={item.copy.book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default_book.jpg'; }}
                  />
                </Box>

                {/* Details */}
                <Box sx={{ flexGrow: 1, minWidth: 0, p: 0.75, pr: 0.75, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '11px', 
                      color: '#101828',
                      mb: 0.1,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {item.copy.book.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <Typography sx={{ fontSize: '9px', color: '#667085', fontWeight: 500 }}>
                      Acc.No: {item.copy.accessNumber}
                    </Typography>
                    <Typography sx={{ fontSize: '9px', color: '#101828', fontWeight: 600 }}>
                      Reader: {item.user.firstName} {item.user.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '9px', color: '#667085', fontWeight: 500 }}>
                      Roll No: {item.user.rollNumber}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mt: 0.1 }}>
                      <Typography sx={{ fontSize: '9px', color: theme.colors.secondary, fontWeight: 700 }}>
                        Since: {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      {item.endedAt && (
                        <Typography sx={{ fontSize: '9px', color: '#667085', fontWeight: 600 }}>
                          Ended: {new Date(item.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Force End Button */}
                {item.status === InhouseUsageStatus.active && (
                  <Box
                    onClick={() => handleForceEnd(item.id, item.copy.book.title)}
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      px: 1,
                      py: 0.35,
                      backgroundColor: theme.colors.primary,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      zIndex: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.colors.secondary,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#FFFFFF'
                      }}
                    >
                      Force End
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
          {usageData?.items.length === 0 && !isLoading && (
             <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No readings found.</Typography>
             </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
