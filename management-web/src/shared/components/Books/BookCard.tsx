import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import type { Book } from '../../../features/books/services/book.service';
import { theme } from '../../../core/theme';

interface BookCardProps {
  book: Book;
  onTap?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onTap }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const rating = book.rating;

  return (
    <Box
      onClick={onTap}
      sx={{
        width: '100%',
        minWidth: 0,
        maxWidth: '280px',
        aspectRatio: '0.7',
        backgroundColor: '#F3F4F6',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        cursor: onTap ? 'pointer' : 'default',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
        '&:hover': {
          transform: onTap ? 'translateY(-8px)' : 'none',
          boxShadow: onTap ? '0 12px 20px rgba(0, 0, 0, 0.15)' : 'none',
          '& .book-overlay': {
            opacity: 1,
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
          },
          '& .book-details': {
            opacity: 1,
            transform: 'translateY(0)',
          }
        },
      }}
    >
      {/* Background Cover Image */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {imgLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#F9FAFB',
              zIndex: 1
            }}
          >
            <CircularProgress
              size={24}
              sx={{ color: theme.colors.primary }}
              thickness={2}
            />
          </Box>
        )}
        <img
          src={imgError ? '/admin/default_book.jpg' : (book.coverImageUrl || '/admin/default_book.jpg')}
          alt={book.title}
          onLoad={() => setImgLoading(false)}
          onError={() => {
            setImgError(true);
            setImgLoading(false);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>

      {/* Gradient Overlay for Readability */}
      <Box 
        className="book-overlay"
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '60%', 
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
          zIndex: 1,
          opacity: 0,
          transition: 'all 0.3s ease-in-out'
        }} 
      />

      {/* Status Text */}
      <Typography
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontSize: '9px',
          fontWeight: 500,
          color: book.availableCopies > 0 ? '#027A48' : '#B42318',
          backgroundColor: book.availableCopies > 0 ? '#ECFDF3' : '#FEF3F2',
          padding: '2px 6px',
          borderRadius: '8px',
          zIndex: 2,
          letterSpacing: '0.5px',
          maxWidth: '80px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {book.availableCopies > 0 ? 'Available' : 'Borrowed'}
      </Typography>

      {/* Rating Badge */}
      {rating !== undefined && rating !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            borderRadius: '12px',
            px: '8px',
            py: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 2,
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Star sx={{ color: '#FFD700', fontSize: 14 }} />
          <Typography
            sx={{
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {Number(rating).toFixed(1)}
          </Typography>
        </Box>
      )}

      {/* Book Details Overlayed */}
      <Box 
        className="book-details"
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 1.5, 
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          opacity: 0,
          transform: 'translateY(10px)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.2,
            mb: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {book.title}
        </Typography>
        <Typography
          sx={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          by {book.author}
        </Typography>
      </Box>
    </Box>
  );
};
