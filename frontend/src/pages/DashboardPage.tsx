import React from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import { Logout, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { logout } from '../store/authSlice';
import { authService } from '../services/authService';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <TrendingUp sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            AlgoGainz
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.userName || 'User'}!
          </Typography>
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                🎉 Welcome to AlgoGainz!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You've successfully authenticated with Zerodha Kite. Your trading assistant is ready!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>User ID:</strong> {user?.userId}
              </Typography>
              {user?.email && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {user.email}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Feature Cards */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => navigate('/watchlist')}
            >
              <Typography variant="h6" gutterBottom>
                📊 Watchlist
              </Typography>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                ✅ Available Now!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to manage your stocks
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                💼 Holdings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coming in Phase 5
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                📈 Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coming in Phase 5
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                📑 Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coming in Phase 6
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Status Info */}
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
          <Typography variant="body2" color="success.contrastText">
            <strong>Phase 3 Complete!</strong> Watchlist management is now available! Search and add stocks, organize with categories, and track prices. Next up: Technical Analysis (Phase 4).
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardPage;
