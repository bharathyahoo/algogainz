import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { AccountBalance, TrendingUp } from '@mui/icons-material';
import { holdingsService, type Holding } from '../services/holdingsService';
import HoldingCard from '../components/holdings/HoldingCard';
import ExitStrategyDialog from '../components/holdings/ExitStrategyDialog';
import OrderDialog from '../components/trading/OrderDialog';
import { ConnectionStatusIndicator } from '../components/common/ConnectionStatus';
import { MarketStatusBanner } from '../components/common/MarketStatusBanner';
import { AlertList } from '../components/holdings/AlertList';
import { usePriceUpdates, useOnPriceUpdate, useOnAlert } from '../hooks/useWebSocket';
import { websocketService, type Alert as AlertType } from '../services/websocketService';

const HoldingsPage: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [exitStrategyDialogOpen, setExitStrategyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertType[]>([]);

  useEffect(() => {
    loadHoldings();
    loadActiveAlerts();
  }, []);

  const loadHoldings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await holdingsService.getHoldings();
      setHoldings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load holdings');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveAlerts = () => {
    // Request active alerts from server
    websocketService.getActiveAlerts();
  };

  // Listen for active alerts response
  useEffect(() => {
    const unsubscribe = websocketService.onActiveAlerts((activeAlerts) => {
      console.log('[HoldingsPage] Received active alerts:', activeAlerts);
      setAlerts(activeAlerts);
    });

    return unsubscribe;
  }, []);

  // Listen for new alerts
  useOnAlert(
    useCallback((newAlert: AlertType) => {
      console.log('[HoldingsPage] New alert received:', newAlert);

      // Add to alerts list if not already present
      setAlerts((prevAlerts) => {
        const exists = prevAlerts.some(
          (a) => a.holdingId === newAlert.holdingId && a.type === newAlert.type
        );
        if (!exists) {
          return [...prevAlerts, newAlert];
        }
        return prevAlerts;
      });

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('AlgoGainz Alert', {
          body: newAlert.message,
          icon: '/logo192.png',
          badge: '/logo192.png',
        });
      }
    }, [])
  );

  // Subscribe to WebSocket price updates for all holdings
  const holdingSymbols = holdings.map((h) => h.stockSymbol);
  usePriceUpdates(holdingSymbols, holdings.length > 0);

  // Handle real-time price updates
  useOnPriceUpdate(
    useCallback(
      (priceData: any) => {
        const { symbol, price, change, changePercent } = priceData;

        setHoldings((prevHoldings) =>
          prevHoldings.map((holding) => {
            if (holding.stockSymbol === symbol) {
              // Recalculate unrealized P&L with new price
              const newCurrentValue = price * holding.quantity;
              const newUnrealizedPnL = newCurrentValue - holding.totalInvested;
              const newUnrealizedPnLPct =
                holding.totalInvested > 0 ? (newUnrealizedPnL / holding.totalInvested) * 100 : 0;

              return {
                ...holding,
                currentPrice: price,
                currentValue: newCurrentValue,
                unrealizedPnL: newUnrealizedPnL,
                unrealizedPnLPct: newUnrealizedPnLPct,
                dayChange: change,
                dayChangePct: changePercent,
              };
            }
            return holding;
          })
        );
      },
      [holdings]
    )
  );

  const handleSetExitStrategy = (holding: Holding) => {
    setSelectedHolding(holding);
    setExitStrategyDialogOpen(true);
  };

  const handleSell = (holding: Holding) => {
    setSelectedHolding(holding);
    setSellDialogOpen(true);
  };

  const handleExitStrategySuccess = () => {
    loadHoldings(); // Refresh holdings after setting exit strategy
  };

  const handleSellSuccess = () => {
    loadHoldings(); // Refresh holdings after selling
    setSellDialogOpen(false);
  };

  const handleDismissAlert = (holdingId: string, type: 'PROFIT_TARGET' | 'STOP_LOSS') => {
    // Remove from local state
    setAlerts((prevAlerts) =>
      prevAlerts.filter((a) => !(a.holdingId === holdingId && a.type === type))
    );

    // Send dismissal to server
    websocketService.dismissAlert(holdingId, type);
  };

  const handleQuickSell = (alert: AlertType) => {
    // Find the holding for this alert
    const holding = holdings.find((h) => h.id === alert.holdingId);
    if (holding) {
      setSelectedHolding(holding);
      setSellDialogOpen(true);
    }
  };

  // Calculate portfolio totals
  const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const totalCurrentValue = holdings.reduce(
    (sum, h) => sum + (h.currentValue || h.totalInvested),
    0
  );
  const totalUnrealizedPnL = holdings.reduce((sum, h) => sum + (h.unrealizedPnL || 0), 0);
  const totalUnrealizedPnLPct = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AccountBalance color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            My Holdings
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <ConnectionStatusIndicator />
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          View your current positions and manage exit strategies
        </Typography>
      </Box>

      {/* Market Status Banner */}
      <MarketStatusBanner />

      {/* Info Banner */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Holdings shown here include only trades made through this app or
          manually recorded. Direct Zerodha Kite trades are NOT automatically synchronized.
        </Typography>
      </Alert>

      {/* Active Alerts */}
      <AlertList
        alerts={alerts}
        onDismiss={handleDismissAlert}
        onQuickSell={handleQuickSell}
      />

      {/* Portfolio Summary */}
      {holdings.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Portfolio Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Total Invested
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ₹{totalInvested.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Current Value
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ₹{totalCurrentValue.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Unrealized P&L
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: totalUnrealizedPnL >= 0 ? 'success.main' : 'error.main',
                }}
              >
                ₹{totalUnrealizedPnL.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                Returns
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {totalUnrealizedPnL >= 0 && <TrendingUp color="success" fontSize="small" />}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: totalUnrealizedPnL >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {totalUnrealizedPnLPct.toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Holdings Grid */}
      {!loading && holdings.length > 0 && (
        <Grid container spacing={3}>
          {holdings.map((holding) => (
            <Grid item xs={12} sm={6} md={4} key={holding.id}>
              <HoldingCard
                holding={holding}
                onSetExitStrategy={handleSetExitStrategy}
                onSell={handleSell}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && holdings.length === 0 && !error && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Holdings Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have any holdings yet. Start by buying stocks or recording manual
            transactions.
          </Typography>
        </Box>
      )}

      {/* Exit Strategy Dialog */}
      <ExitStrategyDialog
        open={exitStrategyDialogOpen}
        onClose={() => setExitStrategyDialogOpen(false)}
        holding={selectedHolding}
        onSuccess={handleExitStrategySuccess}
      />

      {/* Sell Order Dialog */}
      {selectedHolding && (
        <OrderDialog
          open={sellDialogOpen}
          onClose={() => setSellDialogOpen(false)}
          stockSymbol={selectedHolding.stockSymbol}
          companyName={selectedHolding.companyName}
          exchange="NSE"
          instrumentToken=""
          currentPrice={selectedHolding.currentPrice || selectedHolding.avgBuyPrice}
          transactionType="SELL"
          onSuccess={handleSellSuccess}
        />
      )}
    </Container>
  );
};

export default HoldingsPage;
