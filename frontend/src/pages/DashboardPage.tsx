import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  ShowChart,
  TrendingDown,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';
import dashboardService, { type DashboardMetrics } from '../services/dashboardService';
import PnLTrendChart from '../components/dashboard/PnLTrendChart';
import WinLossChart from '../components/dashboard/WinLossChart';
import PerformersCard from '../components/dashboard/PerformersCard';
import SectorAllocationChart from '../components/dashboard/SectorAllocationChart';
import { ConnectionStatusIndicator } from '../components/common/ConnectionStatus';
import { MarketStatusBanner } from '../components/common/MarketStatusBanner';
import { usePriceUpdates, useOnPriceUpdate } from '../hooks/useWebSocket';
import { holdingsService, type Holding } from '../services/holdingsService';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
    loadHoldings();
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

  const loadHoldings = async () => {
    try {
      const data = await holdingsService.getHoldings();
      setHoldings(data);
    } catch (err: any) {
      console.error('Error loading holdings:', err);
    }
  };

  // Subscribe to WebSocket price updates for all holdings
  const holdingSymbols = holdings.map((h) => h.stockSymbol);
  usePriceUpdates(holdingSymbols, holdings.length > 0);

  // Handle real-time price updates
  useOnPriceUpdate(
    useCallback(
      (priceData: any) => {
        const { symbol, price } = priceData;

        // Find the holding that matches this symbol
        const holding = holdings.find((h) => h.stockSymbol === symbol);
        if (!holding) return;

        // Calculate new unrealized P&L for this holding
        const newCurrentValue = price * holding.quantity;
        const newUnrealizedPnL = newCurrentValue - holding.totalInvested;

        // Calculate the difference in unrealized P&L
        const pnlDiff = newUnrealizedPnL - (holding.unrealizedPnL || 0);

        // Update metrics with the new values
        setMetrics((prevMetrics) => {
          if (!prevMetrics) return prevMetrics;

          const newUnrealizedPnL = (prevMetrics.unrealizedPnL || 0) + pnlDiff;
          const newCurrentPortfolioValue = (prevMetrics.currentPortfolioValue || 0) + pnlDiff;
          const newTotalPnL = (prevMetrics.realizedPnL || 0) + newUnrealizedPnL;
          const newReturnPercent =
            prevMetrics.totalInvested && prevMetrics.totalInvested > 0
              ? (newTotalPnL / prevMetrics.totalInvested) * 100
              : 0;

          return {
            ...prevMetrics,
            unrealizedPnL: newUnrealizedPnL,
            currentPortfolioValue: newCurrentPortfolioValue,
            totalPnL: newTotalPnL,
            returnPercent: newReturnPercent,
          };
        });

        // Update the holding in state
        setHoldings((prevHoldings) =>
          prevHoldings.map((h) =>
            h.stockSymbol === symbol
              ? {
                  ...h,
                  currentPrice: price,
                  currentValue: newCurrentValue,
                  unrealizedPnL: newUnrealizedPnL,
                  unrealizedPnLPct:
                    h.totalInvested > 0 ? (newUnrealizedPnL / h.totalInvested) * 100 : 0,
                  dayChange: priceData.change,
                  dayChangePct: priceData.changePercent,
                }
              : h
          )
        );
      },
      [holdings]
    )
  );

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
        <ConnectionStatusIndicator />
      </Box>

      {/* Market Status Banner */}
      <MarketStatusBanner />

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

              {/* Sector Allocation Chart */}
              <Grid item xs={12} md={6}>
                <SectorAllocationChart holdings={holdings} />
              </Grid>

              {/* Performers */}
              <Grid item xs={12} md={6}>
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
  );
};

export default DashboardPage;
