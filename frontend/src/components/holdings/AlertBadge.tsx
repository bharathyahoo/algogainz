/**
 * AlertBadge Component
 * Shows alert indicator on holding cards
 */

import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';

interface AlertBadgeProps {
  type: 'PROFIT_TARGET' | 'STOP_LOSS';
  targetPercent: number;
  currentPrice: number;
  targetPrice: number;
  size?: 'small' | 'medium';
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  type,
  targetPercent,
  currentPrice,
  targetPrice,
  size = 'small',
}) => {
  const isProfitTarget = type === 'PROFIT_TARGET';

  const getTooltipText = () => {
    if (isProfitTarget) {
      return `Profit Target Reached! Target: ₹${targetPrice.toFixed(
        2
      )} (${targetPercent}%)`;
    }
    return `Stop Loss Hit! Stop Loss: ₹${targetPrice.toFixed(
      2
    )} (${targetPercent}%)`;
  };

  const getIcon = () => {
    if (isProfitTarget) {
      return <TrendingUpIcon sx={{ fontSize: size === 'small' ? 16 : 20 }} />;
    }
    return <TrendingDownIcon sx={{ fontSize: size === 'small' ? 16 : 20 }} />;
  };

  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 1,
              transform: 'scale(1)',
            },
            '50%': {
              opacity: 0.8,
              transform: 'scale(1.05)',
            },
          },
        }}
      >
        <Chip
          icon={getIcon()}
          label={isProfitTarget ? 'Target Reached' : 'Stop Loss'}
          color={isProfitTarget ? 'success' : 'error'}
          size={size}
          variant="filled"
          sx={{
            fontWeight: 'bold',
            boxShadow: 2,
          }}
        />
        <NotificationsActiveIcon
          sx={{
            ml: 0.5,
            fontSize: size === 'small' ? 18 : 22,
            color: isProfitTarget ? 'success.main' : 'error.main',
            animation: 'ring 1s ease-in-out infinite',
            '@keyframes ring': {
              '0%, 100%': { transform: 'rotate(0deg)' },
              '10%, 30%': { transform: 'rotate(-10deg)' },
              '20%, 40%': { transform: 'rotate(10deg)' },
            },
          }}
        />
      </Box>
    </Tooltip>
  );
};
