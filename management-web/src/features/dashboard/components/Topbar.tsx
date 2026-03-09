import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Popover,
  ClickAwayListener,
  Chip,
} from '@mui/material';
import {
  Search,
  AddBox,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { theme } from '../../../core/theme';
import { SearchService } from '../services/search.service';
import type { BookSearchResult, MemberSearchResult, SearchFilters } from '../services/search.service';
import { SearchResultsDropdown } from './SearchResultsDropdown';
import { BookFormDialog } from '../../books/components/BookFormDialog';
import { BookDetailsDialog } from '../../books/components/BookDetailsDialog';
import { MemberDetailsDialog } from '../../members/components/MemberDetailsDialog';
import { MemberFormDialog } from '../../members/components/MemberFormDialog';

export const Topbar: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchEntity, setSearchEntity] = useState<'all' | 'books' | 'members'>('all');

  // Dialog states for search results
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [bookDetailsDialogOpen, setBookDetailsDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDetailsDialogOpen, setMemberDetailsDialogOpen] = useState(false);

  // Member editing states
  const [showMemberFormDialog, setShowMemberFormDialog] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<any | null>(null);

  const debouncedSearchValue = useDebounce(searchValue, 300);

  const searchFilters: SearchFilters = { entity: searchEntity };

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['globalSearch', debouncedSearchValue, searchEntity],
    queryFn: () => SearchService.searchAll(debouncedSearchValue, searchFilters, 5),
    enabled: debouncedSearchValue.length >= 2,
  });

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    setSelectedIndex(-1);

    if (value.trim() && !anchorEl) {
      setAnchorEl(event.target as HTMLElement);
    } else if (!value.trim() && anchorEl) {
      setAnchorEl(null);
    }
  };

  const handleSearchFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (searchValue.trim() && !anchorEl) {
      setAnchorEl(event.target as HTMLElement);
    }
  };

  const handleCloseSearch = () => {
    setAnchorEl(null);
    setSelectedIndex(-1);
  };

  const handleBookSelect = useCallback((book: BookSearchResult) => {
    setSelectedBookId(book.id);
    setBookDetailsDialogOpen(true);
    handleCloseSearch();
    setSearchValue('');
  }, []);

  const handleMemberSelect = useCallback((member: MemberSearchResult) => {
    setSelectedMemberId(member.id);
    setMemberDetailsDialogOpen(true);
    handleCloseSearch();
    setSearchValue('');
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!searchResults) return;

    const totalResults = (searchResults.books?.length || 0) + (searchResults.members?.length || 0);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          const books = searchResults.books || [];
          const members = searchResults.members || [];

          if (selectedIndex < books.length) {
            handleBookSelect(books[selectedIndex]);
          } else {
            handleMemberSelect(members[selectedIndex - books.length]);
          }
        }
        break;
      case 'Escape':
        handleCloseSearch();
        break;
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
      <ClickAwayListener onClickAway={handleCloseSearch}>
        <Box sx={{width: '75%',}}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              placeholder="Search books, members, or transactions..."
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleKeyDown}
              sx={{
                // width: '75%',
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
                  fontSize: 12,
                  color: '#101828',
                  height: '100%',
                  padding: '0 12px',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#98A2B3',
                  fontSize: 12,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ pl: 1 }}>
                    <Search sx={{ fontSize: 16, color: '#98A2B3' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleCloseSearch}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  width: anchorEl ? anchorEl.clientWidth : 'auto',
                  maxWidth: 700,
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
              }}
              disableAutoFocus
              disableEnforceFocus
            >
              <SearchResultsDropdown
                results={searchResults || { books: [], members: [] }}
                isLoading={isSearching}
                query={debouncedSearchValue}
                onBookSelect={handleBookSelect}
                onMemberSelect={handleMemberSelect}
                onLoadMoreBooks={() => console.log('Load more books')}
                onLoadMoreMembers={() => console.log('Load more members')}
              />
            </Popover>
          </Box>

          {/* Entity Filter Chips */}
          {searchValue.trim() && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All"
                size="small"
                variant={searchEntity === 'all' ? 'filled' : 'outlined'}
                onClick={() => setSearchEntity('all')}
                sx={{
                  fontSize: 10,
                  height: 24,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              <Chip
                label="Books Only"
                size="small"
                variant={searchEntity === 'books' ? 'filled' : 'outlined'}
                onClick={() => setSearchEntity('books')}
                sx={{
                  fontSize: 10,
                  height: 24,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              <Chip
                label="Members Only"
                size="small"
                variant={searchEntity === 'members' ? 'filled' : 'outlined'}
                onClick={() => setSearchEntity('members')}
                sx={{
                  fontSize: 10,
                  height: 24,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          )}
        </Box>
      </ClickAwayListener>

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
          fontSize: 12,
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

      {/* Book Details Dialog */}
      {selectedBookId && (
        <BookDetailsDialog
          open={bookDetailsDialogOpen}
          onClose={() => {
            setBookDetailsDialogOpen(false);
            setSelectedBookId(null);
          }}
          bookId={selectedBookId}
        />
      )}

      {/* Member Form Dialog */}
      <MemberFormDialog
        open={showMemberFormDialog}
        onClose={() => {
          setShowMemberFormDialog(false);
          setSelectedMemberForEdit(null);
        }}
        member={selectedMemberForEdit || undefined}
      />

      {/* Member Details Dialog */}
      {selectedMemberId && (
        <MemberDetailsDialog
          open={memberDetailsDialogOpen}
          userId={selectedMemberId}
          onClose={() => {
            setMemberDetailsDialogOpen(false);
            setSelectedMemberId(null);
          }}
          onEdit={(member) => {
            setMemberDetailsDialogOpen(false);
            setSelectedMemberForEdit(member);
            setShowMemberFormDialog(true);
          }}
        />
      )}
    </Box>
  );
};
