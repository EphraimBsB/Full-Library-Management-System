import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import { Search, MenuBook } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { ApiService } from '../services/api';
import BookCard from '../components/books/BookCard';
import Header from '../components/layout/Header';
import ActiveSessionBanner from '../components/reading/ActiveSessionBanner';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch books with React Query
  const {
    data: booksData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['books', page, debouncedSearch],
    () => ApiService.getBooks({
      page,
      limit: 12,
      search: debouncedSearch || undefined,
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        console.log('API Response structure is correct!');
      },
    }
  );

  // Fetch active reading session
  const { data: activeSession, refetch: refetchActiveSession } = useQuery(
    'activeSession',
    ApiService.getActiveSession,
    {
      enabled: isAuthenticated,
      refetchInterval: 30000, // Refetch every 30 seconds
      select: (data) => data.items && data.items.length > 0 ? data.items[0] : null,
    }
  );

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page on search
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleBorrowRequest = (book) => {
    // This would open a borrow request dialog
    console.log('Borrow request for:', book.title);
    // Implementation would go here
  };

  const handleStartReading = (book) => {
    // This would open the ebook reader
    console.log('Start reading:', book.title);
    // Implementation would go here
  };

  const handleEndSession = async () => {
    // This is now handled by the ActiveSessionBanner component
    // Just refetch the session data
    refetchActiveSession();
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingTop: '64px' }}>
      <Header />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Active Session Banner */}
        {isAuthenticated && activeSession && (
          <ActiveSessionBanner
            session={activeSession}
            onSessionEnd={refetchActiveSession}
          />
        )}

        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#000000', fontSize: 18 }}>
            Find a book
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666666',
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: 12,
            }}
          >
            Today a reader, Tomorrow a leader<br />
            find a book by title or by author, borrow a book, find book location in the library. Everything you need for better future and success has already been writen.
          </Typography>
        </Box>

        {/* Active Session Banner */}
        {isAuthenticated && activeSession && activeSession.length > 0 && (
          <Paper
            sx={{
              p: 3,
              mb: 4,
              backgroundColor: 'rgba(191, 0, 25, 0.1)',
              border: '1px solid rgba(191, 0, 25, 0.2)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MenuBook sx={{ color: '#BF0019' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#BF0019', fontWeight: 'bold', fontSize: 14 }}>
                    Currently Reading
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    {activeSession[0].copy?.book?.title} (Acc.No #{activeSession[0].copy?.accessNumber})
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 500, color: '#666666' }}>
                    Since: {new Date(activeSession[0].startedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={handleEndSession}
                sx={{ 
                  backgroundColor: '#BF0019', 
                  '&:hover': { backgroundColor: '#A00015' },
                  fontSize: 12,
                  px: 2,
                  py: 0.5,
                }}
              >
                Finish
              </Button>
            </Box>
          </Paper>
        )}

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search by title, author, or ISBN"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f5f5f5',
                fontSize: 13,
              },
            }}
          />
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 4 }}
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            Error loading books: {error.message}
          </Alert>
        )}

        {/* Books Grid */}
        {!isLoading && !error && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000', fontSize: 14 }}>
                All Books
                {booksData?.data && booksData?.pagination && (
                  <Chip
                    label={`${booksData.pagination.total} books`}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
            </Box>

            {booksData?.data?.length > 0 ? (
              <Grid container spacing={{ xs: 0.5, sm: 1, md: 1.5, lg: 2 }}>
                {booksData.data.map((book) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    md={4} 
                    lg={4} 
                    key={book.id}
                  >
                    <BookCard
                      book={book}
                      onBorrowRequest={handleBorrowRequest}
                      onStartReading={handleStartReading}
                      onSessionStart={refetchActiveSession}
                      activeSession={activeSession}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No books found matching your criteria
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {booksData?.totalPages && booksData.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={booksData.totalPages}
                  page={booksData.page || page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;
