import React from 'react';
import { Grid, Paper, Typography, Box, Tooltip } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import type { BacktestResult } from '../../types';

interface PerformanceMetricsProps {
  result: BacktestResult;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color = 'primary',
  icon,
  tooltip,
}) => {
  const content = (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {icon && (
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        )}
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: color !== 'primary' ? `${color}.main` : 'text.primary',
          mb: subtitle ? 0.5 : 0,
        }}
      >
        {value}
      </Typography>

      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  if (tooltip) {
    return <Tooltip title={tooltip}>{content}</Tooltip>;
  }

  return content;
};

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ result }) => {
  const getReturnColor = (value: number) => {
    if (value > 0) return 'success';
    if (value < 0) return 'error';
    return 'primary';
  };

  return (
    <Grid container spacing={2}>
      {/* Row 1: Overall Performance */}
      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Final Capital"
          value={formatCurrency(result.finalCapital, 0)}
          subtitle={`Started with ${formatCurrency(result.initialCapital, 0)}`}
          color="info"
          icon={<AccountBalanceIcon fontSize="small" />}
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Total Return"
          value={formatCurrency(result.totalReturn, 0)}
          subtitle={formatPercent(result.totalReturnPct)}
          color={getReturnColor(result.totalReturnPct)}
          icon={
            result.totalReturn >= 0 ? (
              <TrendingUpIcon fontSize="small" />
            ) : (
              <TrendingDownIcon fontSize="small" />
            )
          }
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Total Trades"
          value={result.totalTrades}
          subtitle={`${result.winningTrades} wins, ${result.losingTrades} losses`}
          icon={<TimelineIcon fontSize="small" />}
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Win Rate"
          value={`${result.winRate.toFixed(1)}%`}
          subtitle={`${result.winningTrades}/${result.totalTrades} profitable`}
          color={result.winRate >= 50 ? 'success' : 'warning'}
          icon={<BarChartIcon fontSize="small" />}
        />
      </Grid>

      {/* Row 2: Profitability Metrics */}
      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Avg Profit/Trade"
          value={formatCurrency(result.avgProfitPerTrade)}
          tooltip="Average profit from winning trades"
          color="success"
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Avg Loss/Trade"
          value={formatCurrency(result.avgLossPerTrade)}
          tooltip="Average loss from losing trades"
          color="error"
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Profit Factor"
          value={result.profitFactor.toFixed(2)}
          subtitle={result.profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
          color={result.profitFactor > 1 ? 'success' : 'error'}
          tooltip="Gross profit divided by gross loss"
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Largest Win"
          value={formatCurrency(result.largestWin)}
          color="success"
        />
      </Grid>

      {/* Row 3: Risk Metrics */}
      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Largest Loss"
          value={formatCurrency(result.largestLoss)}
          color="error"
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Max Drawdown"
          value={formatPercent(result.maxDrawdown)}
          subtitle={formatCurrency(result.maxDrawdownAmount)}
          color="error"
          tooltip="Maximum peak-to-trough decline"
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Sharpe Ratio"
          value={result.sharpeRatio?.toFixed(2) || 'N/A'}
          subtitle="Risk-adjusted return"
          color={
            result.sharpeRatio && result.sharpeRatio > 1
              ? 'success'
              : result.sharpeRatio && result.sharpeRatio > 0
              ? 'warning'
              : 'error'
          }
          icon={<ShowChartIcon fontSize="small" />}
          tooltip="Higher is better (>1 is good, >2 is excellent)"
        />
      </Grid>

      <Grid item xs={6} sm={4} md={3}>
        <MetricCard
          title="Avg Trade Duration"
          value={
            result.avgTradeDuration
              ? `${result.avgTradeDuration.toFixed(1)} days`
              : 'N/A'
          }
          tooltip="Average holding period per trade"
        />
      </Grid>

      {/* Additional Info */}
      {result.executionTime && (
        <Grid item xs={12}>
          <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Backtest executed in {(result.executionTime / 1000).toFixed(2)} seconds •
              Status: <strong>{result.status}</strong>
              {result.createdAt && ` • Created ${new Date(result.createdAt).toLocaleString()}`}
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default PerformanceMetrics;
