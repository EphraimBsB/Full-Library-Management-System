import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginDialog from '../components/auth/LoginDialog';

/**
 * Higher-order component that ensures user is authenticated
 * Shows login dialog if not authenticated
 * Matches Flutter's ensureAuthenticated function
 */
export const withAuth = (WrappedComponent, message = 'Please log in to continue') => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated } = useAuth();
    const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);

    React.useEffect(() => {
      if (!isAuthenticated) {
        setLoginDialogOpen(true);
      }
    }, [isAuthenticated]);

    const handleLoginSuccess = () => {
      setLoginDialogOpen(false);
    };

    if (!isAuthenticated) {
      return (
        <>
          <LoginDialog 
            open={loginDialogOpen} 
            onClose={() => setLoginDialogOpen(false)}
            message={message}
            onLoginSuccess={handleLoginSuccess}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px' 
          }}>
            <Typography variant="body1" color="text.secondary">
              Please log in to continue
            </Typography>
          </div>
        </>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Hook to ensure authentication - matches Flutter's ensureAuthenticated
 * @param {string} message - Message to show in login dialog
 * @returns {boolean} - Whether user is authenticated
 */
export const useEnsureAuth = (message = 'Please log in to continue') => {
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
    }
  }, [isAuthenticated]);

  const LoginDialogComponent = React.useMemo(() => {
    if (!isAuthenticated) {
      return (
        <LoginDialog 
          open={loginDialogOpen} 
          onClose={() => setLoginDialogOpen(false)}
          message={message}
        />
      );
    }
    return null;
  }, [isAuthenticated, loginDialogOpen, message]);

  return {
    isAuthenticated,
    LoginDialogComponent,
    showLoginDialog: () => setLoginDialogOpen(true)
  };
};

/**
 * Simple function to show login dialog - matches Flutter's showLoginDialog
 * @param {Function} setDialogOpen - Function to control dialog state
 * @param {string} message - Message to show
 */
export const showLoginDialog = (setDialogOpen, message = 'Please log in to continue') => {
  setDialogOpen({ open: true, message });
};
