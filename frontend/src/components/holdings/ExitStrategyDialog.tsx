import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import { TrendingUp, TrendingDown, ShowChart } from '@mui/icons-material';
import {
  holdingsService,
  type ExitStrategyRequest,
  type Holding,
} from '../../services/holdingsService';

interface ExitStrategyDialogProps {
  open: boolean;
  onClose: () => void;
  holding: Holding | null;
  onSuccess?: () => void;
}

const ExitStrategyDialog: React.FC<ExitStrategyDialogProps> = ({
  open,
  onClose,
  holding,
  onSuccess,
}) => {
  const [profitTargetPct, setProfitTargetPct] = useState<string>('');
  const [stopLossPct, setStopLossPct] = useState<string>('');
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open && holding) {
      // Load existing exit strategy
      if (holding.exitStrategy) {
        setProfitTargetPct(holding.exitStrategy.profitTargetPct?.toString() || '');
        setStopLossPct(holding.exitStrategy.stopLossPct?.toString() || '');
        setAlertEnabled(holding.exitStrategy.alertEnabled);
      } else {
        // Reset form
        setProfitTargetPct('');
        setStopLossPct('');
        setAlertEnabled(true);
      }
      setError('');
    }
  }, [open, holding]);

  const handleSave = async () => {
    if (!holding) return;

    // Validation
    if (!profitTargetPct && !stopLossPct) {
      setError('Please set at least one target (profit or stop loss)');
      return;
    }

    const profitPct = profitTargetPct ? parseFloat(profitTargetPct) : null;
    const stopPct = stopLossPct ? parseFloat(stopLossPct) : null;

    if (profitPct !== null && profitPct <= 0) {
      setError('Profit target must be greater than 0');
      return;
    }

    if (stopPct !== null && stopPct <= 0) {
      setError('Stop loss must be greater than 0');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const strategy: ExitStrategyRequest = {
        profitTargetPct: profitPct,
        stopLossPct: stopPct,
        alertEnabled,
      };

      await holdingsService.setExitStrategy(holding.id, strategy);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save exit strategy');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!holding) return;

    setError('');
    setLoading(true);

    try {
      await holdingsService.deleteExitStrategy(holding.id);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete exit strategy');
    } finally {
      setLoading(false);
    }
  };

  if (!holding) return null;

  // Calculate target prices whenever percentages change
  const profitTargetPrice = useMemo(() => {
    if (!profitTargetPct || profitTargetPct.trim() === '') return null;
    const pct = parseFloat(profitTargetPct);
    if (isNaN(pct) || pct <= 0) return null;
    return holdingsService.calculateProfitTargetPrice(holding.avgBuyPrice, pct);
  }, [profitTargetPct, holding.avgBuyPrice]);

  const stopLossPrice = useMemo(() => {
    if (!stopLossPct || stopLossPct.trim() === '') return null;
    const pct = parseFloat(stopLossPct);
    if (isNaN(pct) || pct <= 0) return null;
    return holdingsService.calculateStopLossPrice(holding.avgBuyPrice, pct);
  }, [stopLossPct, holding.avgBuyPrice]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShowChart color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Set Exit Strategy
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {holding.stockSymbol} - {holding.companyName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Holding Info */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Avg Buy Price
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                ₹{holding.avgBuyPrice.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                ₹{holding.currentPrice?.toFixed(2) || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Quantity
              </Typography>
              <Typography variant="body1">{holding.quantity}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Unrealized P&L
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: (holding.unrealizedPnL || 0) >= 0 ? 'success.main' : 'error.main',
                }}
              >
                ₹{holding.unrealizedPnL?.toFixed(2) || '0.00'} (
                {holding.unrealizedPnLPct?.toFixed(2) || '0.00'}%)
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Profit Target */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUp color="success" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Profit Target
            </Typography>
          </Box>
          <TextField
            label="Profit Target (%)"
            type="number"
            fullWidth
            value={profitTargetPct}
            onChange={(e) => setProfitTargetPct(e.target.value)}
            inputProps={{ step: '0.1', min: '0' }}
            helperText={
              profitTargetPrice
                ? `Target Price: ₹${profitTargetPrice.toFixed(2)}`
                : 'Example: Enter 10 for 10% profit'
            }
          />
        </Box>

        {/* Stop Loss */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingDown color="error" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Stop Loss
            </Typography>
          </Box>
          <TextField
            label="Stop Loss (%)"
            type="number"
            fullWidth
            value={stopLossPct}
            onChange={(e) => setStopLossPct(e.target.value)}
            inputProps={{ step: '0.1', min: '0' }}
            helperText={
              stopLossPrice
                ? `Stop Loss Price: ₹${stopLossPrice.toFixed(2)}`
                : 'Example: Enter 5 for 5% stop loss'
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Alert Settings */}
        <FormControlLabel
          control={
            <Switch checked={alertEnabled} onChange={(e) => setAlertEnabled(e.target.checked)} />
          }
          label="Enable Alerts"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
          Get notified when profit target or stop loss is hit
        </Typography>
      </DialogContent>

      <DialogActions>
        {holding.exitStrategy && (
          <Button onClick={handleDelete} color="error" disabled={loading}>
            Remove Strategy
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : 'Save Strategy'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExitStrategyDialog;
