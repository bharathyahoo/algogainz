/**
 * Market Status Banner
 * Shows current market status (Open/Closed/Pre-market/Post-market)
 */

import React, { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import {
  TrendingUp as MarketOpenIcon,
  AccessTime as PreMarketIcon,
  Close as MarketClosedIcon,
} from '@mui/icons-material';
import { websocketService, type MarketStatus } from '../../services/websocketService';

export const MarketStatusBanner: React.FC = () => {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  useEffect(() => {
    // Subscribe to market status updates
    const unsubscribe = websocketService.onMarketStatus((data) => {
      console.log('[MarketStatusBanner] Received market status:', data);
      setMarketStatus(data.status);
      // Message will come from backend in future updates
    });

    return unsubscribe;
  }, []);

  console.log('[MarketStatusBanner] Current marketStatus state:', marketStatus);

  if (!marketStatus) {
    console.log('[MarketStatusBanner] Not rendering - marketStatus is null');
    return null;
  }

  const getStatusConfig = () => {
    switch (marketStatus) {
      case 'OPEN':
        return {
          icon: <MarketOpenIcon />,
          severity: 'success' as const,
          message: '🟢 Market is OPEN - Live trading in progress',
        };
      case 'PRE_MARKET':
        return {
          icon: <PreMarketIcon />,
          severity: 'info' as const,
          message: '🔵 Pre-Market Session - Market opens at 9:15 AM IST',
        };
      case 'POST_MARKET':
        return {
          icon: <PreMarketIcon />,
          severity: 'info' as const,
          message: '🔵 Post-Market Session - Limited trading',
        };
      case 'CLOSED':
        return {
          icon: <MarketClosedIcon />,
          severity: 'warning' as const,
          message: '🔴 Market is CLOSED - No live trading',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity={config.severity}
        icon={config.icon}
        sx={{
          borderRadius: 2,
          fontWeight: 600,
        }}
      >
        <Typography variant="body2" fontWeight="600">
          {config.message}
        </Typography>
      </Alert>
    </Box>
  );
};
