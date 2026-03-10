import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, IconButton } from '@mui/material';
import { PlayArrow, ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../services/api';

const HeroSection = ({ books }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-scroll functionality
  useEffect(() => {
    if (!books || books.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % Math.min(books.length, 5)); // show up to 5 in spotlight
    }, 5000);
    return () => clearInterval(interval);
  }, [books]);

  if (!books || books.length === 0) return null;

  const spotlightBooks = books.slice(0, 5); // Take top 5 for hero
  const activeBook = spotlightBooks[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % spotlightBooks.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + spotlightBooks.length) % spotlightBooks.length);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '320px', sm: '360px', md: '400px' }, // Responsive height
        backgroundColor: '#ffffff', // White background
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        mb: 4,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${getImageUrl(activeBook?.coverImageUrl)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.30,
          filter: 'blur(8px)',
          transition: 'background-image 0.5s ease-in-out',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: { xs: '100%', md: '60%' }, // Full width on mobile
          height: '100%',
          background: {
            xs: 'linear-gradient(to bottom, #ffffff 70%, transparent)', // Vertical gradient on mobile
            md: 'linear-gradient(to right, #ffffff 50%, transparent)' // Horizontal gradient on desktop
          },
          zIndex: 1,
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, height: '100%', px: { xs: 2, sm: 3 } }}>
        {/* Mobile Layout - Single Column */}
        <Box sx={{
          display: { xs: 'flex', md: 'none' }, // Only show on mobile
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            py: 2
          }}>
            {/* Mobile content goes here - will duplicate the desktop content */}
            <Typography variant="body2" sx={{ color: '#BF0019', mb: 1, fontWeight: 'bold', fontSize: 11 }}>
              #{activeIndex + 1} Spotlight
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: '#000000',
                fontWeight: 800,
                mb: 1.5,
                lineHeight: 1.3,
                fontSize: 18,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeBook?.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: '#666666', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 10 }}>
                By {activeBook?.author || 'Unknown Author'}
              </Typography>
              {activeBook?.metadata?.averageRating && (
                <Box sx={{ backgroundColor: 'rgba(25, 118, 210, 0.1)', px: 1, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#BF0019', fontSize: 9 }}>
                    ★ {activeBook.metadata.averageRating}
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                fontSize: 11,
              }}
            >
              {activeBook?.description || 'No description available for this book. Explore the pages to find what mysteries lie within.'}
            </Typography>

            <Box sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: 'column',
              alignItems: 'stretch'
            }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                onClick={() => navigate(`/books/${activeBook?.id}`)}
                sx={{
                  backgroundColor: '#BF0019',
                  color: '#ffffff',
                  borderRadius: '24px',
                  px: 2.5,
                  py: 1,
                  fontSize: 11,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  minWidth: '100%',
                  '&:hover': {
                    backgroundColor: '#A80015',
                  }
                }}
              >
                Read Now
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIos sx={{ fontSize: 11 }} />}
                onClick={() => navigate(`/books/${activeBook?.id}`)}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  color: '#000000',
                  borderRadius: '24px',
                  px: 2.5,
                  py: 1,
                  fontSize: 11,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  minWidth: '100%',
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }
                }}
              >
                Detail
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Desktop Layout - Two Column */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, // Only show on desktop
          height: '100%',
          alignItems: 'center'
        }}>
          {/* Desktop Content */}
          <Box sx={{
            flex: 1,
            pr: 4,
            maxWidth: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%'
          }}>
            <Typography variant="body2" sx={{ color: '#BF0019', mb: 1, fontWeight: 'bold', fontSize: 12 }}>
              #{activeIndex + 1} Spotlight
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: '#000000',
                fontWeight: 800,
                mb: 1.5,
                lineHeight: 1.3,
                fontSize: 24,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeBook?.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666666', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11 }}>
                By {activeBook?.author || 'Unknown Author'}
              </Typography>
              {activeBook?.metadata?.averageRating && (
                <Box sx={{ backgroundColor: 'rgba(25, 118, 210, 0.1)', px: 1, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#BF0019', fontSize: 10 }}>
                    ★ {activeBook.metadata.averageRating}
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                mb: 3,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                fontSize: 12,
              }}
            >
              {activeBook?.description || 'No description available for this book. Explore the pages to find what mysteries lie within.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow sx={{ fontSize: 18 }} />}
                onClick={() => navigate(`/books/${activeBook?.id}`)}
                sx={{
                  backgroundColor: '#BF0019',
                  color: '#ffffff',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  fontSize: 12,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#A80015',
                  }
                }}
              >
                Read Now
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIos sx={{ fontSize: 12 }} />}
                onClick={() => navigate(`/books/${activeBook?.id}`)}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  color: '#000000',
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  fontSize: 12,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }
                }}
              >
                Detail
              </Button>
            </Box>
          </Box>
        

        {/* Right Side: Horizontal Slanted Carousel */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              height: '80%',
              alignItems: 'center',
              justifyContent: 'flex-end',
              perspective: '1000px',
            }}
          >
          {spotlightBooks.map((book, index) => {
            const isActive = index === activeIndex;
            const offset = index - activeIndex;

            return (
              <Box
                key={book.id}
                onClick={() => setActiveIndex(index)}
                sx={{
                  position: 'absolute',
                  right: `${(spotlightBooks.length - 1 - index) * 60}px`,
                  width: isActive ? '160px' : '110px',
                  height: isActive ? '280px' : '220px',
                  transition: 'all 0.4s ease-in-out',
                  transform: `skewX(-5deg) translateX(${offset * 10}px)`,
                  transformOrigin: 'bottom',
                  zIndex: spotlightBooks.length - index,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  boxShadow: isActive ? '0 25px 80px rgba(0,0,0,0.15), 0 0 0 4px rgba(25, 118, 210, 0.2)' : '0 10px 30px rgba(0,0,0,0.1)',
                  border: isActive ? '3px solid #BF0019' : '2px solid transparent',
                  '&:hover': {
                    transform: `skewX(-5deg) translateX(${offset * 10}px) translateY(-10px)`,
                    boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                  }
                }}
              >
                <img
                  src={getImageUrl(book.coverImageUrl)}
                  alt={book.title}
                  style={{
                    width: '150%', // compensate for skew
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  onError={(e) => {
                    e.target.src = '/assets/default-book.jpg';
                  }}
                />
                {!isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      transition: 'background-color 0.4s ease',
                    }}
                  />
                )}
              </Box>
            );
          })}
          
          {/* Controls */}
          <Box sx={{ position: 'absolute', bottom: -40, right: 0, display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={handlePrev}
              sx={{ 
                backgroundColor: 'rgba(0,0,0,0.1)', 
                color: '#000000',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' }
              }}
            >
              <ArrowBackIos sx={{ fontSize: 16, ml: 0.5 }} />
            </IconButton>
            <IconButton 
              onClick={handleNext}
              sx={{ 
                backgroundColor: 'rgba(0,0,0,0.1)', 
                color: '#000000',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' }
              }}
            >
              <ArrowForwardIos sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
