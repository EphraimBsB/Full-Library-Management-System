import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  CheckCircle,
  Star,
  Book as BookIcon,
  History,
  People,
  HourglassEmpty,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BookService } from '../services/book.service';
import { theme } from '../../../core/theme';
import { IssueBookDialog } from './IssueBookDialog';
import { BookFormDialog } from './BookFormDialog';
import { UpdateCopyDialog } from './UpdateCopyDialog';
import type { BookCopy } from '../services/book.service';
import { EbookReader } from './EbookReader';

interface BookDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  bookId: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const BookDetailsDialog: React.FC<BookDetailsDialogProps> = ({ open, onClose, bookId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [isUpdateCopyDialogOpen, setIsUpdateCopyDialogOpen] = useState(false);
  const [isEbookReaderOpen, setIsEbookReaderOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: details, isLoading, error, refetch } = useQuery({
    queryKey: ['book-details', bookId],
    queryFn: () => BookService.getBookDetails(bookId),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => BookService.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      onClose();
    },
  });

  if (!open) return null;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      deleteMutation.mutate(bookId);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  if (error || !details) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Failed to load book details</Alert>
          <Button onClick={() => refetch()} sx={{ mt: 2 }}>Retry</Button>
        </Box>
      </Dialog>
    );
  }

  const { book, current_borrows, borrow_history, queue_requests } = details;
  const isAvailable = book.availableCopies > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: '12px',
          maxHeight: '90vh',
          backgroundColor: '#F9FAFB'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        px: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottom: '1px solid #EAECF0'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#101828' }}>
          Book Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            size="small"
            onClick={() => setIsEditFormOpen(true)}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            size="small"
            onClick={handleDelete}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Delete
          </Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton onClick={onClose} size="small" sx={{ color: '#667085' }}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Main Content Area */}
        <Grid container sx={{ height: 'calc(90vh - 70px)', display: 'flex' }}>
          {/* Left Sidebar - Book Info */}
          <Grid size={{ xs: 12, md: 4 }} sx={{
            borderRight: '1px solid #EAECF0', 
            backgroundColor: 'white',
            p: 3,
            overflowY: 'auto'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Cover Image */}
              <Box sx={{ 
                width: '100%', 
                aspectRatio: '2/3', 
                backgroundColor: '#F2F4F7', 
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
              }}>
                <img 
                  src={book.coverImageUrl || '/admin/default_book.jpg'} 
                  alt={book.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/admin/default_book.jpg';
                  }}
                />
              </Box>

              {/* Title & Author */}
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#101828', mb: 1 }}>
                  {book.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#1570EF', fontWeight: 500 }}>
                  by {book.author}
                </Typography>
              </Box>

              {/* Rating & Stats */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star sx={{ color: '#FDB022', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054' }}>
                    {book.metadata?.averageRating?.toFixed(1) || '0.0'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2" sx={{ color: '#667085' }}>
                  {book.metadata?.views || 0} views
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2" sx={{ color: '#667085' }}>
                  {book.borrowCount || 0} borrows
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!isAvailable}
                  onClick={() => setIsIssueDialogOpen(true)}
                  startIcon={<CheckCircle />}
                  sx={{ 
                    backgroundColor: theme.colors.primary, 
                    textTransform: 'none', 
                    borderRadius: '8px',
                    fontWeight: 600,
                    py: 1,
                    '&:hover': { backgroundColor: theme.colors.secondary }
                  }}
                >
                  {isAvailable ? 'Issue Book' : 'None Available'}
                </Button>
                {book.ebookUrl && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<BookIcon />}
                    sx={{ 
                      textTransform: 'none', 
                      borderRadius: '8px',
                      fontWeight: 600,
                      py: 1
                    }}
                    onClick={() => setIsEbookReaderOpen(true)}
                  >
                    Read E-Book
                  </Button>
                )}
              </Box>

              <Divider />

              {/* Metadata List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'ISBN', value: book.isbn },
                  { label: 'Publisher', value: book.publisher || 'N/A' },
                  { label: 'Published', value: book.publicationYear },
                  { label: 'Edition', value: book.edition || 'N/A' },
                  { label: 'Type', value: book.type?.name || 'N/A' },
                ].map((item, idx) => (
                  <Box key={idx}>
                    <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500, display: 'block' }}>
                      {item.label.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#344054', fontWeight: 600 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}

                {book.categories && book.categories.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500, display: 'block', mb: 0.5 }}>
                      CATEGORIES
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {book.categories.map(cat => (
                        <Chip key={cat.id} label={cat.name} size="small" sx={{ borderRadius: '4px', height: '20px', fontSize: '11px', fontWeight: 500 }} />
                      ))}
                    </Box>
                  </Box>
                )}

                {book.subjects && book.subjects.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#667085', fontWeight: 500, display: 'block', mb: 0.5 }}>
                      SUBJECTS
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {book.subjects.map(sub => (
                        <Chip key={sub.id} label={sub.name} size="small" variant="outlined" sx={{ borderRadius: '4px', height: '20px', fontSize: '11px', fontWeight: 500 }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Right Main Area - Borrowing Status & Content */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            {/* Description */}
            {book.description && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#101828', mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ color: '#475467', lineHeight: 1.6 }}>
                  {book.description}
                </Typography>
              </Box>
            )}

            {/* Borrowing Status Tabs */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ borderBottom: '1px solid #EAECF0' }}>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    minWidth: 0,
                    mr: 4,
                    fontWeight: 600,
                    color: '#667085',
                    '&.Mui-selected': { color: theme.colors.primary }
                  }
                }}>
                  <Tab label="Book Copies" icon={<BookIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                  <Tab label="Active Borrows" icon={<HourglassEmpty sx={{ fontSize: 18 }} />} iconPosition="start" />
                  <Tab label="History" icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" />
                  <Tab label="Queue" icon={<People sx={{ fontSize: 18 }} />} iconPosition="start" />
                </Tabs>
              </Box>

              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={2}>
                  {book.copies?.map(copy => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={copy.id}>
                      <Paper variant="outlined" sx={{ 
                        p: 2, 
                        borderRadius: '8px', 
                        borderColor: copy.status === 'AVAILABLE' ? '#D1FADF' : '#EAECF0',
                        backgroundColor: copy.status === 'AVAILABLE' ? '#F6FEF9' : 'white',
                        '&:hover': { borderColor: theme.colors.primary }
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Acc No# {copy.accessNumber}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={copy.status} 
                            color={copy.status === 'AVAILABLE' ? 'success' : 'default'}
                            variant={copy.status === 'AVAILABLE' ? 'filled' : 'outlined'}
                            sx={{ height: '20px', fontSize: '10px', fontWeight: 700 }}
                          />
                        </Box>
                        {copy.notes && (
                          <Typography variant="caption" sx={{ color: '#667085' }}>
                            {copy.notes}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            sx={{ p: 0.5 }}
                            onClick={() => {
                              setSelectedCopy(copy);
                              setIsUpdateCopyDialogOpen(true);
                            }}
                          >
                            <Edit sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                  {(!book.copies || book.copies.length === 0) && (
                    <Box sx={{ p: 4, textAlign: 'center', width: '100%', color: '#667085' }}>
                      No copies registered for this book.
                    </Box>
                  )}
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {current_borrows.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Copy</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrower</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrowed At</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Due Date</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {current_borrows.map((borrow, idx) => (
                          <TableRow key={idx}>
                            <TableCell>#{borrow.copy_access_number}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '10px' }}>{borrow.borrower.name[0]}</Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{borrow.borrower.name}</Typography>
                                  <Typography variant="caption" sx={{ color: '#667085' }}>{borrow.borrower.roll_number}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>{format(new Date(borrow.borrowed_at), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{format(new Date(borrow.due_date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>
                              {borrow.is_overdue ? (
                                <Chip label="Overdue" size="small" color="error" sx={{ height: '20px', fontSize: '10px' }} />
                              ) : (
                                <Chip label="Active" size="small" color="primary" sx={{ height: '20px', fontSize: '10px' }} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', color: '#667085' }}>
                    <HourglassEmpty sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography>No active borrows for this book.</Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {borrow_history.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrower</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Borrowed At</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Returned At</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475467' }}>Copy</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {borrow_history.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.borrower.name}</Typography>
                              <Typography variant="caption" sx={{ color: '#667085' }}>{item.borrower.roll_number}</Typography>
                            </TableCell>
                            <TableCell>{format(new Date(item.borrowed_at), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{format(new Date(item.returned_at), 'dd MMM yyyy')}</TableCell>
                            <TableCell>#{item.copy_access_number}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', color: '#667085' }}>
                    <History sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography>No borrowing history found.</Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                {queue_requests.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {queue_requests.map((request, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '8px' }}>
                        <Avatar sx={{ backgroundColor: theme.colors.primary }}>{request.position}</Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{request.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#667085' }}>{request.roll_number}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#667085' }}>
                          Requested: {format(new Date(request.requested_at), 'dd MMM yyyy')}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', color: '#667085' }}>
                    <People sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography>The request queue is currently empty.</Typography>
                  </Box>
                )}
              </TabPanel>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <IssueBookDialog
        open={isIssueDialogOpen}
        onClose={() => setIsIssueDialogOpen(false)}
        bookId={book.id}
        bookTitle={book.title}
        availableAccessNumbers={book.copies?.filter(c => c.status === 'AVAILABLE').map(c => c.accessNumber) || []}
        bookCopies={book.copies || []}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['books'] });
        }}
      />

      <BookFormDialog
        open={isEditFormOpen}
        onClose={(refetchNeeded) => {
          setIsEditFormOpen(false);
          if (refetchNeeded) {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['books'] });
          }
        }}
        book={book}
      />

      {selectedCopy && (
        <UpdateCopyDialog
          open={isUpdateCopyDialogOpen}
          onClose={(success) => {
            setIsUpdateCopyDialogOpen(false);
            if (success) {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['books'] });
            }
          }}
          bookId={book.id}
          copy={selectedCopy}
        />
      )}

      {book.ebookUrl && (
        <EbookReader
          open={isEbookReaderOpen}
          onClose={() => setIsEbookReaderOpen(false)}
          ebookUrl={book.ebookUrl}
          title={book.title}
        />
      )}
    </Dialog>
  );
};
