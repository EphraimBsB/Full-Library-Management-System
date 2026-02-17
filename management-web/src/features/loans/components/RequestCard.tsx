import React from 'react';
import {
  Card,
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Book,
  Person,
  CalendarToday,
  Check,
  Close,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { theme } from '../../../core/theme';
import type { BookRequest } from '../services/loan.service';
import { BookRequestStatus } from '../services/loan.service';

interface RequestCardProps {
  request: BookRequest;
  onApprove?: (requestId: string, preferredCopyId?: string, notes?: string) => void;
  onReject?: (requestId: string, reason: string) => void;
  onViewDetails?: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ 
  request, 
  onApprove, 
  onReject,
  onViewDetails 
}) => {
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [imageError, setImageError] = React.useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [selectedBookCopy, setSelectedBookCopy] = React.useState<any>(null);
  const [renewalConfirmDialogOpen, setRenewalConfirmDialogOpen] = React.useState(false);

  const getStatusColor = (status?: BookRequestStatus) => {
    switch (status) {
      case BookRequestStatus.PENDING:
      case BookRequestStatus.RENEWAL_PENDING:
        return { bg: '#FFFAEB', color: '#B54708' };
      case BookRequestStatus.APPROVED:
      case BookRequestStatus.RENEWAL_APPROVED:
        return { bg: '#ECFDF3', color: '#027A48' };
      case BookRequestStatus.REJECTED:
      case BookRequestStatus.RENEWAL_REJECTED:
        return { bg: '#FEF3F2', color: '#B42318' };
      case BookRequestStatus.FULFILLED:
        return { bg: '#EFF8FF', color: '#175CD3' };
      case BookRequestStatus.CANCELLED:
        return { bg: '#F2F4F7', color: '#344054' };
      default:
        return { bg: '#F2F4F7', color: '#344054' };
    }
  };

  const isPending = request.status === BookRequestStatus.PENDING || request.status === BookRequestStatus.RENEWAL_PENDING;
  const isRenewal = request.requestType === 'RENEWAL';

  const handleApprove = () => {
    if (isRenewal) {
      // For renewal requests, show confirmation dialog
      setRenewalConfirmDialogOpen(true);
    } else {
      // For borrow requests, show book copy selection dialog
      // Check for book copies (backend sends 'copies', frontend expects 'bookCopies')
      const availableCopies = request.book?.copies || request.book?.bookCopies || [];
      
      if (availableCopies.length > 1) {
        // Multiple copies available - show selection dialog
        setSelectedBookCopy(availableCopies[0]); // Select first copy by default
        setApproveDialogOpen(true);
      } else if (availableCopies.length === 1) {
        // Single copy available - show selection dialog
        setSelectedBookCopy(availableCopies[0]);
        setApproveDialogOpen(true);
      } else {
        // No copies - show selection dialog
        setSelectedBookCopy(null);
        setApproveDialogOpen(true);
      }
    }
  };

const handleConfirmApprove = () => {
  setApproveDialogOpen(false);
  if (selectedBookCopy) {
    onApprove?.(request.id!, selectedBookCopy.id.toString()); // Convert to string
    setSelectedBookCopy(null);
  }
};

const handleCancelApprove = () => {
  setApproveDialogOpen(false);
  setSelectedBookCopy(null);
};

const handleConfirmRenewalApprove = () => {
  setRenewalConfirmDialogOpen(false);
  onApprove?.(request.id!, undefined, '');
};

const handleCancelRenewalApprove = () => {
  setRenewalConfirmDialogOpen(false);
};

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject?.(request.id!, rejectReason);
      setRejectDialogOpen(false);
      setRejectReason('');
    }
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '12px',
          border: '1px solid #EAECF0',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: theme.colors.primary,
            boxShadow: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
          },
        }}
        onClick={onViewDetails}
      >
        {/* HEADER */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 45,
                height: 60,
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #E5E7EB',
              }}
            >
              <img
                src={imageError ? '/admin/default_book.jpg' : (request.book?.coverImageUrl || '/admin/default_book.jpg')}
                alt={request.book?.title || 'Book cover'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={() => {
                  if (!imageError) {
                    setImageError(true);
                  }
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#101828', fontSize: '0.8rem', mb: 0.0 }}>
                {request.book?.title || 'Unknown Book'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#667085', fontSize: '11px' }}>
                {request.book?.author || 'Unknown Author'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#667085', fontSize: '11px', display: 'block', mt: 0.5 }}>
                {isRenewal ? 'Renewal Request' : 'Borrow Request'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip
              label={request.status}
              size="small"
              sx={{
                height: '18px',
                fontSize: '8px',
                fontWeight: 600,
                backgroundColor: getStatusColor(request.status).bg,
                color: getStatusColor(request.status).color,
                borderRadius: '10px',
              }}
            />
          </Box>
        </Box>

        {/* TWO COLUMN SECTION */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {/* LEFT COLUMN */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            {/* USER INFO */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              {/* Icon */}
              <Box sx={{ color: '#98A2B3', mt: 0.2 }}>
                <Person fontSize="small" />
              </Box>

              {/* Text Content */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#101828',
                    lineHeight: 1.3,
                  }}
                >
                  {request.user?.firstName} {request.user?.lastName}
                </Typography>

                {(request.user?.rollNumber || request.user?.semester) && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '9px',
                      color: '#667085',
                      lineHeight: 1.2,
                      mt: 0.2,
                    }}
                  >
                    {request.user?.rollNumber && `Roll: ${request.user.rollNumber}`}
                    {request.user?.rollNumber && request.user?.semester && ' • '}
                    {request.user?.semester && `Semester: ${request.user.semester}`}
                  </Typography>
                )}
              </Box>
            </Box>

            <InfoRow
              icon={<CalendarToday fontSize="small" />}
              text={`Requested: ${format(
                new Date(request.createdAt!),
                'MMM d, yyyy'
              )}`}
            />

            <InfoRow
              icon={<Book fontSize="small" />}
              text={`Reason: ${request.reason || 'No reason provided'}`}
            />
          </Box>

          {/* RIGHT COLUMN */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <InfoRow
              icon={<CalendarToday fontSize="small" />}
              text={`Request Type: ${isRenewal ? 'Renewal' : 'Borrow'}`}
            />

            <InfoRow
              icon={<CalendarToday fontSize="small" />}
              text={`Status: ${request.status}`}
              // highlight={request.status === BookRequestStatus.REJECTED}
            />

            {/* {request.queuePosition && (
              <InfoRow
                icon={<CalendarToday fontSize="small" />}
                text={`Queue Position: #${request.queuePosition}`}
              />
            )} */}
          </Box>
        </Box>

        {/* ACTIONS */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 2,
          }}
        >

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {isPending && (
              <Button
                size="small"
                variant="contained"
                startIcon={<Check fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove();
                }}
                sx={{
                  backgroundColor: '#027A48',
                  color: 'white',
                  fontSize: '10px',
                  minWidth: 'auto',
                  px: 1,
                }}
              >
                Approve
              </Button>
            )}

            <Button
              size="small"
              variant="outlined"
              startIcon={<Close fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                setRejectDialogOpen(true);
              }}
              sx={{
                borderColor: '#B42318',
                color: '#B42318',
                fontSize: '10px',
                minWidth: 'auto',
                px: 1,
              }}
            >
              Reject
            </Button>
          </Box>
        </Box>

        {/* Book Copy Selection Dialog */}
        <Dialog
          open={approveDialogOpen}
          onClose={handleCancelApprove}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select Book Copy</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Select which book copy to issue for "{request.book?.title}":
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: 1.5, 
              maxHeight: 300, 
              overflowY: 'auto' 
            }}>
              {(request.book?.copies || request.book?.bookCopies || []).map((copy: any) => (
                <Box
                  key={copy.id}
                  sx={{
                    p: 1.5,
                    border: '2px solid',
                    borderColor: selectedBookCopy?.id === copy.id ? '#027A48' : '#E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedBookCopy?.id === copy.id ? '#F0F9FF' : 'white',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#027A48',
                      backgroundColor: '#F0F9FF',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    },
                  }}
                  onClick={() => setSelectedBookCopy(copy)}
                >
                  {/* Selection Checkmark */}
                  {selectedBookCopy?.id === copy.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: '#027A48',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 14, color: 'white' }} />
                    </Box>
                  )}

                  {/* Copy Number */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '10px', 
                      fontWeight: 600, 
                      color: '#101828',
                      mb: 0.5,
                      textAlign: 'center'
                    }}
                  >
                    Acc No#: {copy.accessNumber}
                  </Typography>

                  {/* Status */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '8px',
                      fontWeight: 500,
                      textAlign: 'center',
                      display: 'block',
                      px: 0.5,
                      py: 0.2,
                      borderRadius: '4px',
                      backgroundColor: copy.status === 'AVAILABLE' ? '#ECFDF3' : '#FEF3F2',
                      color: copy.status === 'AVAILABLE' ? '#027A48' : '#B42318',
                    }}
                  >
                    {copy.status}
                  </Typography>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelApprove} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmApprove} 
              variant="contained" 
              sx={{ backgroundColor: '#027A48' }}
              disabled={!selectedBookCopy}
            >
              Issue Selected Copy
            </Button>
          </DialogActions>
        </Dialog>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={!rejectReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renewal Confirmation Dialog */}
      <Dialog open={renewalConfirmDialogOpen} onClose={handleCancelRenewalApprove} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Renewal Approval</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to approve this renewal request for "{request.book?.title}"?
          </Typography>
          <Typography variant="body2" sx={{ color: '#667085' }}>
            This will extend the loan's due date according to the library's renewal policy.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRenewalApprove} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRenewalApprove} 
            variant="contained" 
            sx={{ backgroundColor: '#027A48', color: 'white' }}
          >
            Approve Renewal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const InfoRow: React.FC<{ 
  icon: React.ReactNode; 
  text: string; 
}> = ({ icon, text }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475467' }}>
    <Box sx={{ color: '#98A2B3', display: 'flex' }}>{icon}</Box>
    <Typography
      variant="body2"
      sx={{
        fontSize: '11px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </Typography>
  </Box>
);
