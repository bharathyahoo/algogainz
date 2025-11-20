/**
 * PriceDisplay Component
 * Displays stock price with real-time updates, color coding, and animations
 */

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  TrendingUp as UpArrowIcon,
  TrendingDown as DownArrowIcon,
  Remove as NeutralIcon,
} from '@mui/icons-material';

interface PriceDisplayProps {
  price: number;
  change?: number;
  changePercent?: number;
  showArrow?: boolean;
  showPercentage?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  animate?: boolean;
  currency?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  change = 0,
  changePercent = 0,
  showArrow = true,
  showPercentage: _showPercentage = true, // Reserved for future use
  fontSize = 'medium',
  animate = true,
  currency = '₹',
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevPriceRef = useRef(price);

  // Detect price changes and trigger flash animation
  useEffect(() => {
    if (animate && price !== prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 600);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = price;
  }, [price, animate]);

  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;

  const getColor = () => {
    if (isPositive) return 'success.main';
    if (isNegative) return 'error.main';
    return 'text.secondary';
  };

  const getBgColor = () => {
    if (isPositive) return 'success.light';
    if (isNegative) return 'error.light';
    return 'grey.100';
  };

  const getIcon = () => {
    if (isPositive) return <UpArrowIcon fontSize="small" />;
    if (isNegative) return <DownArrowIcon fontSize="small" />;
    return <NeutralIcon fontSize="small" />;
  };

  const getFontSize = () => {
    switch (fontSize) {
      case 'small':
        return { price: 'body2', change: 'caption' };
      case 'large':
        return { price: 'h5', change: 'body2' };
      default:
        return { price: 'body1', change: 'body2' };
    }
  };

  const fontSizes = getFontSize();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        position: 'relative',
        transition: 'all 0.3s ease',
        ...(isFlashing && {
          animation: 'flash 0.6s ease-in-out',
        }),
        '@keyframes flash': {
          '0%, 100%': {
            backgroundColor: 'transparent',
          },
          '50%': {
            backgroundColor: isPositive
              ? 'rgba(76, 175, 80, 0.2)'
              : isNegative
              ? 'rgba(244, 67, 54, 0.2)'
              : 'rgba(158, 158, 158, 0.2)',
          },
        },
      }}
    >
      {/* Price */}
      <Typography
        variant={fontSizes.price as any}
        fontWeight="600"
        sx={{
          color: 'text.primary',
          transition: 'color 0.3s ease',
        }}
      >
        {currency}
        {price.toFixed(2)}
      </Typography>

      {/* Change Indicator */}
      {(change !== 0 || changePercent !== 0) && (
        <Chip
          icon={showArrow ? getIcon() : undefined}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant={fontSizes.change as any} fontWeight="600">
                {changePercent >= 0 ? '+' : ''}
                {changePercent.toFixed(2)}%
              </Typography>
              {change !== 0 && (
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, display: { xs: 'none', sm: 'inline' } }}
                >
                  ({change >= 0 ? '+' : ''}
                  {currency}
                  {Math.abs(change).toFixed(2)})
                </Typography>
              )}
            </Box>
          }
          size="small"
          sx={{
            backgroundColor: getBgColor(),
            color: getColor(),
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: getColor(),
            },
            transition: 'all 0.3s ease',
          }}
        />
      )}
    </Box>
  );
};

/**
 * Compact Price Display for tables/lists
 */
interface CompactPriceDisplayProps {
  price: number;
  changePercent?: number;
  animate?: boolean;
}

export const CompactPriceDisplay: React.FC<CompactPriceDisplayProps> = ({
  price,
  changePercent = 0,
  animate = true,
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (animate && price !== prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 600);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = price;
  }, [price, animate]);

  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        transition: 'all 0.3s ease',
        ...(isFlashing && {
          animation: 'flash 0.6s ease-in-out',
        }),
        '@keyframes flash': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': {
            backgroundColor: isPositive
              ? 'rgba(76, 175, 80, 0.2)'
              : isNegative
              ? 'rgba(244, 67, 54, 0.2)'
              : 'transparent',
          },
        },
      }}
    >
      <Typography variant="body2" fontWeight="600">
        ₹{price.toFixed(2)}
      </Typography>
      {changePercent !== 0 && (
        <Typography
          variant="caption"
          sx={{
            color: isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.secondary',
            fontWeight: 600,
          }}
        >
          {changePercent >= 0 ? '+' : ''}
          {changePercent.toFixed(2)}%
        </Typography>
      )}
    </Box>
  );
};
