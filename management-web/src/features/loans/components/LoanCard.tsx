import React, { useState } from 'react';
import {
  Card,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person,
  CalendarToday,
  Refresh,
  AssignmentReturn,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { theme } from '../../../core/theme';
import type { Loan } from '../services/loan.service';
import { LoanStatus } from '../services/loan.service';

interface LoanCardProps {
  loan: Loan;
  onViewDetails?: () => void;
  onReturn?: () => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onViewDetails,
  onReturn,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.ACTIVE:
        return { bg: '#ECFDF3', color: '#027A48' };
      case LoanStatus.BORROWED:
        return { bg: '#EFF8FF', color: '#175CD3' };
      case LoanStatus.RETURNED:
        return { bg: '#FFFAEB', color: '#B54708' };
      case LoanStatus.OVERDUE:
        return { bg: '#FEF3F2', color: '#B42318' };
      case LoanStatus.LOST:
        return { bg: '#F2F4F7', color: '#344054' };
      case LoanStatus.DAMAGED:
        return { bg: '#F9F5FF', color: '#6941C6' };
      default:
        return { bg: '#F2F4F7', color: '#344054' };
    }
  };

  const handleReturnClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  setReturnDialogOpen(true);
};

const handleConfirmReturn = () => {
  setReturnDialogOpen(false);
  onReturn?.();
};

const handleCancelReturn = () => {
  setReturnDialogOpen(false);
};

const isOverdue = loan.status === LoanStatus.OVERDUE;
  // const canRenew =
  //   loan.status === LoanStatus.ACTIVE ||
  //   loan.status === LoanStatus.BORROWED;
  const canReturn =
    loan.status === LoanStatus.ACTIVE ||
    loan.status === LoanStatus.BORROWED;

  return (
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
          boxShadow:
            '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
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
        <Box sx={{ display: 'flex', gap: 1.5 }}>
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
              src={imageError ? '/admin/default_book.jpg' : (loan.bookCopy?.book?.coverImageUrl || '/admin/default_book.jpg')}
              alt={loan.bookCopy?.book?.title || 'Book cover'}
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

          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: '#101828',
                fontSize: '0.8rem',
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {loan.bookCopy?.book?.title || 'Unknown Book'}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#667085',
                fontSize: '10px',
                display: 'block',
                mt: 0.1,
              }}
            >
              Acc No# {loan.bookCopy?.accessNumber}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={loan.status}
          size="small"
          sx={{
            height: '18px',
            fontSize: '8px',
            fontWeight: 600,
            backgroundColor: getStatusColor(loan.status).bg,
            color: getStatusColor(loan.status).color,
            borderRadius: '10px',
          }}
        />
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
                {loan.user?.firstName} {loan.user?.lastName}
              </Typography>

              {(loan.user?.rollNumber || loan.user?.semester) && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '9px',
                    color: '#667085',
                    lineHeight: 1.2,
                    mt: 0.2,
                  }}
                >
                  {loan.user?.rollNumber && `Roll: ${loan.user.rollNumber}`}
                  {loan.user?.rollNumber && loan.user?.semester && ' • '}
                  {loan.user?.semester && `Semester: ${loan.user.semester}`}
                </Typography>
              )}
            </Box>
          </Box>


          <InfoRow
            icon={<CalendarToday fontSize="small" />}
            text={`Since: ${format(
              new Date(loan.borrowedAt),
              'MMM d, yyyy'
            )}`}
          />

          <InfoRow
            icon={<CalendarToday fontSize="small" />}
            text={`Due: ${format(
              new Date(loan.dueDate),
              'MMM d, yyyy'
            )}`}
            highlight={isOverdue}
          />
        </Box>

        {/* RIGHT COLUMN */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          <InfoRow
            icon={<CalendarToday fontSize="small" />}
            text={`Return: ${loan.returnedAt
              ? format(new Date(loan.returnedAt), 'MMM d, yyyy')
              : 'Not returned'
              }`}
          />

          {loan.renewalCount > 0 && (
            <InfoRow
              icon={<Refresh fontSize="small" />}
              text={`Renewed ${loan.renewalCount} time${loan.renewalCount > 1 ? 's' : ''
                }`}
            />
          )}

          {isOverdue && (
            <InfoRow
              icon={<CalendarToday fontSize="small" />}
              text={`Overdue since: ${format(
                new Date(loan.dueDate),
                'MMM d, yyyy'
              )}`}
              highlight
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

      {/* ACTIONS */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {/* {canRenew && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              onRenew?.();
            }}
            sx={{
              textTransform: 'none',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '8px',
              color: theme.colors.primary,
              borderColor: theme.colors.primary,
              '&:hover': {
                borderColor: theme.colors.primary,
                backgroundColor: '#F0F9FF',
              },
            }}
          >
            Renew
          </Button>
        )} */}

        {canReturn && (
          <Button
            size="small"
            variant="contained"
            startIcon={<AssignmentReturn fontSize="small" />}
            onClick={handleReturnClick}
            sx={{
              textTransform: 'none',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '8px',
              backgroundColor: '#027A48',
              '&:hover': {
                backgroundColor: '#05603A',
              },
            }}
          >
            Return
          </Button>
        )}

        {/* Return Confirmation Dialog */}
        <Dialog
          open={returnDialogOpen}
          onClose={handleCancelReturn}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Return</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to return "{loan.bookCopy?.book?.title}"?
            </Typography>
            <Typography variant="body2" sx={{ color: '#667085' }}>
              This will mark the book as returned and update the loan status.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelReturn} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleConfirmReturn} variant="contained" sx={{ backgroundColor: '#027A48' }}>
              Confirm Return
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

    </Card>
  );
};

const InfoRow: React.FC<{
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
  bold?: boolean;
}> = ({ icon, text, highlight, bold }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      color: highlight ? '#B42318' : '#475467',
    }}
  >
    <Box sx={{ color: '#98A2B3', display: 'flex' }}>{icon}</Box>
    <Typography
      variant="body2"
      sx={{
        fontSize: '9px',
        fontWeight: bold ? 600 : highlight ? 600 : 400,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </Typography>
  </Box>
);
