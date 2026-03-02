import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Add,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../../core/theme';
import { BookService } from '../services/book.service';
import { BookCard } from '../../../shared/components/Books/BookCard';
import { SysConfigService } from '../services/sys-config.service';
import { BookDetailsDialog } from './BookDetailsDialog';
import { BookFormDialog } from './BookFormDialog';
import { type Book } from '../services/book.service';

export const BooksPage: React.FC = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: '',
    subject: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['books', params],
    queryFn: () => BookService.getBooks(params),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: SysConfigService.getCategories,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: SysConfigService.getSubjects,
  });

  // unwrap paginated responses
  const subjectOptions = Array.isArray(subjects)
    ? subjects
    : (subjects as any)?.data || []; // categories not needed for book listing filter

  const refetchBooks = () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setParams(prev => ({ ...prev, page: value }));
  };

  const handleOpenDetails = (bookId: number) => {
    setSelectedBookId(bookId);
    setDetailsDialogOpen(true);
  };

  const handleOpenAddForm = () => {
    setEditingBook(undefined);
    setFormDialogOpen(true);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      minHeight: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#101828' }}>
            Book Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#667085' }}>
            Manage your library's collection, search, and track availability.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAddForm}
          sx={{
            backgroundColor: theme.colors.primary,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            px: 2.5,
            '&:hover': { backgroundColor: theme.colors.secondary },
          }}
        >
          Add New Book
        </Button>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        mb: 4, 
        p: 2, 
        backgroundColor: 'white', 
        borderRadius: '12px',
        border: '1px solid #EAECF0',
        boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by title, author, or ISBN..."
            value={params.search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#667085' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              minWidth: 250,
              maxWidth: { xs: '100%', sm: 400 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '40px',
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 120, flexShrink: 0 }}>
            <InputLabel>Subject</InputLabel>
            <Select
              value={params.subject}
              label="Subject"
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              sx={{ borderRadius: '8px', height: '40px' }}
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjectOptions.map((subject: any) => (
                <MenuItem key={subject.id} value={subject.name}>{subject.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120, flexShrink: 0 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={params.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
              sx={{ borderRadius: '8px', height: '40px' }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="unavailable">Unavailable</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130, flexShrink: 0 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={params.sortBy}
              label="Sort By"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              sx={{ borderRadius: '8px', height: '40px' }}
            >
              <MenuItem value="createdAt">Newest Added</MenuItem>
              <MenuItem value="title">Title (A-Z)</MenuItem>
              <MenuItem value="rating">Top Rated</MenuItem>
              <MenuItem value="borrowCount">Most Borrowed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Category Pills */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          maxWidth: '100%'
        }}>
          <Box
            onClick={() => handleFilterChange('category', '')}
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: !params.category ? theme.colors.primary : '#D0D5DD',
              backgroundColor: !params.category ? theme.colors.primary : 'transparent',
              color: !params.category ? 'white' : '#344054',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.colors.primary,
                backgroundColor: !params.category ? theme.colors.primary : '#F9FAFB',
              }
            }}
          >
            All
          </Box>
          {categories?.map((cat) => (
            <Box
              key={cat.id}
              onClick={() => handleFilterChange('category', cat.name)}
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: params.category === cat.name ? theme.colors.primary : '#D0D5DD',
                backgroundColor: params.category === cat.name ? theme.colors.primary : 'transparent',
                color: params.category === cat.name ? 'white' : '#344054',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.colors.primary,
                  backgroundColor: params.category === cat.name ? theme.colors.primary : '#F9FAFB',
                }
              }}
            >
              {cat.name}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, gap: 2 }}>
          <CircularProgress sx={{ color: theme.colors.primary }} />
          <Typography sx={{ color: '#667085', fontWeight: 500 }}>Loading your collection...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ py: 8 }}>
          <Alert severity="error" sx={{ borderRadius: '8px' }}>
            Failed to load books. Please try refreshing or check your connection.
          </Alert>
        </Box>
      ) : (
        <>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: {
                xs: 'repeat(3, 1fr)',
                sm: 'repeat(4, 1fr)',
                md: 'repeat(5, 1fr)',
                lg: 'repeat(6, 1fr)',
                xl: 'repeat(7, 1fr)',
              }, 
              columnGap: '16px', 
              rowGap: '24px',
              width: '100%',
              maxWidth: '100%',
              alignItems: 'start',
              boxSizing: 'border-box'
            }}
          >
            {data?.data.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                onTap={() => handleOpenDetails(book.id)}
              />
            ))}
          </Box>

          {(!data || data.data.length === 0) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 1 }}>
              <Typography sx={{ color: '#101828', fontWeight: 600, fontSize: '18px' }}>No books found</Typography>
              <Typography sx={{ color: '#667085' }}>Try adjusting your search or filters to find what you're looking for.</Typography>
              <Button 
                onClick={() => setParams({ ...params, search: '', category: '', subject: '', status: '', page: 1 })}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 600, color: theme.colors.primary }}
              >
                Clear all filters
              </Button>
            </Box>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, pb: 4 }}>
              <Pagination 
                count={data.totalPages} 
                page={params.page} 
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '8px',
                    fontWeight: 600,
                  }
                }}
              />
            </Box>
          )}
        </>
      )}

      {selectedBookId && (
        <BookDetailsDialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          bookId={selectedBookId}
        />
      )}

      <BookFormDialog
        open={formDialogOpen}
        onClose={(refetch) => {
          setFormDialogOpen(false);
          if (refetch) refetchBooks();
        }}
        book={editingBook}
      />
    </Box>
    </Box>
  );
};
