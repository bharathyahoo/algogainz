import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { TrendingUp, Security, Assessment, Notifications } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../services/authService';
import { loginSuccess } from '../store/authSlice';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKiteLogin = () => {
    authService.initiateLogin();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.loginWithEmail(email, password);
      localStorage.setItem('token', response.token);

      const user = authService.decodeToken(response.token);
      if (user) {
        dispatch(loginSuccess({ user, token: response.token }));
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ mb: 4 }}>
            <TrendingUp
              sx={{
                fontSize: 64,
                color: 'primary.main',
                mb: 2,
              }}
            />
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AlgoGainz
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Smart Trading Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maximize your gains with intelligent technical analysis
            </Typography>
          </Box>

          {/* Features */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ mb: 4, justifyContent: 'center' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="body2">Technical Analysis</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Notifications color="primary" />
              <Typography variant="body2">Smart Alerts</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
              <Typography variant="body2">Secure Trading</Typography>
            </Box>
          </Stack>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Email/Password Login Form */}
          <Box component="form" onSubmit={handleEmailLogin} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Don't have an account?{' '}
            <Link href="/register" underline="hover">
              Register here
            </Link>
          </Typography>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Zerodha Login Button */}
          <Button
            variant="outlined"
            size="large"
            onClick={handleKiteLogin}
            sx={{
              py: 1.5,
              px: 5,
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            Connect to Zerodha Kite
          </Button>

          {/* Info */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Sign in with email or connect directly to Zerodha Kite
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              AlgoGainz tracks only trades made through this app or manually recorded
            </Typography>
          </Box>

          {/* Disclaimer */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="warning.main" display="block">
              This is not financial advice. Trade at your own risk.
            </Typography>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          color="white"
          align="center"
          sx={{ mt: 3, opacity: 0.8 }}
        >
          Powered by Zerodha Kite Connect API
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginPage;
