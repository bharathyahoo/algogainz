/**
 * Connection Status Indicator
 * Shows WebSocket connection status
 */

import React, { useEffect, useState } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import {
  CheckCircle as ConnectedIcon,
  Error as DisconnectedIcon,
  Sync as ConnectingIcon,
  Warning as ErrorIcon,
} from '@mui/icons-material';
import { websocketService, type ConnectionStatus } from '../../services/websocketService';

export const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(websocketService.getConnectionStatus());

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = websocketService.onConnectionStatus((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <ConnectedIcon fontSize="small" />,
          label: 'Live',
          color: 'success' as const,
          tooltip: 'Connected to real-time data',
        };
      case 'connecting':
        return {
          icon: <ConnectingIcon fontSize="small" className="rotating" />,
          label: 'Connecting',
          color: 'warning' as const,
          tooltip: 'Connecting to server...',
        };
      case 'disconnected':
        return {
          icon: <DisconnectedIcon fontSize="small" />,
          label: 'Offline',
          color: 'default' as const,
          tooltip: 'Not connected to real-time data',
        };
      case 'error':
        return {
          icon: <ErrorIcon fontSize="small" />,
          label: 'Error',
          color: 'error' as const,
          tooltip: 'Connection error',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box>
      <Tooltip title={config.tooltip} arrow>
        <Chip
          icon={config.icon}
          label={config.label}
          color={config.color}
          size="small"
          sx={{
            fontWeight: 600,
            '& .rotating': {
              animation: 'rotate 2s linear infinite',
            },
            '@keyframes rotate': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Tooltip>
    </Box>
  );
};
