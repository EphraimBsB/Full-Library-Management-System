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
} from '@mui/material';

const BorrowRequestDialog = ({ open, onClose, bookTitle, bookId, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Reason is optional, so we don't need to check if it's empty
    setLoading(true);
    try {
      await onSubmit({
        bookId: bookId,
        reason: reason.trim(), // Pass the raw reason, parent will handle null/empty
      });
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error submitting borrow request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
        Borrow Request
      </DialogTitle>
      <DialogContent>
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
