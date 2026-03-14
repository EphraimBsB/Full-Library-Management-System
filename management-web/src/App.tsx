import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './core/hooks';
import { LoginForm } from './features/auth/components/LoginForm';
import { ForgotPasswordPage } from './features/auth/components/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/components/ResetPasswordPage';
import { DashboardLayout } from './features/dashboard/components/DashboardLayout';
import { DashboardSummary } from './features/dashboard/components/DashboardSummary';
import { BooksPage } from './features/books/components/BooksPage';
import { BookGrid } from './features/dashboard/components/BookGrid';
import { MembersPage } from './features/members/components/MembersPage';
import { LoansPage } from './features/loans/components/LoansPage';
import SettingsPage from './features/settings/components/SettingsPage';
import { theme } from './core/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const muiTheme = createTheme({
  palette: {
    primary: {
      main: theme.colors.primary,
    },
    secondary: {
      main: theme.colors.secondary,
    },
    background: {
      default: theme.colors.background,
    },
  },
  typography: {
    fontFamily: theme.typography.fontFamily,
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout showTopbar={true} showRightSidebar={true}>
                    <DashboardSummary />
                    <BookGrid />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <BooksPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LoansPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MembersPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
