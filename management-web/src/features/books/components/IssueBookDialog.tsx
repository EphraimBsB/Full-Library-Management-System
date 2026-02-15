import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LoanService } from '../services/loan.service';
import { UserService, type User } from '../../members/services/user.service';
import { useQuery } from '@tanstack/react-query';

interface IssueBookDialogProps {
  open: boolean;
  onClose: () => void;
  bookId: number;
  bookTitle: string;
  availableAccessNumbers: string[];
  bookCopies?: any[]; // Add book copies to get copy IDs
  onSuccess: () => void;
}

export const IssueBookDialog: React.FC<IssueBookDialogProps> = ({
  open,
  onClose,
  bookId,
  bookTitle,
  availableAccessNumbers,
  bookCopies,
  onSuccess,
}) => {
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [accessNumber, setAccessNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch members for autocomplete
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => UserService.getUsers({ limit: 100 }),
  });
  const members = membersData?.data || [];

  const handleSubmit = async () => {
    if (!selectedMember || !accessNumber) {
      setError('Please select a member and access number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find the copy ID from the access number
      // We need to get the actual copy ID, not just the access number
      const copyId = await getCopyIdFromAccessNumber(accessNumber);
      
      await LoanService.issueBookToUser({
        rollNumber: selectedMember.rollNumber || '',
        bookId: bookId.toString(),
        accessNumber: copyId.toString(), // Send copy ID as accessNumber (backend will map to preferredCopyId)
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get copy ID from access number
  const getCopyIdFromAccessNumber = async (accessNumber: string): Promise<number> => {
    if (!bookCopies) {
      // Fallback: extract number from access number if bookCopies not available
      const match = accessNumber.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      throw new Error('Invalid access number format');
    }

    // Find the copy with matching access number
    const copy = bookCopies.find(c => c.accessNumber === accessNumber);
    if (!copy) {
      throw new Error(`Copy with access number ${accessNumber} not found`);
    }

    return copy.id;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Issue Book</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500 }}>
              BOOK TITLE
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {bookTitle}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Autocomplete
            options={members}
            value={selectedMember}
            onChange={(_, newValue) => {
              setSelectedMember(newValue);
              // Clear access number when member changes
              setAccessNumber(null);
            }}
            getOptionLabel={(option) => 
              `${option.firstName} ${option.lastName} (${option.rollNumber || 'No Roll Number'})`
            }
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Select Member" 
                placeholder="Search for member..."
                required
                autoFocus
              />
            )}
            fullWidth
            loading={membersLoading}
            sx={{ mb: 2 }}
          />

          <Autocomplete
            options={availableAccessNumbers}
            value={accessNumber}
            onChange={(_, newValue) => setAccessNumber(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Access Number" required />
            )}
            fullWidth
            disabled={!selectedMember}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedMember || !accessNumber}
          sx={{ 
            textTransform: 'none',
            backgroundColor: '#1570EF',
            '&:hover': { backgroundColor: '#175CD3' }
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Issue Book'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
