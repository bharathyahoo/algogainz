import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface WinLossChartProps {
  totalTrades: number;
  winRate: number;
}

const WinLossChart: React.FC<WinLossChartProps> = ({ totalTrades, winRate }) => {
  const winningTrades = Math.round((totalTrades * winRate) / 100);
  const losingTrades = totalTrades - winningTrades;

  const data = [
    { name: 'Winning', count: winningTrades, percentage: winRate },
    { name: 'Losing', count: losingTrades, percentage: 100 - winRate },
  ];

  const COLORS = {
    Winning: '#4caf50',
    Losing: '#f44336',
  };

  const formatTooltip = (value: number, name: string, entry: any) => {
    return [`${value} trades (${entry.payload.percentage.toFixed(1)}%)`, name];
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Win/Loss Ratio
      </Typography>

      {totalTrades === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body2" color="text.secondary">
            No completed trades yet
          </Typography>
        </Box>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" style={{ fontSize: 12 }} />
              <YAxis stroke="#666" style={{ fontSize: 12 }} />
              <Tooltip
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <Box sx={{ display: 'flex', gap: 3, mt: 2, justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ color: 'success.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Winning Trades
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {winningTrades} ({winRate.toFixed(1)}%)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDown sx={{ color: 'error.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Losing Trades
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {losingTrades} ({(100 - winRate).toFixed(1)}%)
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default WinLossChart;
