import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ShowChart,
} from '@mui/icons-material';

interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema20: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
  stochastic: {
    k: number;
    d: number;
  };
  volume: {
    current: number;
    average: number;
  };
}

interface TechnicalIndicatorsPanelProps {
  indicators: TechnicalIndicators;
  currentPrice: number;
}

const TechnicalIndicatorsPanel: React.FC<TechnicalIndicatorsPanelProps> = ({
  indicators,
  currentPrice,
}) => {
  const getRSISignal = (rsi: number) => {
    if (rsi < 30) return { text: 'Oversold', color: 'success', icon: TrendingUp };
    if (rsi > 70) return { text: 'Overbought', color: 'error', icon: TrendingDown };
    return { text: 'Neutral', color: 'default', icon: TrendingFlat };
  };

  const getMACDSignal = (macd: number, signal: number) => {
    if (macd > signal) return { text: 'Bullish', color: 'success', icon: TrendingUp };
    if (macd < signal) return { text: 'Bearish', color: 'error', icon: TrendingDown };
    return { text: 'Neutral', color: 'default', icon: TrendingFlat };
  };

  const getStochasticSignal = (k: number) => {
    if (k < 20) return { text: 'Oversold', color: 'success', icon: TrendingUp };
    if (k > 80) return { text: 'Overbought', color: 'error', icon: TrendingDown };
    return { text: 'Neutral', color: 'default', icon: TrendingFlat };
  };

  const rsiSignal = getRSISignal(indicators.rsi);
  const macdSignal = getMACDSignal(indicators.macd.macd, indicators.macd.signal);
  const stochSignal = getStochasticSignal(indicators.stochastic.k);
  const volumeRatio = indicators.volume.current / indicators.volume.average;

  const IndicatorRow = ({
    label,
    value,
    signal,
  }: {
    label: string;
    value: string | number;
    signal?: { text: string; color: any; icon: any };
  }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        {signal && (
          <Chip
            label={signal.text}
            size="small"
            color={signal.color}
            icon={<signal.icon fontSize="small" />}
            variant="outlined"
            sx={{ height: 24 }}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ShowChart color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Technical Indicators
        </Typography>
      </Box>

      <Stack spacing={2} divider={<Divider />}>
        {/* RSI Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
            Momentum Indicators
          </Typography>
          <IndicatorRow
            label="RSI (14)"
            value={indicators.rsi.toFixed(2)}
            signal={rsiSignal}
          />
          <IndicatorRow
            label="Stochastic K"
            value={indicators.stochastic.k.toFixed(2)}
            signal={stochSignal}
          />
          <IndicatorRow
            label="Stochastic D"
            value={indicators.stochastic.d.toFixed(2)}
          />
        </Box>

        {/* MACD Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
            MACD (12, 26, 9)
          </Typography>
          <IndicatorRow
            label="MACD Line"
            value={indicators.macd.macd.toFixed(4)}
            signal={macdSignal}
          />
          <IndicatorRow
            label="Signal Line"
            value={indicators.macd.signal.toFixed(4)}
          />
          <IndicatorRow
            label="Histogram"
            value={indicators.macd.histogram.toFixed(4)}
          />
        </Box>

        {/* Moving Averages */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
            Moving Averages
          </Typography>
          <IndicatorRow
            label="SMA 20"
            value={`₹${indicators.movingAverages.sma20.toFixed(2)}`}
            signal={
              currentPrice > indicators.movingAverages.sma20
                ? { text: 'Above', color: 'success', icon: TrendingUp }
                : { text: 'Below', color: 'error', icon: TrendingDown }
            }
          />
          <IndicatorRow
            label="SMA 50"
            value={`₹${indicators.movingAverages.sma50.toFixed(2)}`}
            signal={
              currentPrice > indicators.movingAverages.sma50
                ? { text: 'Above', color: 'success', icon: TrendingUp }
                : { text: 'Below', color: 'error', icon: TrendingDown }
            }
          />
          <IndicatorRow
            label="SMA 200"
            value={`₹${indicators.movingAverages.sma200.toFixed(2)}`}
            signal={
              currentPrice > indicators.movingAverages.sma200
                ? { text: 'Above', color: 'success', icon: TrendingUp }
                : { text: 'Below', color: 'error', icon: TrendingDown }
            }
          />
          <IndicatorRow
            label="EMA 20"
            value={`₹${indicators.movingAverages.ema20.toFixed(2)}`}
          />
        </Box>

        {/* Bollinger Bands */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
            Bollinger Bands (20, 2)
          </Typography>
          <IndicatorRow label="Upper Band" value={`₹${indicators.bollingerBands.upper.toFixed(2)}`} />
          <IndicatorRow label="Middle Band" value={`₹${indicators.bollingerBands.middle.toFixed(2)}`} />
          <IndicatorRow label="Lower Band" value={`₹${indicators.bollingerBands.lower.toFixed(2)}`} />
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current Price Position:{' '}
              {((currentPrice - indicators.bollingerBands.lower) /
                (indicators.bollingerBands.upper - indicators.bollingerBands.lower) *
                100
              ).toFixed(1)}
              % of band width
            </Typography>
          </Box>
        </Box>

        {/* Volatility & Volume */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
            Volatility & Volume
          </Typography>
          <IndicatorRow
            label="ATR (14)"
            value={indicators.atr.toFixed(2)}
          />
          <IndicatorRow
            label="Volume vs Avg"
            value={`${(volumeRatio * 100).toFixed(0)}%`}
            signal={
              volumeRatio > 1.5
                ? { text: 'High', color: 'success', icon: TrendingUp }
                : volumeRatio < 0.7
                ? { text: 'Low', color: 'error', icon: TrendingDown }
                : { text: 'Normal', color: 'default', icon: TrendingFlat }
            }
          />
          <IndicatorRow
            label="Current Volume"
            value={indicators.volume.current.toLocaleString()}
          />
          <IndicatorRow
            label="Avg Volume"
            value={indicators.volume.average.toFixed(0).toLocaleString()}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

export default TechnicalIndicatorsPanel;
