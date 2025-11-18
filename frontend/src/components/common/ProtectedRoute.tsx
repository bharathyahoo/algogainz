import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { setUser } from '../../store/authSlice';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated && token && !user) {
        try {
          // Fetch user profile if we have a token but no user data
          const userData = await authService.getCurrentUser();
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Failed to load user:', error);
          // Token might be invalid, will redirect to login below
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [isAuthenticated, token, user, dispatch]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
