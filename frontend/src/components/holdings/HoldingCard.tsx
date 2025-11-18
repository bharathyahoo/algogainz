import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  CardActionArea,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  DeleteOutline,
  Sell,
  Receipt,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Holding } from '../../services/holdingsService';

interface HoldingCardProps {
  holding: Holding;
  onSetExitStrategy: (holding: Holding) => void;
  onSell: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
}

const HoldingCard: React.FC<HoldingCardProps> = ({ holding, onSetExitStrategy, onSell, onDelete }) => {
  const navigate = useNavigate();
  const hasExitStrategy = !!holding.exitStrategy;
  const isProfit = (holding.unrealizedPnL || 0) >= 0;
  const currentPrice = holding.currentPrice || holding.avgBuyPrice;
  const hasDayChange = holding.dayChange !== null && holding.dayChange !== undefined;
  const dayChangeIsPositive = (holding.dayChange || 0) >= 0;

  const handleViewTransactions = (e: React.MouseEvent) => {
    // Navigate to transactions page with pre-filtered symbol
    navigate(`/transactions?symbol=${holding.stockSymbol}`);
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      {/* Clickable area for drill-down */}
      <CardActionArea onClick={handleViewTransactions}>
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Tooltip title="View transactions">
            <IconButton size="small" sx={{ bgcolor: 'background.paper' }}>
              <Receipt fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActionArea>

      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {holding.stockSymbol}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {holding.companyName}
            </Typography>
          </Box>
          {onDelete && (
            <Tooltip title="Delete holding">
              <IconButton size="small" onClick={() => onDelete(holding)} color="error">
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Price Info */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Current Price
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ₹{currentPrice.toFixed(2)}
              </Typography>
              {/* Day's Change */}
              {hasDayChange && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                  {dayChangeIsPositive ? (
                    <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: dayChangeIsPositive ? 'success.main' : 'error.main',
                      fontWeight: 600,
                    }}
                  >
                    {dayChangeIsPositive ? '+' : ''}₹{(holding.dayChange || 0).toFixed(2)} (
                    {dayChangeIsPositive ? '+' : ''}
                    {(holding.dayChangePct || 0).toFixed(2)}%)
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Avg Buy Price
            </Typography>
            <Typography variant="body2">₹{holding.avgBuyPrice.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body2">{holding.quantity}</Typography>
          </Box>
        </Box>

        {/* P&L */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: isProfit ? 'success.50' : 'error.50',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isProfit ? (
                <TrendingUp color="success" fontSize="small" />
              ) : (
                <TrendingDown color="error" fontSize="small" />
              )}
              <Typography variant="body2" color="text.secondary">
                Unrealized P&L
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: isProfit ? 'success.main' : 'error.main',
                }}
              >
                ₹{(holding.unrealizedPnL || 0).toFixed(2)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isProfit ? 'success.main' : 'error.main',
                }}
              >
                ({(holding.unrealizedPnLPct || 0).toFixed(2)}%)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Exit Strategy Status */}
        {hasExitStrategy && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {holding.exitStrategy?.profitTargetPct && (
                <Chip
                  label={`Target: ${holding.exitStrategy.profitTargetPct}%`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {holding.exitStrategy?.stopLossPct && (
                <Chip
                  label={`Stop: ${holding.exitStrategy.stopLossPct}%`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </Stack>
            {holding.exitStrategy?.profitAlertTriggered && (
              <Chip
                label="🎯 Profit Target Hit!"
                size="small"
                color="success"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
            {holding.exitStrategy?.stopLossAlertTriggered && (
              <Chip
                label="⚠️ Stop Loss Hit!"
                size="small"
                color="error"
                sx={{ mb: 1 }}
              />
            )}
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Sell />}
            onClick={(e) => {
              e.stopPropagation();
              onSell(holding);
            }}
            sx={{ flex: 1 }}
          >
            Sell
          </Button>
          <Button
            variant={hasExitStrategy ? 'outlined' : 'contained'}
            startIcon={<ShowChart />}
            onClick={(e) => {
              e.stopPropagation();
              onSetExitStrategy(holding);
            }}
            sx={{ flex: 1 }}
          >
            {hasExitStrategy ? 'Edit' : 'Set'} Exit
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default HoldingCard;
