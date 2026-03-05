import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  GlobalStyles,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface EbookReaderProps {
  open: boolean;
  onClose: () => void;
  ebookUrl: string;
  title: string;
}

export const EbookReader: React.FC<EbookReaderProps> = ({ open, onClose, ebookUrl, title }) => {
  // Prevent right-click, copy, and key shortcuts globally while reading
  useEffect(() => {
    if (!open) return;

    const preventAction = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleKeydown = (e: KeyboardEvent) => {
      // Disable Ctrl+S (Save), Ctrl+P (Print), Ctrl+U (View Source), Ctrl+C (Copy), Ctrl+Shift+I (DevTools)
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u' || e.key === 'c')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Add listeners to window to catch events globally, including those that might
    // start inside the iframe browsing context (if the browser allows).
    window.addEventListener('contextmenu', preventAction, true);
    window.addEventListener('copy', preventAction, true);
    window.addEventListener('cut', preventAction, true);
    window.addEventListener('keydown', handleKeydown, true);

    return () => {
      window.removeEventListener('contextmenu', preventAction, true);
      window.removeEventListener('copy', preventAction, true);
      window.removeEventListener('cut', preventAction, true);
      window.removeEventListener('keydown', handleKeydown, true);
    };
  }, [open]);

  // Construct the URL with PDF parameters to hide toolbars
  // Using a cleaner URL construction to avoid potential encoding issues
  const secureUrl = ebookUrl.includes('#') 
    ? ebookUrl.split('#')[0] + '#toolbar=0&navpanes=0'
    : `${ebookUrl}#toolbar=0&navpanes=0`;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
        },
      }}
    >
      {/* Disable printing via CSS */}
      <GlobalStyles
        styles={{
          '@media print': {
            'body *': {
              display: 'none !important',
            },
          },
        }}
      />
      
      <AppBar sx={{ position: 'relative', backgroundColor: '#2d2d2d', boxShadow: 'none' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography sx={{ ml: 2, flex: 1, fontWeight: 600 }} variant="h6" component="div">
            {title} - E-Book Reader
          </Typography>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent 
        sx={{ 
          p: 0, 
          height: '100%', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            height: '100%',
            overflow: 'auto', // Parent is now the scrollable container
            backgroundColor: '#f0f0f0',
            position: 'relative',
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* 
            The iframe is made extremely tall and non-interactive.
            This forces all interactions (scroll, right-click, etc.) to be handled 
            by the parent Box, which we control.
          */}
          <iframe
            src={secureUrl}
            title={title}
            width="100%"
            height="15000px" // Sufficiently large height to contain most ebooks/PDFs
            style={{ 
              border: 'none', 
              pointerEvents: 'none', // This is key: it makes the iframe "invisible" to mouse events
              display: 'block',
              backgroundColor: 'white',
            }}
          />
        </Box>
        
        <Box sx={{ 
          p: 1.5, 
          backgroundColor: '#2d2d2d', 
          color: 'rgba(255,255,255,0.7)', 
          textAlign: 'center',
          fontSize: '0.75rem',
          zIndex: 10,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          Read-only mode. Content protected by ISBAT LMS Security.
          (Note: Interaction with internal links is disabled for security)
        </Box>
      </DialogContent>
    </Dialog>
  );
};

