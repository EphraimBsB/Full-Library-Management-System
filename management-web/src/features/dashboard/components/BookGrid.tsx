import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { theme } from '../../../core/theme';
import { DashboardService } from '../services/dashboard.service';
import { BookCard } from '../../../shared/components/Books/BookCard';
import { BookDetailsDialog } from '../../books/components/BookDetailsDialog';
import { useQueryClient } from '@tanstack/react-query';

export const BookGrid: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: DashboardService.getSummary,
  });

  const handleOpenDetails = (bookId: number) => {
    setSelectedBookId(bookId);
  };

  const handleCloseDetails = () => {
    setSelectedBookId(null);
  };

  const getBooks = () => {
    if (!data) return [];
    switch (tabIndex) {
      case 0:
        return data.recentBooks;
      case 1:
        return data.topRatedBooks;
      case 2:
        return data.mostBorrowedBooks;
      default:
        return data.recentBooks;
    }
  };

  const books = getBooks();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '14px' }}>BOOKS</Typography>
        <Tabs
          value={tabIndex}
          onChange={handleChange}
          aria-label="book tabs"
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': { gap: 1 }
          }}
        >
          <Tab
            label="Recently Added"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 32,
              fontSize: '12px',
              px: 1.5,
              py: 0.75,
              borderRadius: '16px',
              border: '1px solid #D0D5DD',
              color: '#344054',
              '&.Mui-selected': {
                backgroundColor: theme.colors.primary,
                color: 'white',
                borderColor: theme.colors.primary
              }
            }}
          />
          <Tab
            label="Top Rated"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 32,
              fontSize: '12px',
              px: 1.5,
              py: 0.75,
              borderRadius: '16px',
              border: '1px solid #D0D5DD',
              color: '#344054',
              '&.Mui-selected': {
                backgroundColor: theme.colors.primary,
                color: 'white',
                borderColor: theme.colors.primary
              }
            }}
          />
          <Tab
            label="Most Borrowed"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 32,
              fontSize: '12px',
              px: 1.5,
              py: 0.75,
              borderRadius: '16px',
              border: '1px solid #D0D5DD',
              color: '#344054',
              '&.Mui-selected': {
                backgroundColor: theme.colors.primary,
                color: 'white',
                borderColor: theme.colors.primary
              }
            }}
          />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Failed to load books</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            columnGap: '10px',
            rowGap: '10px',
            width: '100%',
            alignItems: 'start'
          }}
        >
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onTap={() => handleOpenDetails(book.id)}
            />
          ))}
          {books.length === 0 && (
            <Box sx={{ gridColumn: 'span 5', p: 4 }}>
              <Typography variant="body2" color="text.secondary" align="center">No books found.</Typography>
            </Box>
          )}
        </Box>
      )}
      {selectedBookId && (
        <BookDetailsDialog
          open={true}
          onClose={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
            handleCloseDetails();
          }}
          bookId={selectedBookId}
        />
      )}
    </Box>
  );
};

