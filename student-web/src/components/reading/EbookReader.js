import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  BookmarkAdd as BookmarkAddIcon,
  Notes as NotesIcon,
  NotesOutlined as NotesOutlinedIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

// Configure PDF.js worker to use reliable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const EbookReader = ({ book, open, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [isNotesVisible, setIsNotesVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pageWidth, setPageWidth] = useState(null);
  
  const pdfRef = useRef(null);
  const containerRef = useRef(null);
  const pageRefs = useRef([]); // store refs to each rendered page for scrolling

  // Load notes when component mounts or book changes
  useEffect(() => {
    if (open && book?.id) {
      loadNotes();
    }
  }, [open, book?.id]);

  // measure container width for responsive page sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        // leave some padding
        setPageWidth(containerRef.current.offsetWidth - 32);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRef]);

  const loadNotes = async () => {
    try {
      const notesData = await ApiService.getBookNotes(book.id);
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load notes',
        severity: 'error',
      });
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setLoading(true);
    try {
      const noteData = {
        content: noteText,
        pageNumber: currentPage,
        bookId: book.id,
        isPublic: false,
      };

      const newNote = await ApiService.createBookNote(noteData);
      setNotes([...notes, newNote]);
      setNoteText('');
      setNoteDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Note added successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error adding note:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add note',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await ApiService.deleteBookNote(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
      
      setSnackbar({
        open: true,
        message: 'Note deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete note',
        severity: 'error',
      });
    }
  };

  const handleNoteClick = (note) => {
    // Jump to the page of the note
    if (note.pageNumber) {
      setCurrentPage(note.pageNumber);
      const el = pageRefs.current[note.pageNumber - 1];
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
    setPdfLoading(false);
  };

  const handleDocumentLoadError = (error) => {
    console.error('PDF document load error:', error);
    setPdfLoading(false);
    setSnackbar({
      open: true,
      message: 'Failed to load PDF document. Please try again.',
      severity: 'error',
    });
  };

  const handlePageChange = (direction) => {
    let newPage = currentPage;
    if (direction === 'prev' && currentPage > 1) {
      newPage = currentPage - 1;
    } else if (direction === 'next' && currentPage < totalPages) {
      newPage = currentPage + 1;
    }
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      // scroll to new page if ref available
      const el = pageRefs.current[newPage - 1];
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  const handlePdfError = (error) => {
    setPdfLoading(false);
    console.error('PDF loading error:', error);
    setSnackbar({
      open: true,
      message: 'Failed to load PDF',
      severity: 'error',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!book) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth fullScreen>
      <AppBar position="static" sx={{ backgroundColor: '#BF0019' }}>
        <Toolbar>
          <IconButton edge="start" onClick={onClose} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: 16 }}>
            {book.title}
          </Typography>
          
          <Chip 
            label={`Page ${currentPage} of ${totalPages}`} 
            size="small" 
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              color: 'white',
              fontSize: 12,
              mr: 1,
            }} 
          />
          
          <IconButton onClick={() => setNoteDialogOpen(true)} sx={{ color: 'white' }}>
            <BookmarkAddIcon />
          </IconButton>
          
          <IconButton onClick={() => setIsNotesVisible(!isNotesVisible)} sx={{ color: 'white' }}>
            {isNotesVisible ? <NotesIcon /> : <NotesOutlinedIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* PDF Viewer */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'auto' }}>
          {pdfLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          
          <Box ref={containerRef} sx={{ display: 'flex', justifyContent: 'center', py: 2, width: '100%' }}>
            <Document
              file={book.ebookUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={<CircularProgress />}
              error={
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography color="error" gutterBottom>
                    Failed to load PDF
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => window.open(book.ebookUrl, '_blank')}
                    sx={{ mt: 2 }}
                  >
                    Open in New Tab
                  </Button>
                </Box>
              }
            >
              {/* render all pages vertically to allow scrolling/navigation */}
              {Array.from({ length: totalPages }, (_, idx) => (
                <div
                  key={idx}
                  ref={(el) => (pageRefs.current[idx] = el)}
                  style={{ marginBottom: 16 }}
                >
                  <Page
                    pageNumber={idx + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={pageWidth || 600}
                  />
                </div>
              ))}
            </Document>
          </Box>

          {/* Page Navigation */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            py: 2,
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #e0e0e0'
          }}>
            <IconButton
              onClick={() => handlePageChange('prev')}
              disabled={currentPage <= 1}
              sx={{ 
                backgroundColor: 'white',
                '&:hover': { backgroundColor: '#f0f0f0' },
                '&.Mui-disabled': { backgroundColor: '#f5f5f5' }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              {currentPage} / {totalPages}
            </Typography>
            
            <IconButton
              onClick={() => handlePageChange('next')}
              disabled={currentPage >= totalPages}
              sx={{ 
                backgroundColor: 'white',
                '&:hover': { backgroundColor: '#f0f0f0' },
                '&.Mui-disabled': { backgroundColor: '#f5f5f5' }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Notes Drawer */}
        <Drawer
          anchor="right"
          open={isNotesVisible}
          onClose={() => setIsNotesVisible(false)}
          variant="persistent"
        >
          <Box sx={{ width: 350, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontSize: 16 }}>
                My Notes
              </Typography>
              <IconButton onClick={() => setIsNotesVisible(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {notes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                No notes yet. Click the bookmark icon to add notes.
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {notes.map((note) => (
                  <ListItem
                    key={note.id}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                    onClick={() => handleNoteClick(note)}
                  >
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: 12, mb: 0.5 }}>
                            {note.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Page {note.pageNumber} • {formatDate(note.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Drawer>
      </Box>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14 }}>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Type your note here..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This note will be added to page {currentPage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)} sx={{ fontSize: 11 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddNote} 
            variant="contained" 
            disabled={!noteText.trim() || loading}
            sx={{ fontSize: 11 }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ fontSize: 11 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EbookReader;
