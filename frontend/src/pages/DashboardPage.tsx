import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Logout,
  TrendingUp,
  AccountBalance,
  ShowChart,
  TrendingDown,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { logout } from '../store/authSlice';
import { authService } from '../services/authService';
import dashboardService, { type DashboardMetrics } from '../services/dashboardService';
import PnLTrendChart from '../components/dashboard/PnLTrendChart';
import WinLossChart from '../components/dashboard/WinLossChart';
import PerformersCard from '../components/dashboard/PerformersCard';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Error loading dashboard metrics:', err);
      setError(err.response?.data?.error?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

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

  const formatCurrency = (value: number | null | undefined) => {
    const safeValue = value ?? 0;
    return `₹${safeValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number | null | undefined) => {
    const safeValue = value ?? 0;
    const sign = safeValue >= 0 ? '+' : '';
    return `${sign}${safeValue.toFixed(2)}%`;
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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Portfolio Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back, {user?.userName || 'User'}!
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : metrics ? (
          <>
            {/* Portfolio Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Total Invested */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalance sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Total Invested
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(metrics.totalInvested)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Current Portfolio Value */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ShowChart sx={{ color: 'info.main', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Current Value
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(metrics.currentPortfolioValue)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Total P&L */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 2.5,
                    bgcolor: (metrics.totalPnL ?? 0) >= 0 ? 'success.50' : 'error.50',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {(metrics.totalPnL ?? 0) >= 0 ? (
                      <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Total P&L
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: (metrics.totalPnL ?? 0) >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatCurrency(metrics.totalPnL)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      fontWeight: 600,
                      color: (metrics.totalPnL ?? 0) >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatPercent(metrics.returnPercent)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Win Rate */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ color: 'warning.main', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Win Rate
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {(metrics.winRate ?? 0).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {metrics.totalTrades ?? 0} total trades
                  </Typography>
                </Paper>
              </Grid>

              {/* Realized P&L */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2.5 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Realized P&L
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: (metrics.realizedPnL ?? 0) >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatCurrency(metrics.realizedPnL)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Unrealized P&L */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2.5 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Unrealized P&L
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: (metrics.unrealizedPnL ?? 0) >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatCurrency(metrics.unrealizedPnL)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Avg Profit Per Trade */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2.5 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Avg Profit Per Trade
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: (metrics.avgProfitPerTrade ?? 0) >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatCurrency(metrics.avgProfitPerTrade)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* P&L Trend Chart */}
              <Grid item xs={12} lg={8}>
                <PnLTrendChart />
              </Grid>

              {/* Win/Loss Chart */}
              <Grid item xs={12} lg={4}>
                <WinLossChart totalTrades={metrics.totalTrades ?? 0} winRate={metrics.winRate ?? 0} />
              </Grid>

              {/* Performers */}
              <Grid item xs={12}>
                <PerformersCard
                  topPerformers={metrics.topPerformers ?? []}
                  worstPerformers={metrics.worstPerformers ?? []}
                />
              </Grid>
            </Grid>

            {/* Quick Links */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
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
                  <Typography variant="body2" color="text.secondary">
                    Manage your stocks
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => navigate('/holdings')}
                >
                  <Typography variant="h6" gutterBottom>
                    💼 Holdings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View holdings & exit strategies
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => navigate('/transactions')}
                >
                  <Typography variant="h6" gutterBottom>
                    📈 Transactions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View transaction history
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => navigate('/reports')}
                >
                  <Typography variant="h6" gutterBottom>
                    📑 Reports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate & export Excel reports
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        ) : null}
      </Container>
    </Box>
  );
};

export default DashboardPage;
