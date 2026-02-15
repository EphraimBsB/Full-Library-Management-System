import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  AddBox,
} from '@mui/icons-material';
import { theme } from '../../../core/theme';
import { BookFormDialog } from '../../books/components/BookFormDialog';

export const Topbar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);

  const handleAddBook = () => {
    setShowAddBookDialog(true);
  };

  const handleCloseBookDialog = (refetch?: boolean) => {
    setShowAddBookDialog(false);
    if (refetch) {
      // TODO: Refresh books data if needed
      console.log('Books data should be refreshed');
    }
  };

  return (
    <Box
      sx={{
        height: 60,
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid #EAECF0`,
        display: 'flex',
        alignItems: 'center',
        px: 2.5, // 20px
        py: 2, // 16px
        ml: 0.6, // 5px
        borderRadius: '0 0 0 8px',
        gap: 2,
      }}
    >
      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search books, members, or transactions..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        sx={{
          width: '75%',
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F9FAFB',
            borderRadius: 2,
            height: 40,
            '& fieldset': {
              borderColor: '#D0D5DD',
              borderRadius: 2,
            },
            '&:hover fieldset': {
              borderColor: '#D0D5DD',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#D0D5DD',
              borderWidth: 1.5,
            },
          },
          '& .MuiInputBase-input': {
            fontSize: 13,
            color: '#101828',
            height: '100%',
            padding: '0 12px',
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#98A2B3',
            fontSize: 13,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ pl: 1 }}>
              <Search sx={{ fontSize: 18, color: '#98A2B3' }} />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ flex: 0.6 }} />

      {/* Add New Book Button */}
      <Button
        variant="contained"
        onClick={handleAddBook}
        sx={{
          backgroundColor: theme.colors.primary,
          color: 'white',
          px: 2.5, // 20px
          py: 1.5, // 12px
          borderRadius: 3, // 24px
          fontSize: 13,
          fontWeight: 600,
          textTransform: 'none',
          minWidth: 'auto',
          '&:hover': {
            backgroundColor: theme.colors.secondary,
          },
        }}
        startIcon={<AddBox sx={{ fontSize: 18 }} />}
      >
        Add new book
      </Button>

      {/* Book Form Dialog */}
      <BookFormDialog
        open={showAddBookDialog}
        onClose={handleCloseBookDialog}
      />
    </Box>
  );
};
