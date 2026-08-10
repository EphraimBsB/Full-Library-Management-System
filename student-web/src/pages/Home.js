import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import HeroSection from '../components/home/HeroSection';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [visibleSubjectCount, setVisibleSubjectCount] = useState(8);

  // Responsive subject count
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setVisibleSubjectCount(4); // Mobile: show 4 subjects
      } else if (width < 960) {
        setVisibleSubjectCount(6); // Tablet: show 6 subjects
      } else {
        setVisibleSubjectCount(8); // Desktop: show 8 subjects
      }
    };

    handleResize(); // Set initial count
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounce search term and update URL for analytics tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm) {
        setSearchParams({ q: searchTerm }, { replace: true });
      } else {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('q');
        setSearchParams(newParams, { replace: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParams, setSearchParams]);

  // Fetch subjects
  const {
    data: subjectsData,
    isLoading: subjectsLoading,
  } = useQuery(
    'subjects',
    () => ApiService.getSubjects({ limit: 100 }), // Get all subjects
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      select: (data) => {
        // Handle both array and paginated response formats
        return {
          data: Array.isArray(data) ? data : data?.data || [],
        };
      },
    }
  );

  // Fetch books with React Query
  const {
    data: booksData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['books', page, debouncedSearch, selectedSubjects],
    () => {
      const params = {
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        subjects: selectedSubjects.length > 0 ?
          selectedSubjects.map(subjectId => {
            // Find subject name from subjects data
            const subject = subjectsData?.data?.find(s => s.id === subjectId);
            return subject?.name;
          }).filter(Boolean) : undefined,
      };
      return ApiService.getBooks(params);
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch active reading sessions
  const { data: activeSessions, refetch: refetchActiveSessions } = useQuery(
    'activeSessions',
    ApiService.getActiveSession,
    {
      enabled: isAuthenticated,
      refetchInterval: 30000, // Refetch every 30 seconds
      select: (data) => data.items || [], // Ensure we return an array
    }
  );

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page on search
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects(prev => {
      const id = Number(subjectId);
      if (prev.includes(id)) {
        return prev.filter(existingId => existingId !== id);
      } else {
        return [...prev, id];
      }
    });
    setPage(1);
  };

  const handleClearSubjects = () => {
    setSelectedSubjects([]);
    setPage(1); // Reset to first page on filter clear
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

  const handleEndIndividualSession = async (sessionId) => {
    try {
      await ApiService.endInhouseUsage(sessionId);
      refetchActiveSessions();
    } catch (error) {
      console.error('Error ending individual session:', error);
    }
  };


  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingTop: '64px' }}>
      <Header />

      {/* Hero Section using Books Data */}
      {!isLoading && !error && booksData?.data?.length > 0 && (
        <HeroSection books={booksData.data} />
      )}

      {/* Search Bar Stacked on Hero Section */}
      <Box
        sx={{
          position: 'relative',
          mt: -7.5,
          zIndex: 10,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              // backdropFilter: 'blur(10px)',
              my: 2,
            }}
          >
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
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4, pt: 0 }}>
        {/* Active Session Banner */}
        {isAuthenticated && activeSessions && activeSessions.length > 0 && (
          <ActiveSessionBanner
            sessions={activeSessions}
            onSessionEnd={refetchActiveSessions}
          />
        )}

        {/* Active Session Cards */}
        {isAuthenticated && activeSessions && activeSessions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ color: '#BF0019', fontWeight: 'bold', fontSize: 16, mb: 2 }}>
              Currently Reading ({activeSessions.length} sessions)
            </Typography>
            {activeSessions.map((session, index) => (
              <Paper
                key={session.id}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: 'rgba(191, 0, 25, 0.05)',
                  border: '1px solid rgba(191, 0, 25, 0.15)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MenuBook sx={{ color: '#BF0019', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontSize: 14, fontWeight: 500 }}>
                      {session.copy?.book?.title}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: 12, color: '#666666' }}>
                      Acc.No #{session.copy?.accessNumber}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: 11, color: '#666666' }}>
                      Since: {new Date(session.startedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEndIndividualSession(session.id)}
                  sx={{
                    borderColor: '#BF0019',
                    color: '#BF0019',
                    '&:hover': {
                      borderColor: '#A00015',
                      backgroundColor: 'rgba(191, 0, 25, 0.04)'
                    },
                    fontSize: 10,
                    px: 2,
                    py: 0.5,
                    minWidth: 'auto',
                  }}
                >
                  Finish
                </Button>
              </Paper>
            ))}
          </Box>
        )}

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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                {/* Subject Filter Chips */}
                {!subjectsLoading && subjectsData?.data && (
                  <>
                    <Typography variant="body2" sx={{ fontSize: 11, color: '#666', mr: 1 }}>
                      Filter by subject:
                    </Typography>
                    {subjectsData.data
                      .slice(0, showAllSubjects ? subjectsData.data.length : visibleSubjectCount)
                      .map((subject) => (
                        <Chip
                          key={subject.id}
                          label={subject.name}
                          size="small"
                          clickable
                          onClick={() => handleSubjectToggle(subject.id)}
                          color={selectedSubjects.includes(subject.id) ? 'primary' : 'default'}
                          variant={selectedSubjects.includes(subject.id) ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: 10,
                            height: 22,
                            '& .MuiChip-label': {
                              px: 1,
                            },
                          }}
                        />
                      ))}
                    {selectedSubjects.length > 0 && (
                      <Chip
                        label="Clear all"
                        size="small"
                        clickable
                        onClick={handleClearSubjects}
                        color="secondary"
                        variant="outlined"
                        sx={{
                          fontSize: 10,
                          height: 22,
                          '& .MuiChip-label': {
                            px: 1,
                          },
                        }}
                      />
                    )}
                    {subjectsData.data.length > visibleSubjectCount && (
                      <Chip
                        label={showAllSubjects ? "View less" : "View more"}
                        size="small"
                        clickable
                        onClick={() => setShowAllSubjects(!showAllSubjects)}
                        color="default"
                        variant="text"
                        sx={{
                          fontSize: 10,
                          height: 22,
                          '& .MuiChip-label': {
                            px: 1,
                            color: '#1976d2',
                            fontWeight: 'medium',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                          },
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
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
                      onSessionStart={refetchActiveSessions}
                      activeSessions={activeSessions}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ color: '#bbbbbb' }}>
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

      {/* Footer Watermark */}
      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0',
          mt: 'auto',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: 10,
            color: '#999999',
            fontFamily: 'monospace',
            letterSpacing: 0.5,
            fontStyle: 'italic',
            mb: 1
          }}
        >
          © 2026- ISBAT University. All Rights Reserved.
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: 10,
            color: '#999999',
            fontFamily: 'monospace',
            letterSpacing: 0.5,
            fontStyle: 'italic'
          }}
        >
          developed by Abstract, Ephraim BASUBI LUNYUNGU
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
