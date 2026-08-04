import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';

const BorrowRequestDialog = ({ open, onClose, bookTitle, bookId, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        bookId: bookId,
        reason: reason.trim(),
      });
      setReason('');
      setError('');
      onClose();
    } catch (err) {
      const rawMessage =
        err?.response?.data?.message ||
        err?.message ||
        '';

      // Detect the library fee error and show a student-friendly message
      if (rawMessage.toLowerCase().includes('library fee')) {
        setError('LIBRARY_FEE_UNPAID');
      } else {
        setError(rawMessage || 'Failed to submit borrow request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
        Borrow Request
      </DialogTitle>
      <DialogContent>
        {error === 'LIBRARY_FEE_UNPAID' ? (
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
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
            {error}
          </Alert>
        ) : null}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            You are requesting to borrow:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 'bold', mb: 2 }}>
            {bookTitle}
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Reason for borrowing (Optional)"
          placeholder="E.g., For research on..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
          sx={{
            '& .MuiInputLabel-root': { fontSize: 13 },
            '& .MuiInputBase-input': { fontSize: 13 },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ fontSize: 13 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          sx={{ fontSize: 13 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Submitting...
            </Box>
          ) : (
            'Submit Request'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BorrowRequestDialog;
