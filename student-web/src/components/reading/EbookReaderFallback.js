import React, { useState, useRef, useEffect } from 'react';
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
  Slider,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  BookmarkAdd as BookmarkAddIcon,
  Notes as NotesIcon,
  NotesOutlined as NotesOutlinedIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

const EbookReader = ({ book, open, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [isNotesVisible, setIsNotesVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const pdfRef = useRef(null);

  // Load notes when component mounts or book changes
  useEffect(() => {
    if (open && book?.id) {
      loadNotes();
    }
  }, [open, book?.id]);

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
      console.log('Jumping to page:', note.pageNumber);
    }
  };

  const handlePdfLoad = () => {
    setPdfLoading(false);
    console.log('PDF loaded successfully');
  };

  const handlePdfError = (error) => {
    setPdfLoading(false);
    console.error('PDF loading error:', error);
    setSnackbar({
      open: true,
      message: 'Failed to load PDF. Opening in new tab...',
      severity: 'warning',
    });
    // Fallback: open in new tab
    setTimeout(() => {
      window.open(book.ebookUrl, '_blank');
    }, 2000);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomChange = (event, newValue) => {
    setZoomLevel(newValue);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const updatePdfZoom = () => {
    if (pdfRef.current) {
      const zoomValue = zoomLevel / 100;
      pdfRef.current.style.transform = `scale(${zoomValue})`;
      pdfRef.current.style.transformOrigin = 'top left';
      pdfRef.current.style.width = `${100 / zoomValue}%`;
      pdfRef.current.style.height = `${100 / zoomValue}%`;
    }
  };

  useEffect(() => {
    updatePdfZoom();
  }, [zoomLevel]);

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
          
          {/* Zoom Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <IconButton 
              onClick={handleZoomOut} 
              size="small" 
              sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            
            <Typography variant="body2" sx={{ color: 'white', fontSize: 12, minWidth: 45 }}>
              {zoomLevel}%
            </Typography>
            
            <IconButton 
              onClick={handleZoomIn} 
              size="small" 
              sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
              onClick={toggleFullscreen} 
              size="small" 
              sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Box>
          
          <Chip 
            label={`Page ${currentPage}`} 
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
        <Box sx={{ flex: 1, position: 'relative' }}>
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
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Loading PDF...
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* PDF iframe - fallback approach */}
          <iframe
            ref={pdfRef}
            src={`${book.ebookUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&zoom=auto`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            onLoad={handlePdfLoad}
            onError={handlePdfError}
            title="PDF Viewer"
          />
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
