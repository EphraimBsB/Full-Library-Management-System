import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Person,
  History,
  Book,
  Favorite,
  Note,
  Edit,
  Lock,
  Notifications,
  Logout,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../services/api';
import Header from '../components/layout/Header';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Fetch profile summary
  const {
    data: profileSummary,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery(
    ['profileSummary', user?.id],
    () => ApiService.getProfileSummary(user.id),
    {
      enabled: !!user?.id,
    }
  );

  // Fetch reading history (in-house usage)
  const {
    data: readingHistory,
    isLoading: readingHistoryLoading,
  } = useQuery(
    ['readingHistory'],
    () => ApiService.getReadingHistoryByStatus(null, { page: 1, limit: 10 }),
    {
      enabled: !!user?.id,
    }
  );

  // Fetch borrow history
  const {
    data: borrowHistory,
    isLoading: historyLoading,
  } = useQuery(
    ['borrowHistory', user?.id],
    () => ApiService.getBorrowHistory(user.id, { page: 1, limit: 10 }),
    {
      enabled: !!user?.id,
      onSuccess: (data) => {
        // console.log('Borrow History Data:', data);
        // console.log('Borrow History Data Length:', data?.data?.length);
        // console.log('Borrow History Type:', typeof data);
        // console.log('Borrow History Data Property:', data?.data);
      },
      onError: (error) => {
        console.error('Borrow History Error:', error);
      },
    }
  );

  // Fetch favorites
  const {
    data: favorites,
    isLoading: favoritesLoading,
  } = useQuery(
    ['favorites', user?.id],
    () => ApiService.getFavorites(user.id, { page: 1, limit: 10 }),
    {
      enabled: !!user?.id,
    }
  );

  // Fetch notes
  const {
    data: notes,
    isLoading: notesLoading,
  } = useQuery(
    ['notes', user?.id],
    () => ApiService.getUserNotes(user.id, { page: 1, limit: 10 }),
    {
      enabled: !!user?.id,
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Please sign in to view your profile</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/login')}
        >
          Sign In
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Profile Header */}
        <Paper sx={{ p: 4, mb: 2, mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 18 }}>
              My Profile
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={user.avatarUrl}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  {getUserInitials()}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: 16 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.degree} {user.role?.name && `• ${user.role.name}`}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              {profileLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading profile information...</Typography>
                </Box>
              ) : profileError ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading profile information
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Please try refreshing the page
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.email || user.email}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Student ID
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.rollNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Program
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.program || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.phoneNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Member Since
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.joinedAt 
                          ? new Date(profileSummary.joinedAt).getFullYear()
                          : 'N/A'
                        }
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Membership Status
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.membershipStatus || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Membership Type
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.membershipType || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Expiry Date
                      </Typography>
                      <Typography variant="body1">
                        {profileSummary?.expiryDate 
                          ? new Date(profileSummary.expiryDate).getFullYear()
                          : 'N/A'
                        }
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<History />} label="Reading History" />
            <Tab icon={<Book />} label="Borrowing" />
            <Tab icon={<Favorite />} label="Favorites" />
            <Tab icon={<Note />} label="Notes" />
          </Tabs>

          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: 14, fontWeight: 'bold', color: '#000000' }}>Account Settings</Typography>
            <List>
              <ListItem button>
                <ListItemIcon>
                  <Edit />
                </ListItemIcon>
                <ListItemText primary="Edit Profile" />
              </ListItem>
              <Divider />
              <ListItem button>
                <ListItemIcon>
                  <Lock />
                </ListItemIcon>
                <ListItemText primary="Change Password" />
              </ListItem>
              <Divider />
              <ListItem button>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText primary="Notification Settings" />
              </ListItem>
              <Divider />
              <ListItem button onClick={handleLogout}>
                <ListItemIcon>
                  <Logout color="error" />
                </ListItemIcon>
                <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
              </ListItem>
            </List>
          </TabPanel>

          {/* Reading History Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: 14, fontWeight: 'bold', color: '#000000' }}>Reading History</Typography>
            {readingHistoryLoading ? (
              <Typography>Loading reading history...</Typography>
            ) : readingHistory?.items?.length > 0 ? (
              <Grid container spacing={2}>
                {readingHistory.items.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', gap: 2, pb: 2 }}>
                        <Box
                          sx={{
                            width: 80,
                            height: 120,
                            flexShrink: 0,
                            borderRadius: 1,
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <img
                            src={getImageUrl(item.copy?.book?.coverImageUrl)}
                            alt={item.copy?.book?.title || 'Book cover'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              e.target.src = '/assets/default_book.jpg';
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                            }}
                          >
                            <Chip
                              label={item.status?.toUpperCase() || 'UNKNOWN'}
                              size="small"
                              color={
                                item.status === 'active' ? 'success' :
                                item.status === 'completed' ? 'primary' :
                                item.status === 'force_ended' ? 'error' : 'default'
                              }
                              sx={{ fontSize: 9, height: 20 }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
                              {item.copy?.book?.title || 'Unknown Book'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                              <strong>Started:</strong> {item.startedAt ? new Date(item.startedAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                            {item.endedAt && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                                <strong>Ended:</strong> {new Date(item.endedAt).toLocaleDateString()}
                              </Typography>
                            )}
                            {item.duration && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                                <strong>Duration:</strong> {item.duration}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  No reading history found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your reading history will appear here
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Borrowing Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: 14, fontWeight: 'bold', color: '#000000' }}>Current Borrowing</Typography>
            {historyLoading ? (
              <Typography>Loading current borrowing...</Typography>
            ) : (
              <>
                {borrowHistory?.data?.length > 0 ? (
                  <Grid container spacing={2}>
                    {borrowHistory.data.map((item) => (
                      <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1, display: 'flex', gap: 2, pb: 2 }}>
                            <Box
                              sx={{
                                width: 80,
                                height: 120,
                                flexShrink: 0,
                                borderRadius: 1,
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <img
                                src={getImageUrl(item.bookCopy?.book?.coverImageUrl || item.book?.coverImageUrl)}
                                alt={item.bookCopy?.book?.title || item.book?.title || 'Book cover'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onError={(e) => {
                                  e.target.src = '/assets/default_book.jpg';
                                }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                }}
                              >
                                <Chip
                                  label={item.status?.toUpperCase() || 'UNKNOWN'}
                                  size="small"
                                  color={
                                    item.status === 'active' ? 'success' :
                                    item.status === 'returned' ? 'primary' :
                                    item.status === 'overdue' ? 'error' : 'default'
                                  }
                                  sx={{ fontSize: 9, height: 20 }}
                                />
                              </Box>
                            </Box>
                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
                                  {item.bookCopy?.book?.title || item.book?.title || 'Unknown Book'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                                  <strong>Borrowed:</strong> {item.borrowedAt ? new Date(item.borrowedAt).toLocaleDateString() : 'N/A'}
                                </Typography>
                                {item.dueDate && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                                    <strong>Due:</strong> {new Date(item.dueDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {item.returnedAt && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                                    <strong>Returned:</strong> {new Date(item.returnedAt).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      No borrow history found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your borrowing history will appear here
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </TabPanel>

          {/* Favorites Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: 14, fontWeight: 'bold', color: '#000000' }}>Favorite Books</Typography>
            {favoritesLoading ? (
              <Typography>Loading favorites...</Typography>
            ) : favorites?.data?.length > 0 ? (
              <Grid container spacing={2}>
                {favorites.data.map((book) => (
                  <Grid item xs={12} sm={6} md={4} key={book.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', gap: 2, pb: 2 }}>
                        <Box
                          sx={{
                            width: 80,
                            height: 120,
                            flexShrink: 0,
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={getImageUrl(book.coverImageUrl)}
                            alt={book.title || 'Book cover'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              e.target.src = '/assets/default_book.jpg';
                            }}
                          />
                        </Box>
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
                              {book.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11, mb: 1 }}>
                              {book.author}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                              <strong>ISBN:</strong> {book.isbn || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                              <strong>Year:</strong> {book.publicationYear || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  No favorite books yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your favorite books will appear here
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Notes Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: 14, fontWeight: 'bold', color: '#000000' }}>My Notes</Typography>
            {notesLoading ? (
              <Typography>Loading notes...</Typography>
            ) : notes?.data?.length > 0 ? (
              <List>
                {notes.data.map((note) => (
                  <ListItem key={note.id}>
                    <ListItemText
                      primary={note.content?.substring(0, 100) || 'No content'}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Book: {note.book?.title || 'Unknown Book'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Page: {note.pageNumber || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created: {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  No notes yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your book notes will appear here
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;
