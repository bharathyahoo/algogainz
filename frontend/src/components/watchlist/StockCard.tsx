import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Delete,
  Edit,
  ShowChart,
} from '@mui/icons-material';
import type { WatchlistStock } from '../../types';

interface StockCardProps {
  stock: WatchlistStock;
  onRemove?: (id: string) => void;
  onEdit?: (stock: WatchlistStock) => void;
  onAnalyze?: (stock: WatchlistStock) => void;
}

const StockCard: React.FC<StockCardProps> = ({
  stock,
  onRemove,
  onEdit,
  onAnalyze,
}) => {
  const isPositive = (stock.dayChangePct || 0) >= 0;
  const priceColor = isPositive ? 'success.main' : 'error.main';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {stock.stockSymbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {stock.companyName}
            </Typography>
          </Box>
          <Chip
            label={stock.exchange}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Price Info */}
        <Box sx={{ mb: 2 }}>
          {stock.currentPrice ? (
            <>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ₹{stock.currentPrice.toFixed(2)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendIcon sx={{ color: priceColor, fontSize: 20 }} />
                <Typography
                  variant="body1"
                  sx={{ color: priceColor, fontWeight: 600 }}
                >
                  {stock.dayChange?.toFixed(2) || '0.00'} ({stock.dayChangePct?.toFixed(2) || '0.00'}%)
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading price...
            </Typography>
          )}
        </Box>

        {/* Categories */}
        {stock.categories && stock.categories.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {stock.categories.map((category, index) => (
                <Chip
                  key={index}
                  label={category}
                  size="small"
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 2 }}>
          {onAnalyze && (
            <Tooltip title="Technical Analysis">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onAnalyze(stock)}
              >
                <ShowChart />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Edit Categories">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit(stock)}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}
          {onRemove && (
            <Tooltip title="Remove from Watchlist">
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemove(stock.id)}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockCard;
