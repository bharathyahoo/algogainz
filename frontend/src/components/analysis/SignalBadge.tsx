import React from 'react';
import { Chip } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  RemoveCircleOutline,
  AddCircleOutline,
} from '@mui/icons-material';

export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

interface SignalBadgeProps {
  signal: SignalType;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

const SignalBadge: React.FC<SignalBadgeProps> = ({
  signal,
  size = 'medium',
  showIcon = true,
}) => {
  const getSignalConfig = () => {
    switch (signal) {
      case 'STRONG_BUY':
        return {
          label: 'Strong Buy',
          color: '#00C853' as const,
          bgColor: '#E8F5E9',
          icon: AddCircleOutline,
        };
      case 'BUY':
        return {
          label: 'Buy',
          color: '#4CAF50' as const,
          bgColor: '#F1F8E9',
          icon: TrendingUp,
        };
      case 'HOLD':
        return {
          label: 'Hold',
          color: '#FF9800' as const,
          bgColor: '#FFF3E0',
          icon: TrendingFlat,
        };
      case 'SELL':
        return {
          label: 'Sell',
          color: '#F44336' as const,
          bgColor: '#FFEBEE',
          icon: TrendingDown,
        };
      case 'STRONG_SELL':
        return {
          label: 'Strong Sell',
          color: '#D32F2F' as const,
          bgColor: '#FFCDD2',
          icon: RemoveCircleOutline,
        };
      default:
        return {
          label: 'Unknown',
          color: '#9E9E9E' as const,
          bgColor: '#F5F5F5',
          icon: TrendingFlat,
        };
    }
  };

  const config = getSignalConfig();
  const Icon = config.icon;

  return (
    <Chip
      label={config.label}
      icon={showIcon ? <Icon sx={{ color: `${config.color} !important` }} /> : undefined}
      size={size}
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 700,
        borderRadius: size === 'small' ? 1 : 1.5,
        px: size === 'small' ? 0.5 : 1,
        '& .MuiChip-icon': {
          color: config.color,
        },
      }}
    />
  );
};

export default SignalBadge;
