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
  Delete,
  Edit,
  ShowChart,
} from '@mui/icons-material';
import { PriceDisplay } from '../common/PriceDisplay';
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

        {/* Price Info - Real-time updates */}
        <Box sx={{ mb: 2 }}>
          {stock.currentPrice ? (
            <PriceDisplay
              price={stock.currentPrice}
              change={stock.dayChange}
              changePercent={stock.dayChangePct || 0}
              fontSize="large"
              animate={true}
            />
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
