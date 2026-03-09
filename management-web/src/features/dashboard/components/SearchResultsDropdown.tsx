import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material';
import {
  Search,
  MenuBook,
  ExpandMore,
} from '@mui/icons-material';
import { theme } from '../../../core/theme';
import type { BookSearchResult, MemberSearchResult, SearchResults } from '../services/search.service';

interface SearchResultsDropdownProps {
  results: SearchResults;
  isLoading: boolean;
  query: string;
  onBookSelect: (book: BookSearchResult) => void;
  onMemberSelect: (member: MemberSearchResult) => void;
  onLoadMoreBooks?: () => void;
  onLoadMoreMembers?: () => void;
}

export const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  results,
  isLoading,
  query,
  onBookSelect,
  onMemberSelect,
  onLoadMoreBooks,
  onLoadMoreMembers,
}) => {
  const { books, members, hasMore } = results;
  const totalResults = books.length + members.length;

  if (isLoading) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!query.trim()) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Search sx={{ color: '#98A2B3', fontSize: 24, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Start typing to search books and members...
        </Typography>
      </Box>
    );
  }

  if (totalResults === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Search sx={{ color: '#98A2B3', fontSize: 24, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No results found for "{query}"
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
      {/* Books Section */}
      {books.length > 0 && (
        <>
          <Box sx={{ px: 2, py: 1, bgcolor: '#F9FAFB' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#667085' }}>
              BOOKS ({books.length})
            </Typography>
          </Box>
          <List dense>
            {books.map((book) => (
              <ListItemButton
                key={`book-${book.id}`}
                onClick={() => onBookSelect(book)}
                sx={{ px: 2, py: 1 }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  {book.coverImageUrl ? (
                    <Avatar
                      src={book.coverImageUrl}
                      variant="rounded"
                      sx={{ width: 32, height: 40 }}
                    />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 32, height: 40, bgcolor: theme.colors.primary }}>
                      <MenuBook sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>
                      {book.title}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                        {book.author}
                      </Typography>
                      <Chip
                        label={book.availabilityStatus}
                        size="small"
                        color={book.availabilityStatus === 'Available' ? 'success' : 'warning'}
                        sx={{ fontSize: 9, height: 18 }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
          {hasMore?.books && onLoadMoreBooks && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button
                size="small"
                onClick={onLoadMoreBooks}
                sx={{
                  fontSize: 11,
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 1
                }}
                endIcon={<ExpandMore sx={{ fontSize: 14 }} />}
              >
                Show More Books
              </Button>
            </Box>
          )}
          {members.length > 0 && <Divider />}
        </>
      )}

      {/* Members Section */}
      {members.length > 0 && (
        <>
          <Box sx={{ px: 2, py: 1, bgcolor: '#F9FAFB' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#667085' }}>
              MEMBERS ({members.length})
            </Typography>
          </Box>
          <List dense>
            {members.map((member) => (
              <ListItemButton
                key={`member-${member.id}`}
                onClick={() => onMemberSelect(member)}
                sx={{ px: 2, py: 1 }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#F9FAFB', color: '#667085', fontSize: 14, fontWeight: 600 }}>
                    {member.firstName[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>
                      {member.firstName} {member.lastName}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                        {member.rollNumber}
                      </Typography>
                      <Chip
                        label={`${member.currentBorrowedBooks} books`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 9, height: 18 }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
          {hasMore?.members && onLoadMoreMembers && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button
                size="small"
                onClick={onLoadMoreMembers}
                sx={{
                  fontSize: 11,
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 1
                }}
                endIcon={<ExpandMore sx={{ fontSize: 14 }} />}
              >
                Show More Members
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
