import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
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
  Tooltip,
} from '@mui/material';
import {
  Star,
  MenuBook,
  AddShoppingCart,
  AddToQueue,
  CheckCircle,
  CheckCircleOutline,
  LockOutlined,
  WarningOutlined,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';
import { getImageUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import BorrowRequestDialog from './BorrowRequestDialog';
import LoginDialog from '../auth/LoginDialog';

const BookCard = ({ book, onBorrowRequest, onStartReading, onSessionStart, activeSessions }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [readDialogOpen, setReadDialogOpen] = useState(false);
  const [restrictionSnackbar, setRestrictionSnackbar] = useState({ open: false, message: '' });
  const [borrowRequestDialogOpen, setBorrowRequestDialogOpen] = useState(false);
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, message: '' });
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [inLibraryNetworkAllowed, setInLibraryNetworkAllowed] = useState(true);
  const [networkMessage, setNetworkMessage] = useState('');

  const [membershipWarningOpen, setMembershipWarningOpen] = useState(false);

  const availableCopies = book.copies?.filter(copy => copy.status === 'AVAILABLE') || [];
  const isAvailable = availableCopies.length > 0;
  
  // Check if user has any active sessions
  // const hasActiveSessions = activeSessions && activeSessions.length > 0;
  const isCurrentBookInSession = activeSessions && 
    activeSessions.some(session => session.copy.book.id === book.id);

  // perform network check when read dialog opens
  useEffect(() => {
    if (!readDialogOpen) return;

    const checkNetwork = async () => {
      try {
        const result = await ApiService.checkInhouseNetwork();
        setInLibraryNetworkAllowed(result.allowed);
        setNetworkMessage(result.message);
      } catch (error) {
        console.error('Error checking network:', error);
        // Default to allowing on error (don't block if check fails)
        setInLibraryNetworkAllowed(true);
      }
    };
    checkNetwork();
  }, [readDialogOpen]);

  const handleReadClick = () => {
    if (!isAuthenticated) {
      setPendingAction('read');
      setLoginDialogOpen(true);
      return;
    }
    // always show the reading options dialog; network will be checked there
    setReadDialogOpen(true);
  };

  // const startReadingSession = async () => {
  //   try {
  //     // Find an available copy for this book
  //     const availableCopy = availableCopies[0];
      
  //     if (!availableCopy) {
  //       console.error('No available copies for this book');
  //       return;
  //     }

  //     // Start the in-house usage session
  //     await ApiService.startInhouseUsage(book.id, availableCopy.id);
      
  //     // Store session data globally for other components to check
  //     window.activeSessionData = {
  //       id: 'temp-' + Date.now(), // This would be the actual session ID from API
  //       copy: {
  //         book: { id: book.id, title: book.title },
  //         accessNumber: availableCopy.accessNumber,
  //       },
  //       startedAt: new Date().toISOString(),
  //     };
      
  //     // Update global sessions array (support multiple sessions)
  //     if (!window.activeSessions) {
  //       window.activeSessions = [];
  //     }
  //     window.activeSessions.push(window.activeSessionData);
      
  //     // Open the ebook reader or reading interface
  //     console.log('Started reading session for:', book.title);
  //     setReadDialogOpen(false);
      
  //     // You could navigate to a reading page here
  //     // navigate('/reading/' + book.id);
      
  //   } catch (error) {
  //     console.error('Error starting reading session:', error);
  //     // Show error message to user
  //   }
  // };

  const handleBorrowClick = async () => {
    if (!isAuthenticated) {
      setPendingAction('borrow');
      setLoginDialogOpen(true);
      return;
    }

    // Check library membership status before opening the dialog
    if (user?.id) {
      try {
        const profile = await ApiService.getProfileSummary(user.id);
        if (profile?.membershipStatus?.toLowerCase() === 'inactive') {
          setMembershipWarningOpen(true);
          return;
        }
      } catch (e) {
        // If check fails, let the backend reject it — don't block the user
      }
    }

    // Check if user has an active session with the same book
    const hasActiveSessionForSameBook = activeSessions &&
      activeSessions.some(session => session.copy.book.id === book.id);

    if (hasActiveSessionForSameBook) {
      setRestrictionSnackbar({
        open: true,
        message: `You already have an active reading session for "${book.title}". You can read multiple different books simultaneously.`,
      });
      return;
    }

    setBorrowRequestDialogOpen(true);
  };

  const handleBorrowRequestSubmit = async (requestData) => {
    try {
      const requestBody = {
        bookId: requestData.bookId.toString(),
      };
      
      if (requestData.reason && requestData.reason.trim()) {
        requestBody.reason = requestData.reason.trim();
      }
      
      const response = await ApiService.createBookRequest(requestBody);
      console.log('Borrow request response:', response);
      
      setSuccessSnackbar({
        open: true,
        message: 'Borrow request submitted successfully',
      });
    } catch (error) {
      // Re-throw so BorrowRequestDialog can display the error inline
      throw error;
    }
  };

  const handleLibraryRead = () => {
    // setReadDialogOpen(false);
    if (!inLibraryNetworkAllowed) {
      setRestrictionSnackbar({
        open: true,
        message: networkMessage,
      });
      return;
    }
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
          <Box
            component="img"
            onClick={() => navigate(`/books/${book.id}`)}
            sx={{
              width: 140,
              height: 200,
              objectFit: 'cover',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}
            src={getImageUrl(book.coverImageUrl)}
            alt={book.title}
            onError={(e) => {
              e.target.src = '/assets/default-book.jpg';
            }}
          />
          
          {/* Ebook Badge */}
          {book.ebookUrl && (
            <Chip
              icon={<MenuBook sx={{ fontSize: 10 }} />}
              label="EBOOK"
              size="small"
              iconcolor="inherit"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontSize: 8,
                fontWeight: 'bold',
                backgroundColor: '#1976d2',
                color: 'white',
                zIndex: 2,
                '& .MuiChip-icon': {
                  color: 'white',
                  fontSize: 14,
                },
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
              onClick={() => navigate(`/books/${book.id}`)}
              sx={{
                fontSize: 13,
                fontWeight: 'bold',
                mb: 0.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.2,
                cursor: 'pointer',
                '&:hover': { color: '#1976d2', textDecoration: 'underline' },
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

          {/* Description Preview */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: 10,
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {book.description?.substring(0, 120) || 'No description available'}...
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
              disabled={isCurrentBookInSession}
              sx={{
                flex: 1,
                backgroundColor: isCurrentBookInSession ? '#ccc' : '#BF0019',
                '&:hover': { 
                  backgroundColor: isCurrentBookInSession ? '#bbb' : '#A00015' 
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
              disabled={false}
              sx={{
                flex: 1,
                borderColor: isAvailable ? '#BF0019' : '#ccc',
                color: isAvailable ? '#BF0019' : '#666',
                '&:hover': {
                  borderColor: isAvailable ? '#A00015' : '#999',
                  backgroundColor: isAvailable ? 'rgba(191, 0, 25, 0.04)' : 'rgba(0, 0, 0, 0.04)',
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
          Choose Reading Option
        </DialogTitle>
        <DialogContent>
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

            <Tooltip title={!inLibraryNetworkAllowed ? networkMessage : ''} disableHoverListener={inLibraryNetworkAllowed}>
              {/* network check has been run above when dialog opened; disable if not allowed */}
            <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  cursor: isAvailable && inLibraryNetworkAllowed ? 'pointer' : 'not-allowed',
                  opacity: isAvailable && inLibraryNetworkAllowed ? 1 : 0.6,
                }}
                onClick={isAvailable && inLibraryNetworkAllowed ? handleLibraryRead : undefined}
              >
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook />
                  Read in Library
                </Typography>
                <Typography variant="body2" color={isAvailable ? 'success.main' : 'error.main'}>
                  {isAvailable ? 'Available' : 'Not available'}
                </Typography>
                {!inLibraryNetworkAllowed && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <WarningOutlined sx={{ fontSize: 14, color: 'warning.main' }} />
                    <Typography variant="caption" color="warning.main" sx={{ fontSize: 11, fontWeight: 'bold' }}>
                      {networkMessage}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadDialogOpen(false)}>
            {activeSessions && activeSessions.length > 0 ? 'Close' : 'Cancel'}
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

      {/* Login Dialog */}
      <LoginDialog 
        open={loginDialogOpen} 
        onClose={() => {
          setLoginDialogOpen(false);
          setPendingAction(null);
        }}
        onLoginSuccess={() => {
          setLoginDialogOpen(false);
          // Retry the original action based on pendingAction
          if (pendingAction === 'read') {
            setReadDialogOpen(true);
          } else if (pendingAction === 'borrow') {
            setBorrowRequestDialogOpen(true);
          }
          setPendingAction(null);
        }}
      />

      {/* Library Membership Warning Dialog */}
      <Dialog open={membershipWarningOpen} onClose={() => setMembershipWarningOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600, color: '#b45309' }}>
          ⚠️ Library Membership Not Active
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
            <strong>Your library membership is not yet active.</strong>
            <br />
            To borrow books, you need to pay the University Library Fee. Here's what to do:
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '18px' }}>
              <li>Visit the <strong>University Finance Office</strong> and pay the Library Membership Fee.</li>
              <li>Once paid, your membership will be <strong>automatically activated</strong> — no further action needed.</li>
              <li>Return here and try borrowing again!</li>
            </ol>
            <br />
            For help, contact the library at <strong>library@isbat.ac.ug</strong>.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembershipWarningOpen(false)} variant="contained" sx={{ fontSize: 13 }}>
            OK, Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookCard;
