import React, { useMemo } from 'react';
import { Paper, Box, Typography, useTheme, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { EquityCurvePoint } from '../../types';

interface EquityCurveChartProps {
  data: EquityCurvePoint[];
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ data }) => {
  const theme = useTheme();
  const [chartType, setChartType] = React.useState<'line' | 'area'>('area');

  // Transform data for chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: point.date,
      formattedDate: formatDate(point.date),
      portfolioValue: point.portfolioValue,
      cash: point.cash,
      position: point.position || 0,
    }));
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map((d) => d.portfolioValue);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const initialValue = values[0];
    const finalValue = values[values.length - 1];

    return {
      initial: initialValue,
      final: finalValue,
      max: maxValue,
      min: minValue,
      change: finalValue - initialValue,
      changePct: ((finalValue - initialValue) / initialValue) * 100,
    };
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0].payload;

    return (
      <Paper sx={{ p: 2, minWidth: 200 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {data.formattedDate}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <span>Portfolio Value:</span>
            <strong>{formatCurrency(data.portfolioValue)}</strong>
          </Typography>
          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <span>Cash:</span>
            <span>{formatCurrency(data.cash)}</span>
          </Typography>
          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Position:</span>
            <span>{formatCurrency(data.position)}</span>
          </Typography>
        </Box>
      </Paper>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No equity curve data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header with stats and controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Portfolio Performance Over Time
          </Typography>
          {stats && (
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Initial
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(stats.initial, 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Final
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(stats.final, 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Change
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={stats.change >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(stats.change, 0)} ({stats.changePct.toFixed(1)}%)
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Peak
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(stats.max, 0)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={(_, newType) => newType && setChartType(newType)}
          size="small"
        >
          <ToggleButton value="line">Line</ToggleButton>
          <ToggleButton value="area">Area</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="formattedDate"
              stroke={theme.palette.text.secondary}
              style={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              style={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 14 }} />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              name="Portfolio Value"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              fill="url(#colorPortfolio)"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="formattedDate"
              stroke={theme.palette.text.secondary}
              style={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              style={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 14 }} />
            <Line
              type="monotone"
              dataKey="portfolioValue"
              name="Portfolio Value"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cash"
              name="Cash"
              stroke={theme.palette.success.main}
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="position"
              name="Position Value"
              stroke={theme.palette.warning.main}
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Data points info */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        {data.length} data points from {formatDate(data[0].date)} to{' '}
        {formatDate(data[data.length - 1].date)}
      </Typography>
    </Paper>
  );
};

export default EquityCurveChart;
