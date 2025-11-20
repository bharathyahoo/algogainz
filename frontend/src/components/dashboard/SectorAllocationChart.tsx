import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Holding } from '../../types';

interface SectorAllocationChartProps {
  holdings: Holding[];
}

// Sector mapping for common Indian stocks
// This can be expanded or moved to a constants file
const SECTOR_MAP: Record<string, string> = {
  // Banking & Financial Services
  'HDFCBANK': 'Banking',
  'ICICIBANK': 'Banking',
  'SBIN': 'Banking',
  'KOTAKBANK': 'Banking',
  'AXISBANK': 'Banking',
  'INDUSINDBK': 'Banking',
  'BAJFINANCE': 'Financial Services',
  'BAJAJFINSV': 'Financial Services',
  'HDFCLIFE': 'Financial Services',
  'SBILIFE': 'Financial Services',

  // IT & Software
  'TCS': 'IT',
  'INFY': 'IT',
  'WIPRO': 'IT',
  'HCLTECH': 'IT',
  'TECHM': 'IT',
  'LTIM': 'IT',
  'LTTS': 'IT',
  'PERSISTENT': 'IT',

  // Oil & Gas
  'RELIANCE': 'Oil & Gas',
  'ONGC': 'Oil & Gas',
  'IOC': 'Oil & Gas',
  'BPCL': 'Oil & Gas',
  'GAIL': 'Oil & Gas',

  // Automobiles
  'MARUTI': 'Automobile',
  'M&M': 'Automobile',
  'TATAMOTORS': 'Automobile',
  'BAJAJ-AUTO': 'Automobile',
  'HEROMOTOCO': 'Automobile',
  'EICHERMOT': 'Automobile',
  'TVSMOTOR': 'Automobile',

  // FMCG
  'HINDUNILVR': 'FMCG',
  'ITC': 'FMCG',
  'NESTLEIND': 'FMCG',
  'BRITANNIA': 'FMCG',
  'DABUR': 'FMCG',
  'GODREJCP': 'FMCG',
  'MARICO': 'FMCG',

  // Pharma
  'SUNPHARMA': 'Pharma',
  'DRREDDY': 'Pharma',
  'CIPLA': 'Pharma',
  'DIVISLAB': 'Pharma',
  'BIOCON': 'Pharma',
  'AUROPHARMA': 'Pharma',
  'LUPIN': 'Pharma',

  // Metals & Mining
  'TATASTEEL': 'Metals',
  'JSWSTEEL': 'Metals',
  'HINDALCO': 'Metals',
  'VEDL': 'Metals',
  'COALINDIA': 'Metals',
  'NMDC': 'Metals',

  // Cement
  'ULTRACEMCO': 'Cement',
  'GRASIM': 'Cement',
  'SHREECEM': 'Cement',
  'AMBUJACEM': 'Cement',
  'ACC': 'Cement',

  // Telecom
  'BHARTIARTL': 'Telecom',
  'IDEA': 'Telecom',

  // Power
  'POWERGRID': 'Power',
  'NTPC': 'Power',
  'ADANIPOWER': 'Power',
  'TATAPOWER': 'Power',

  // Diversified
  'ADANIENT': 'Diversified',
  'LT': 'Engineering',
  'ASIANPAINT': 'Paints',
  'TITAN': 'Consumer Durables',
  'BAJAJHLDNG': 'Holding Company',
};

// Color palette for sectors
const SECTOR_COLORS: Record<string, string> = {
  'Banking': '#2196F3',
  'Financial Services': '#1976D2',
  'IT': '#4CAF50',
  'Oil & Gas': '#FF9800',
  'Automobile': '#F44336',
  'FMCG': '#9C27B0',
  'Pharma': '#00BCD4',
  'Metals': '#795548',
  'Cement': '#607D8B',
  'Telecom': '#E91E63',
  'Power': '#FFC107',
  'Diversified': '#673AB7',
  'Engineering': '#3F51B5',
  'Paints': '#009688',
  'Consumer Durables': '#8BC34A',
  'Holding Company': '#CDDC39',
  'Others': '#9E9E9E',
};

const SectorAllocationChart: React.FC<SectorAllocationChartProps> = ({ holdings }) => {
  const theme = useTheme();

  // Calculate sector-wise allocation
  const sectorData = React.useMemo(() => {
    const sectorMap = new Map<string, number>();

    holdings.forEach((holding) => {
      // Get sector from mapping, default to 'Others'
      const sector = SECTOR_MAP[holding.stockSymbol] || 'Others';

      // Use current value if available, otherwise use total invested
      const value = holding.currentValue || holding.totalInvested;

      // Add to sector total
      const current = sectorMap.get(sector) || 0;
      sectorMap.set(sector, current + value);
    });

    // Convert to array and sort by value
    const chartData = Array.from(sectorMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100, // Round to 2 decimals
        percentage: 0, // Will be calculated below
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate percentages
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    chartData.forEach((item) => {
      item.percentage = total > 0 ? (item.value / total) * 100 : 0;
    });

    return chartData;
  }, [holdings]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
            {data.percentage.toFixed(1)}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Custom label for pie slices
  const renderLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  if (holdings.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Sector Allocation
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No holdings to display sector allocation
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Sector Allocation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Portfolio distribution across sectors
      </Typography>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={sectorData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={renderLabel}
            labelLine={false}
          >
            {sectorData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SECTOR_COLORS[entry.name] || SECTOR_COLORS['Others']}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => {
              const data = sectorData.find((d) => d.name === value);
              return `${value} (${data?.percentage.toFixed(1)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Sector breakdown table */}
      <Box sx={{ mt: 2 }}>
        {sectorData.slice(0, 5).map((sector, index) => (
          <Box
            key={sector.name}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 0.75,
              borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: SECTOR_COLORS[sector.name] || SECTOR_COLORS['Others'],
                }}
              />
              <Typography variant="body2">{sector.name}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {sector.percentage.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ₹{sector.value.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Box>
        ))}
        {sectorData.length > 5 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            +{sectorData.length - 5} more sectors
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default SectorAllocationChart;
