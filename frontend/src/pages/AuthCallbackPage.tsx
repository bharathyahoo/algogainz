import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useAppDispatch } from '../hooks/useRedux';
import { loginSuccess, loginFailure } from '../store/authSlice';
import { authService } from '../services/authService';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('message');

    if (token) {
      // Success - decode token and set auth state
      const user = authService.decodeToken(token);

      if (user) {
        dispatch(loginSuccess({ user, token }));
        setStatus('success');
        setMessage('Login successful! Redirecting to dashboard...');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Failed to decode authentication token');
        dispatch(loginFailure('Invalid token'));
      }
    } else if (error) {
      // Error from backend
      setStatus('error');
      setMessage(decodeURIComponent(error));
      dispatch(loginFailure(error));
    } else {
      // No token or error - something went wrong
      setStatus('error');
      setMessage('No authentication data received');
      dispatch(loginFailure('Authentication failed'));
    }
  }, [searchParams, dispatch, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 5,
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          {status === 'loading' && (
            <Box>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Authenticating...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we verify your credentials
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box>
              <CheckCircle
                sx={{
                  fontSize: 80,
                  color: 'success.main',
                  mb: 2,
                }}
              />
              <Typography variant="h5" gutterBottom color="success.main">
                Login Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Alert severity="success" sx={{ mt: 2 }}>
                Redirecting you to the dashboard...
              </Alert>
            </Box>
          )}

          {status === 'error' && (
            <Box>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h5" gutterBottom color="error.main">
                Authentication Failed
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Please try logging in again. If the problem persists, check your Kite API credentials.
                </Typography>
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={handleRetry}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                Return to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthCallbackPage;
