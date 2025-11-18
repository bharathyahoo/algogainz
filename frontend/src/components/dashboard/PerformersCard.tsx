import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { type StockPerformance } from '../../services/dashboardService';

interface PerformersCardProps {
  topPerformers: StockPerformance[];
  worstPerformers: StockPerformance[];
}

const PerformersCard: React.FC<PerformersCardProps> = ({ topPerformers, worstPerformers }) => {
  const [tab, setTab] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}₹${pnl.toFixed(2)}`;
  };

  const renderPerformersList = (performers: StockPerformance[]) => {
    if (performers.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {performers.map((stock, index) => {
          const isProfit = stock.totalPnL > 0;
          return (
            <ListItem
              key={stock.symbol}
              sx={{
                borderBottom: index < performers.length - 1 ? '1px solid #f0f0f0' : 'none',
                py: 2,
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {stock.symbol}
                    </Typography>
                    <Chip
                      icon={isProfit ? <TrendingUp /> : <TrendingDown />}
                      label={formatPnL(stock.totalPnL)}
                      size="small"
                      color={isProfit ? 'success' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {stock.companyName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Realized: ₹{stock.realizedPnL.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Unrealized: ₹{stock.unrealizedPnL.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Stock Performance
      </Typography>

      <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUp fontSize="small" />
              Top Performers
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDown fontSize="small" />
              Worst Performers
            </Box>
          }
        />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tab === 0 && renderPerformersList(topPerformers)}
        {tab === 1 && renderPerformersList(worstPerformers)}
      </Box>
    </Paper>
  );
};

export default PerformersCard;
