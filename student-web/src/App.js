import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EbookReaderPage from './pages/EbookReaderPage';
import BookDetailsPage from './pages/BookDetailsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#BF0019',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem', // 32px
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
    },
    h5: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem', // 14px
    },
    body2: {
      fontSize: '0.75rem', // 12px
    },
    caption: {
      fontSize: '0.625rem', // 10px
    },
    subtitle1: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
    },
    overline: {
      fontSize: '0.625rem', // 10px
      fontWeight: 400,
      textTransform: 'uppercase',
    },
    button: {
      fontSize: '0.75rem', // 12px
    },
  },
  shape: {
    borderRadius: 8,
  },
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/books/:id" element={<BookDetailsPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ebook-reader/:bookId"
                element={
                  <ProtectedRoute>
                    <EbookReaderPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
