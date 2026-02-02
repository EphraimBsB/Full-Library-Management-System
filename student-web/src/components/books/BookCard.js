import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Star,
  MenuBook,
  AddShoppingCart,
  AddToQueue,
  CheckCircle,
  CheckCircleOutline,
  LockOutlined,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';
import { getImageUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import BorrowRequestDialog from './BorrowRequestDialog';

const BookCard = ({ book, onBorrowRequest, onStartReading, onSessionStart, activeSession }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [readDialogOpen, setReadDialogOpen] = useState(false);
  const [restrictionSnackbar, setRestrictionSnackbar] = useState({ open: false, message: '' });
  const [borrowRequestDialogOpen, setBorrowRequestDialogOpen] = useState(false);
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, message: '' });

  const availableCopies = book.copies?.filter(copy => copy.status === 'AVAILABLE') || [];
  const isAvailable = availableCopies.length > 0;
  
  // Check if user has an active session
  const hasActiveSession = !!activeSession;
  const isCurrentBookInSession = activeSession?.copy?.book?.id === book.id;

  const handleReadClick = () => {
    if (!isAuthenticated) {
      // Redirect to login or show login dialog
      return;
    }
    
    // Check if user has an active session with a different book
    if (hasActiveSession && !isCurrentBookInSession) {
      setRestrictionSnackbar({
        open: true,
        message: `You already have an active reading session for "${activeSession.copy.book.title}". Please finish that session first.`,
      });
      return;
    }
    
    // Always show the reading options dialog
    setReadDialogOpen(true);
  };

  const startReadingSession = async () => {
    try {
      // Find an available copy for this book
      const availableCopy = availableCopies[0];
      
      if (!availableCopy) {
        console.error('No available copies for this book');
        return;
      }

      // Start the in-house usage session
      await ApiService.startInhouseUsage(book.id, availableCopy.id);
      
      // Store session data globally for other components to check
      window.activeSessionData = {
        id: 'temp-' + Date.now(), // This would be the actual session ID from API
        copy: {
          book: { title: book.title },
          accessNumber: availableCopy.accessNumber,
        },
        startedAt: new Date().toISOString(),
      };

      // Open the ebook reader or reading interface
      console.log('Started reading session for:', book.title);
      setReadDialogOpen(false);
      
      // You could navigate to a reading page here
      // navigate('/reading/' + book.id);
      
    } catch (error) {
      console.error('Error starting reading session:', error);
      // Show error message to user
    }
  };

  const handleBorrowClick = () => {
    if (!isAuthenticated) {
      // Redirect to login or show login dialog
      return;
    }
    
    // Check if user has an active session with any book
    if (hasActiveSession) {
      setRestrictionSnackbar({
        open: true,
        message: `You already have an active reading session for "${activeSession.copy.book.title}". Please finish that session first before borrowing books.`,
      });
      return;
    }
    
    // Open borrow request dialog instead of direct borrow
    setBorrowRequestDialogOpen(true);
  };

  const handleBorrowRequestSubmit = async (requestData) => {
    try {
      // Format request body to match Flutter implementation
      const requestBody = {
        bookId: requestData.bookId.toString(), // Convert to string like Flutter
      };
      
      // Only include reason if it's not empty (like Flutter)
      if (requestData.reason && requestData.reason.trim()) {
        requestBody.reason = requestData.reason.trim();
      }
      
      console.log('Submitting borrow request:', requestBody);
      const response = await ApiService.createBookRequest(requestBody);
      console.log('Borrow request response:', response);
      
      setSuccessSnackbar({
        open: true,
        message: 'Borrow request submitted successfully',
      });
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      console.error('Error response:', error.response?.data);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to submit borrow request. Please try again.';
      
      setRestrictionSnackbar({
        open: true,
        message: errorMessage,
      });
    }
  };

  const handleLibraryRead = () => {
    setReadDialogOpen(false);
    if (isAvailable) {
      setCopyDialogOpen(true);
    }
  };

  const handleEbookRead = () => {
    setReadDialogOpen(false);
    if (book.ebookUrl) {
      navigate(`/ebook-reader/${book.id}`);
    }
  };

  const handleCopySelect = (copy) => {
    setSelectedCopy(copy);
  };

  const confirmCopySelection = async () => {
    if (selectedCopy) {
      try {
        // Start the in-house usage session
        await ApiService.startInhouseUsage(book.id, selectedCopy.id);
        
        // Store session data globally for other components to check
        window.activeSessionData = {
          id: 'temp-' + Date.now(), // This would be the actual session ID from API
          copy: {
            book: { title: book.title },
            accessNumber: selectedCopy.accessNumber,
          },
          startedAt: new Date().toISOString(),
        };

        console.log('Started reading session with copy:', selectedCopy);
        setCopyDialogOpen(false);
        
        // Trigger parent component to refresh active session data
        if (onSessionStart) {
          onSessionStart();
        }
        
        // You could navigate to a reading page here
        // navigate('/reading/' + book.id);
        
      } catch (error) {
        console.error('Error starting reading session:', error);
        // Show error message to user
      }
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'BORROWED': return 'Borrowed';
      case 'LOST': return 'Lost';
      case 'DAMAGED': return 'Damaged';
      case 'IN_REPAIR': return 'In Repair';
      default: return status;
    }
  };

  return (
    <>
      <Card
        sx={{
          display: 'flex',
          height: 200,
          mb: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
        }}
      >
        {/* Book Cover */}
        <Box sx={{ position: 'relative', width: 140, flexShrink: 0 }}>
          <CardMedia
            component="img"
            sx={{
              width: 140,
              height: 200,
              objectFit: 'cover',
            }}
            image={getImageUrl(book.coverImageUrl)}
            alt={book.title}
            onError={(e) => {
              e.target.src = '/assets/default-book.jpg';
            }}
          />
          
          {/* Ebook Badge */}
          {book.ebookUrl && (
            <Chip
              icon={<MenuBook sx={{ fontSize: 12 }} />}
              label="EBOOK"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontSize: 9,
                fontWeight: 'bold',
                backgroundColor: 'rgba(191, 0, 25, 0.1)',
                border: '1px solid rgba(191, 0, 25, 0.3)',
                color: '#BF0019',
              }}
            />
          )}
        </Box>

        {/* Book Details */}
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 1 }}>
          {/* Title and Author at Top */}
          <Box sx={{ mb: 0.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 13,
                fontWeight: 'bold',
                mb: 0.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.2,
              }}
            >
              {book.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 10 }}>
              by {book.author}
            </Typography>
          </Box>

          {/* Rating and Availability */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <Star sx={{ fontSize: 13, color: '#ffc107', mr: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 9 }}>
                {book.metadata?.averageRating || 0}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              ({book.metadata?.views || 0} views)
            </Typography>
            <Chip
              label={isAvailable ? 'Available' : 'Borrowed'}
              size="small"
              sx={{
                ml: 'auto',
                fontSize: 9,
                fontWeight: 500,
                backgroundColor: isAvailable ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                border: `1px solid ${isAvailable ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
                color: isAvailable ? '#2e7d32' : '#ef6c00',
                height: 18,
              }}
            />
          </Box>

          {/* Description - Expanded for better visibility */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 8,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: 10,
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {book.description?.substring(0, 150) || 'No description available'}...
            </Typography>
          </Box>

          {/* Action Buttons at Very Bottom */}
          {isCurrentBookInSession && (
            <Box sx={{ 
              backgroundColor: 'rgba(76, 175, 80, 0.1)', 
              p: 1, 
              borderRadius: 1, 
              mb: 1,
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              <Typography variant="caption" sx={{ fontSize: 10, color: '#2e7d32', textAlign: 'center', display: 'block' }}>
                📖 Currently Reading - Session Active
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button
              variant="contained"
              startIcon={<MenuBook />}
              onClick={handleReadClick}
              disabled={hasActiveSession && !isCurrentBookInSession}
              sx={{
                flex: 1,
                backgroundColor: hasActiveSession && !isCurrentBookInSession ? '#ccc' : '#BF0019',
                '&:hover': { 
                  backgroundColor: hasActiveSession && !isCurrentBookInSession ? '#bbb' : '#A00015' 
                },
                fontSize: 10,
                py: 0.5,
                minHeight: 28,
              }}
            >
              Read
            </Button>
            <Button
              variant="outlined"
              startIcon={isAvailable ? <AddShoppingCart /> : <AddToQueue />}
              onClick={handleBorrowClick}
              disabled={hasActiveSession}
              sx={{
                flex: 1,
                borderColor: hasActiveSession ? '#ccc' : (isAvailable ? '#BF0019' : '#ccc'),
                color: hasActiveSession ? '#999' : (isAvailable ? '#BF0019' : '#666'),
                '&:hover': {
                  borderColor: hasActiveSession ? '#bbb' : (isAvailable ? '#A00015' : '#999'),
                  backgroundColor: hasActiveSession ? 'rgba(0, 0, 0, 0.02)' : (isAvailable ? 'rgba(191, 0, 25, 0.04)' : 'rgba(0, 0, 0, 0.04)'),
                },
                fontSize: 10,
                py: 0.5,
                minHeight: 28,
              }}
            >
              {isAvailable ? 'Borrow' : 'Queue'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Reading Options Dialog */}
      <Dialog open={readDialogOpen} onClose={() => setReadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {window.activeSessionData ? 'Active Reading Session' : 'Choose Reading Option'}
        </DialogTitle>
        <DialogContent>
          {window.activeSessionData ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You already have an active reading session for:
              </Typography>
              <Typography variant="h6" sx={{ color: '#BF0019', mb: 2 }}>
                {window.activeSessionData.copy?.book?.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Please finish your current session before starting a new one.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  cursor: book.ebookUrl ? 'pointer' : 'not-allowed',
                  opacity: book.ebookUrl ? 1 : 0.6,
                }}
                onClick={book.ebookUrl ? handleEbookRead : undefined}
              >
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook />
                  Read Ebook
                </Typography>
                <Typography variant="body2" color={book.ebookUrl ? 'success.main' : 'error.main'}>
                  {book.ebookUrl ? 'Ebook available' : 'Ebook not available'}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  opacity: isAvailable ? 1 : 0.6,
                }}
                onClick={isAvailable ? handleLibraryRead : undefined}
              >
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook />
                  Read in Library
                </Typography>
                <Typography variant="body2" color={isAvailable ? 'success.main' : 'error.main'}>
                  {isAvailable ? 'Available' : 'Not available'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadDialogOpen(false)}>
            {window.activeSessionData ? 'Close' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Selection Dialog */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCopy ? 'Confirm Selection' : 'Select Acc.No'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Check on the side of the book to find the Acc.No you want to read.
            </Typography>
          </Box>

          {selectedCopy && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBook sx={{ color: '#2e7d32' }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Selected Acc.No: #{selectedCopy.accessNumber}
                </Typography>
              </Box>
            </Box>
          )}

          <Grid container spacing={2}>
            {book.copies?.map((copy) => {
              const isAvailable = copy.status === 'AVAILABLE';
              const isSelected = selectedCopy?.id === copy.id;
              
              return (
                <Grid item xs={6} sm={4} md={3} key={copy.id}>
                  <Box
                    sx={{
                      p: 2,
                      border: `2px solid ${isSelected ? '#1976d2' : isAvailable ? '#4caf50' : '#ccc'}`,
                      borderRadius: 1,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.1)' : 'white',
                      opacity: isAvailable ? 1 : 0.6,
                    }}
                    onClick={() => isAvailable && handleCopySelect(copy)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {isAvailable ? (
                        isSelected ? <CheckCircle color="primary" /> : <CheckCircleOutline color="success" />
                      ) : (
                        <LockOutlined color="disabled" />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                        Acc.No #{copy.accessNumber}
                      </Typography>
                    </Box>
                    <Chip
                      label={formatStatus(copy.status)}
                      size="small"
                      sx={{
                        fontSize: 10,
                        backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.1)' : 
                                        isAvailable ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                        color: isSelected ? '#1976d2' : isAvailable ? '#2e7d32' : '#666',
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
          {selectedCopy && (
            <Button variant="contained" onClick={confirmCopySelection}>
              Confirm Selection
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Borrow Request Dialog */}
      <BorrowRequestDialog
        open={borrowRequestDialogOpen}
        onClose={() => setBorrowRequestDialogOpen(false)}
        bookTitle={book.title}
        bookId={book.id}
        onSubmit={handleBorrowRequestSubmit}
      />

      {/* Restriction Snackbar */}
      <Snackbar
        open={restrictionSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setRestrictionSnackbar({ ...restrictionSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setRestrictionSnackbar({ ...restrictionSnackbar, open: false })} 
          severity="warning" 
          sx={{ fontSize: 12 }}
        >
          {restrictionSnackbar.message}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setSuccessSnackbar({ ...successSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessSnackbar({ ...successSnackbar, open: false })} 
          severity="success" 
          sx={{ fontSize: 12 }}
        >
          {successSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BookCard;
