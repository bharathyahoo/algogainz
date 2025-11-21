import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  IconButton,
  Divider,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';
import PerformanceMetrics from './PerformanceMetrics';
import EquityCurveChart from './EquityCurveChart';
import TradeLogTable from './TradeLogTable';
import type { BacktestResult, BacktestSummary } from '../../types';

interface BacktestResultsProps {
  backtestHistory: BacktestSummary[];
  currentResult: BacktestResult | null;
  onViewBacktest: (id: string) => void;
  onDeleteBacktest: (id: string) => void;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({
  backtestHistory,
  currentResult,
  onViewBacktest,
  onDeleteBacktest,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(currentResult?.id || null);
  const [showDetails, setShowDetails] = useState(true);

  const handleSelectBacktest = (id: string) => {
    setSelectedId(id);
    onViewBacktest(id);
    setShowDetails(true);
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this backtest?')) {
      onDeleteBacktest(id);
    }
  };

  const getReturnColor = (value: number) => {
    if (value > 0) return 'success';
    if (value < 0) return 'error';
    return 'default';
  };

  const getWinRateColor = (value: number) => {
    if (value >= 60) return 'success';
    if (value >= 45) return 'warning';
    return 'error';
  };

  return (
    <Grid container spacing={3}>
      {/* Backtest History List (Left Side) */}
      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ height: '100%', maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Backtest History</Typography>
            <Typography variant="caption" color="text.secondary">
              {backtestHistory.length} backtest{backtestHistory.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {backtestHistory.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No backtests yet. Create your first strategy to get started.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {backtestHistory.map((backtest, index) => (
                <React.Fragment key={backtest.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => handleDelete(backtest.id, e)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      selected={selectedId === backtest.id}
                      onClick={() => handleSelectBacktest(backtest.id)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {backtest.strategyName}
                            </Typography>
                            <Chip
                              label={backtest.stockSymbol}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                              <Chip
                                label={formatPercent(backtest.totalReturnPct)}
                                size="small"
                                color={getReturnColor(backtest.totalReturnPct)}
                                icon={
                                  backtest.totalReturnPct >= 0 ? (
                                    <TrendingUpIcon />
                                  ) : (
                                    <TrendingDownIcon />
                                  )
                                }
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                              <Chip
                                label={`${backtest.winRate.toFixed(0)}% Win`}
                                size="small"
                                color={getWinRateColor(backtest.winRate)}
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {backtest.totalTrades} trades • {formatDate(backtest.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Grid>

      {/* Detailed Results (Right Side) */}
      <Grid item xs={12} md={8}>
        {!currentResult ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Select a backtest from the list to view detailed results
            </Typography>
          </Paper>
        ) : (
          <Box>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {currentResult.strategyName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={currentResult.stockSymbol} size="small" />
                    <Chip
                      label={`${formatDate(currentResult.startDate)} - ${formatDate(
                        currentResult.endDate
                      )}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Initial: ${formatCurrency(currentResult.initialCapital, 0)}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <IconButton onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Quick Stats */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Return
                  </Typography>
                  <Typography
                    variant="h6"
                    color={currentResult.totalReturnPct >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatPercent(currentResult.totalReturnPct)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(currentResult.totalReturn)}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Win Rate
                  </Typography>
                  <Typography variant="h6">{currentResult.winRate.toFixed(1)}%</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentResult.winningTrades}/{currentResult.totalTrades} trades
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Max Drawdown
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatPercent(currentResult.maxDrawdown)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(currentResult.maxDrawdownAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h6">
                    {currentResult.sharpeRatio?.toFixed(2) || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Risk-adjusted
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Detailed Sections */}
            <Collapse in={showDetails}>
              <Box sx={{ mb: 3 }}>
                {currentResult.status === 'FAILED' && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    Backtest failed: {currentResult.errorMessage || 'Unknown error'}
                  </Alert>
                )}

                {/* Performance Metrics */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <PerformanceMetrics result={currentResult} />
                </Box>

                {/* Equity Curve */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Equity Curve
                  </Typography>
                  <EquityCurveChart data={currentResult.equityCurve} />
                </Box>

                {/* Trade Log */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Trade History
                  </Typography>
                  <TradeLogTable trades={currentResult.tradeHistory} />
                </Box>
              </Box>
            </Collapse>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default BacktestResults;
