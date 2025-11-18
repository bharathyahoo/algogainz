import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import dashboardService, { type PnLTrendData } from '../../services/dashboardService';

type Period = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const PnLTrendChart: React.FC = () => {
  const [period, setPeriod] = useState<Period>('1M');
  const [data, setData] = useState<PnLTrendData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const trendData = await dashboardService.getPnLTrend(period);
      setData(trendData);
    } catch (error) {
      console.error('Error loading P&L trend:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: Period | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  const formatXAxis = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (period === '1W' || period === '1M') {
        return format(date, 'MMM dd');
      } else if (period === '3M' || period === '6M') {
        return format(date, 'MMM dd');
      } else {
        return format(date, 'MMM yyyy');
      }
    } catch {
      return dateStr;
    }
  };

  const formatTooltip = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          P&L Trend
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
          aria-label="time period"
        >
          <ToggleButton value="1W">1W</ToggleButton>
          <ToggleButton value="1M">1M</ToggleButton>
          <ToggleButton value="3M">3M</ToggleButton>
          <ToggleButton value="6M">6M</ToggleButton>
          <ToggleButton value="1Y">1Y</ToggleButton>
          <ToggleButton value="ALL">ALL</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body2" color="text.secondary">
            No data available for this period
          </Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#666"
              style={{ fontSize: 12 }}
            />
            <YAxis tickFormatter={formatYAxis} stroke="#666" style={{ fontSize: 12 }} />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
              }}
              labelFormatter={(label) => formatXAxis(label as string)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="pnl"
              name="P&L"
              stroke="#1976d2"
              strokeWidth={2}
              dot={{ fill: '#1976d2', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

export default PnLTrendChart;
