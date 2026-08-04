import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Star,
  Book as BookIcon,
  History,
  People,
  HourglassEmpty,
  MenuBook,
  AddShoppingCart,
  AddToQueue,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { ApiService } from '../services/api';
import { getImageUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BorrowRequestDialog from '../components/books/BorrowRequestDialog';
import LoginDialog from '../components/auth/LoginDialog';
import Header from '../components/layout/Header';
import BookCard from '../components/books/BookCard';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BookDetailsPage = () => {
  const { id: bookId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [borrowRequestDialogOpen, setBorrowRequestDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const { data: details, isLoading, error, refetch } = useQuery({
    queryKey: ['book-details', bookId],
    queryFn: () => ApiService.getBookDetails(bookId),
    enabled: !!bookId,
  });

  const { data: relatedBooks = [] } = useQuery({
    queryKey: ['related-books', details?.book?.categories?.map(c => c.name)],
    queryFn: async () => {
      if (!details?.book?.categories?.length) return [];
      const categoryName = details.book.categories[0].name;
      // Fetch first two pages to get up to 12 books for variety
      const [page1, page2] = await Promise.all([
        ApiService.getBooks({ category: categoryName, limit: 6, page: 1 }),
        ApiService.getBooks({ category: categoryName, limit: 6, page: 2 }),
      ]);
      const combined = [...(page1.data || []), ...(page2.data || [])];
      // Shuffle and take up to 6
      const shuffled = combined.sort(() => Math.random() - 0.5).slice(0, 6);
      return shuffled;
    },
    enabled: !!details?.book?.categories?.length,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !details) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load book details</Alert>
        <Button onClick={() => refetch()} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const { book, current_borrows, borrow_history, queue_requests } = details;
  const availableCopies = book.copies?.filter(copy => copy.status === 'AVAILABLE') || [];
  const isAvailable = availableCopies.length > 0;

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleBorrowClick = () => {
    if (!isAuthenticated) {
      setPendingAction('borrow');
      setLoginDialogOpen(true);
      return;
    }
    setBorrowRequestDialogOpen(true);
  };

  const handleReadClick = () => {
    if (!isAuthenticated) {
      setPendingAction('read');
      setLoginDialogOpen(true);
      return;
    }
    if (book.ebookUrl) {
      navigate(`/ebook-reader/${book.id}`);
    }
  };

  const handleInLibraryReadClick = async (copy) => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'in-library-read', copy });
      setLoginDialogOpen(true);
      return;
    }

    try {
      const result = await ApiService.checkInhouseNetwork();
      if (!result.allowed) {
        alert(result.message);
        return;
      }
      await startInLibrarySession(copy);
    } catch (error) {
      console.error('Network check failed:', error);
      alert('Failed to verify library network. Please try again.');
    }
  };

  const startInLibrarySession = async (copy) => {
    try {
      await ApiService.startInhouseUsage(book.id, copy.id);
      alert(`Started in-library reading session with Acc.No #${copy.accessNumber}`);
      // Optionally refresh or navigate to a reading interface
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start reading session. Please try again.');
    }
  };

  const handleBorrowRequestSubmit = async (requestData) => {
    try {
      const requestBody = {
        bookId: requestData.bookId.toString(),
      };
      if (requestData.reason && requestData.reason.trim()) {
        requestBody.reason = requestData.reason.trim();
      }
      await ApiService.createBookRequest(requestBody);
      refetch();
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      throw error;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <Box sx={{ p: 3, marginTop: '54px' }}>
        <Grid container spacing={3}>
          {/* Left Sidebar - Book Info */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, backgroundColor: 'white' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Cover Image */}
                <Box sx={{ 
                  width: '100%', 
                  aspectRatio: '2/3', 
                  backgroundColor: '#F2F4F7', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
                }}>
                  <img 
                    src={getImageUrl(book.coverImageUrl)} 
                    alt={book.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => {
                      e.target.src = '/assets/default-book.jpg';
                    }}
                  />
                </Box>

                {/* Title & Author */}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#101828', mb: 1 }}>
                    {book.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1570EF', fontWeight: 500 }}>
                    by {book.author}
                  </Typography>
                </Box>

                {/* Rating & Stats */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star sx={{ color: '#FDB022', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054' }}>
                      {book.metadata?.averageRating?.toFixed(1) || '0.0'}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Typography variant="body2" sx={{ color: '#667085' }}>
                    {book.metadata?.views || 0} views
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Typography variant="body2" sx={{ color: '#667085' }}>
                    {book.borrowCount || 0} borrows
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleBorrowClick}
                    startIcon={isAvailable ? <AddShoppingCart /> : <AddToQueue />}
                    sx={{ 
                      backgroundColor: isAvailable ? '#BF0019' : '#667085', 
                      textTransform: 'none', 
                      borderRadius: '8px',
                      fontWeight: 600,
                      py: 1,
                      '&:hover': { backgroundColor: isAvailable ? '#A00015' : '#4A5568' }
                    }}
                  >
                    {isAvailable ? 'Borrow Book' : 'Join Queue'}
                  </Button>
                  {book.ebookUrl && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<BookIcon />}
                      onClick={handleReadClick}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: '8px',
                        fontWeight: 600,
                        py: 1
                      }}
                    >
                      Read E-Book
                    </Button>
                  )}
                </Box>

                <Divider />

                {/* Metadata List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'ISBN', value: book.isbn },
                    { label: 'Publisher', value: book.publisher || 'N/A' },
                    { label: 'Published', value: book.publicationYear },
                    { label: 'Edition', value: book.edition || 'N/A' },
                    { label: 'Type', value: book.type?.name || 'N/A' },
                    { label: 'Location', value: book.location || 'N/A' },
                    { label: 'Shelf', value: book.shelf || 'N/A' },
                  ].map((item, idx) => (
                    <Box key={idx}>
                      <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500, display: 'block' }}>
                        {item.label.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#344054', fontWeight: 600 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}

                  {book.categories && book.categories.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500, display: 'block', mb: 0.5 }}>
                        CATEGORIES
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {book.categories.map(cat => (
                          <Chip
                            key={cat.id}
                            label={cat.name}
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/books?category=${encodeURIComponent(cat.name)}`)}
                            sx={{ borderRadius: '4px', height: '20px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {book.subjects && book.subjects.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500, display: 'block', mb: 0.5 }}>
                        SUBJECTS
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {book.subjects.map(sub => (
                          <Chip
                            key={sub.id}
                            label={sub.name}
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/books?subject=${encodeURIComponent(sub.name)}`)}
                            sx={{ borderRadius: '4px', height: '20px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right Main Area - Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, backgroundColor: 'white', minHeight: '600px' }}>
              {/* Description */}
              {book.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#101828', mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475467', lineHeight: 1.6 }}>
                    {book.description}
                  </Typography>
                </Box>
              )}

              {/* Tabs */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ borderBottom: '1px solid #EAECF0' }}>
                  <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Book Copies" icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                    <Tab label="Active Borrows" icon={<HourglassEmpty sx={{ fontSize: 18 }} />} iconPosition="start" />
                    <Tab label="History" icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" />
                    <Tab label="Queue" icon={<People sx={{ fontSize: 18 }} />} iconPosition="start" />
                  </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                  <Grid container spacing={2}>
                    {book.copies?.map(copy => {
                      const isAvailable = copy.status === 'AVAILABLE';
                      return (
                        <Grid item xs={12} sm={6} md={4} key={copy.id}>
                          <Paper variant="outlined" sx={{ 
                            p: 2, 
                            borderRadius: '8px', 
                            borderColor: isAvailable ? '#D1FADF' : '#EAECF0',
                            backgroundColor: isAvailable ? '#F6FEF9' : 'white',
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Acc No# {copy.accessNumber}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={copy.status} 
                                color={isAvailable ? 'success' : 'default'}
                                variant={isAvailable ? 'filled' : 'outlined'}
                                sx={{ height: '20px', fontSize: '10px', fontWeight: 700 }}
                              />
                            </Box>
                            {copy.notes && (
                              <Typography variant="caption" sx={{ color: '#667085' }}>
                                {copy.notes}
                              </Typography>
                            )}
                            {isAvailable && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<MenuBook />}
                                onClick={() => handleInLibraryReadClick(copy)}
                                sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600 }}
                              >
                                Read in Library
                              </Button>
                            )}
                          </Paper>
                        </Grid>
                      );
                    })}
                    {(!book.copies || book.copies.length === 0) && (
                      <Box sx={{ p: 4, textAlign: 'center', width: '100%', color: '#667085' }}>
                        No copies registered for this book.
                      </Box>
                    )}
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  {current_borrows.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Copy</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrower</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrowed At</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {current_borrows.map((borrow, idx) => (
                            <TableRow key={idx}>
                              <TableCell>#{borrow.copy_access_number}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '10px' }}>{borrow.borrower.name[0]}</Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{borrow.borrower.name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#667085' }}>{borrow.borrower.roll_number}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>{format(new Date(borrow.borrowed_at), 'dd MMM yyyy')}</TableCell>
                              <TableCell>{format(new Date(borrow.due_date), 'dd MMM yyyy')}</TableCell>
                              <TableCell>
                                {borrow.is_overdue ? (
                                  <Chip label="Overdue" size="small" color="error" sx={{ height: '20px', fontSize: '10px' }} />
                                ) : (
                                  <Chip label="Active" size="small" color="primary" sx={{ height: '20px', fontSize: '10px' }} />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#667085' }}>
                      <HourglassEmpty sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                      <Typography>No active borrows for this book.</Typography>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  {borrow_history.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrower</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrowed At</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Returned At</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Copy</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {borrow_history.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.borrower.name}</Typography>
                                <Typography variant="caption" sx={{ color: '#667085' }}>{item.borrower.roll_number}</Typography>
                              </TableCell>
                              <TableCell>{format(new Date(item.borrowed_at), 'dd MMM yyyy')}</TableCell>
                              <TableCell>{format(new Date(item.returned_at), 'dd MMM yyyy')}</TableCell>
                              <TableCell>#{item.copy_access_number}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#667085' }}>
                      <History sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                      <Typography>No borrowing history found.</Typography>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  {queue_requests.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {queue_requests.map((request, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '8px' }}>
                          <Avatar sx={{ backgroundColor: '#BF0019' }}>{request.position}</Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{request.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#667085' }}>{request.roll_number}</Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#667085' }}>
                            Requested: {format(new Date(request.requested_at), 'dd MMM yyyy')}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#667085' }}>
                      <People sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                      <Typography>The request queue is currently empty.</Typography>
                    </Box>
                  )}
                </TabPanel>
              </Box>
            </Paper>
            {/* You May Also Like */}
              {relatedBooks.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#101828', mb: 2 }}>
                    You May Also Like
                  </Typography>
                  <Grid container spacing={2}>
                    {relatedBooks.map((b) => (
                      <Grid item xs={12} sm={8} md={6} lg={6} key={b.id}>
                        <BookCard book={b} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
          </Grid>
        </Grid>
      </Box>

      {/* Borrow Request Dialog */}
      <BorrowRequestDialog
        open={borrowRequestDialogOpen}
        onClose={() => setBorrowRequestDialogOpen(false)}
        bookTitle={book.title}
        bookId={book.id}
        onSubmit={handleBorrowRequestSubmit}
      />

      {/* Login Dialog */}
      <LoginDialog 
        open={loginDialogOpen} 
        onClose={() => {
          setLoginDialogOpen(false);
          setPendingAction(null);
        }}
        onLoginSuccess={() => {
          setLoginDialogOpen(false);
          if (pendingAction === 'read') {
            handleReadClick();
          } else if (pendingAction?.type === 'in-library-read' && pendingAction.copy) {
            handleInLibraryReadClick(pendingAction.copy);
          } else if (pendingAction === 'borrow') {
            handleBorrowClick();
          }
          setPendingAction(null);
        }}
      />
    </Box>
  );
};

export default BookDetailsPage;
