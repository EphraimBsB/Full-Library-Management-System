import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

const ActiveSessionBanner = ({ session, onSessionEnd }) => {
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleFinishClick = () => {
    setFinishDialogOpen(true);
  };

  const handleFinishConfirm = async () => {
    setFinishDialogOpen(false);
    setLoading(true);

    try {
      await ApiService.endInhouseUsage(session.id);
      
      // Clear global session data
      window.activeSessionData = null;
      
      setSnackbar({
        open: true,
        message: 'Session ended successfully!',
        severity: 'success',
      });
      onSessionEnd(); // Refresh the session data
    } catch (error) {
      console.error('Error ending session:', error);
      setSnackbar({
        open: true,
        message: 'Failed to end session. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinishCancel = () => {
    setFinishDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!session) return null;

  return (
    <>
      <Box
        sx={{
          p: 2,
          backgroundColor: 'rgba(191, 0, 25, 0.1)',
          borderRadius: 2,
          border: '1px solid rgba(191, 0, 25, 0.2)',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MenuBookIcon sx={{ color: '#BF0019', fontSize: 20 }} />
          
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: 12,
                color: '#BF0019',
                mb: 0.25,
              }}
            >
              Currently Reading
            </Typography>
            
            <Typography
              sx={{
                fontSize: 11,
                mb: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.copy?.book?.title} (Acc.No #{session.copy?.accessNumber})
            </Typography>
            
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 500,
                color: '#666',
              }}
            >
              Since: {formatTime(session.startedAt)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleFinishClick}
            disabled={loading}
            sx={{
              backgroundColor: '#BF0019',
              '&:hover': { backgroundColor: '#A00015' },
              fontSize: 10,
              py: 0.5,
              px: 2,
              minWidth: 'auto',
            }}
          >
            {loading ? 'Ending...' : 'Finish'}
          </Button>
        </Box>
      </Box>

      {/* Finish Reading Dialog */}
      <Dialog
        open={finishDialogOpen}
        onClose={handleFinishCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: 14 }}>Finish Reading?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12 }}>
            Are you sure you want to end your session for {session.copy?.book?.title}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFinishCancel} sx={{ fontSize: 11 }}>
            Cancel
          </Button>
          <Button
            onClick={handleFinishConfirm}
            variant="contained"
            sx={{ 
              backgroundColor: '#4CAF50',
              '&:hover': { backgroundColor: '#45a049' },
              fontSize: 11,
            }}
          >
            Finish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ fontSize: 11 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ActiveSessionBanner;
