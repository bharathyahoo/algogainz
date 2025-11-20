/**
 * AlertNotification Component
 * Displays individual alert with action buttons
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Chip,
  Stack,
  Alert as MuiAlert,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Alert } from '../../services/websocketService';

interface AlertNotificationProps {
  alert: Alert;
  onDismiss: (holdingId: string, type: 'PROFIT_TARGET' | 'STOP_LOSS') => void;
  onQuickSell?: (alert: Alert) => void;
}

export const AlertNotification: React.FC<AlertNotificationProps> = ({
  alert,
  onDismiss,
  onQuickSell,
}) => {
  const isProfitTarget = alert.type === 'PROFIT_TARGET';
  const isProfit = alert.unrealizedPnL > 0;

  const getAlertColor = () => {
    if (isProfitTarget) {
      return 'success';
    }
    return 'error';
  };

  const getAlertIcon = () => {
    if (isProfitTarget) {
      return <TrendingUpIcon />;
    }
    return <TrendingDownIcon />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Card
      sx={{
        mb: 2,
        border: (theme) =>
          `2px solid ${
            isProfitTarget
              ? theme.palette.success.main
              : theme.palette.error.main
          }`,
        boxShadow: 3,
        animation: 'pulse 2s ease-in-out infinite',
        '@keyframes pulse': {
          '0%, 100%': {
            boxShadow: 3,
          },
          '50%': {
            boxShadow: (theme) =>
              `0 0 20px ${
                isProfitTarget
                  ? theme.palette.success.main
                  : theme.palette.error.main
              }`,
          },
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            {/* Alert Header */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {getAlertIcon()}
              <Typography variant="h6" component="div">
                {alert.companyName}
              </Typography>
              <Chip
                label={alert.stockSymbol}
                size="small"
                variant="outlined"
              />
              <Chip
                label={isProfitTarget ? 'Profit Target' : 'Stop Loss'}
                color={getAlertColor()}
                size="small"
              />
            </Box>

            {/* Alert Message */}
            <MuiAlert severity={getAlertColor()} sx={{ mb: 2 }}>
              {alert.message}
            </MuiAlert>

            {/* Price Details */}
            <Stack spacing={1} mb={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Current Price:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(alert.currentPrice)}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Target Price:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(alert.targetPrice)}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Avg Buy Price:
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(alert.avgBuyPrice)}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Quantity:
                </Typography>
                <Typography variant="body2">{alert.quantity}</Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Unrealized P&L:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={isProfit ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(alert.unrealizedPnL)} (
                  {formatPercent(alert.unrealizedPnLPct)})
                </Typography>
              </Box>
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
              {onQuickSell && (
                <Button
                  variant="contained"
                  color={isProfitTarget ? 'success' : 'error'}
                  size="small"
                  onClick={() => onQuickSell(alert)}
                  startIcon={<CheckCircleIcon />}
                >
                  Quick Sell
                </Button>
              )}

              <Button
                variant="outlined"
                size="small"
                onClick={() => onDismiss(alert.holdingId, alert.type)}
              >
                Dismiss
              </Button>
            </Stack>
          </Box>

          {/* Close Button */}
          <IconButton
            size="small"
            onClick={() => onDismiss(alert.holdingId, alert.type)}
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};
