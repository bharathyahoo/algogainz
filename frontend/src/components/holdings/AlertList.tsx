/**
 * AlertList Component
 * Displays all active alerts with sound and visual indicators
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Badge,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { Alert } from '../../services/websocketService';
import { AlertNotification } from './AlertNotification';

interface AlertListProps {
  alerts: Alert[];
  onDismiss: (holdingId: string, type: 'PROFIT_TARGET' | 'STOP_LOSS') => void;
  onQuickSell?: (alert: Alert) => void;
}

export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  onDismiss,
  onQuickSell,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [prevAlertCount, setPrevAlertCount] = useState(0);

  // Auto-expand when new alerts arrive
  useEffect(() => {
    if (alerts.length > prevAlertCount) {
      setIsExpanded(true);

      // Play notification sound (optional)
      if (alerts.length > 0) {
        playNotificationSound();
      }
    }
    setPrevAlertCount(alerts.length);
  }, [alerts.length, prevAlertCount]);

  const playNotificationSound = () => {
    // Browser notification sound (optional)
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.warn('Could not play notification sound:', err);
      });
    } catch (error) {
      // Silently fail if audio is not available
    }
  };

  if (alerts.length === 0) {
    return null; // Don't show anything if no alerts
  }

  const profitTargetAlerts = alerts.filter((a) => a.type === 'PROFIT_TARGET');
  const stopLossAlerts = alerts.filter((a) => a.type === 'STOP_LOSS');

  return (
    <Paper
      elevation={6}
      sx={{
        mb: 3,
        border: (theme) => `2px solid ${theme.palette.warning.main}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Alert Header */}
      <Box
        sx={{
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Badge badgeContent={alerts.length} color="error">
            <NotificationsActiveIcon
              sx={{
                animation: 'ring 1s ease-in-out infinite',
                '@keyframes ring': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '10%, 30%': { transform: 'rotate(-10deg)' },
                  '20%, 40%': { transform: 'rotate(10deg)' },
                },
              }}
            />
          </Badge>

          <Box>
            <Typography variant="h6" fontWeight="bold">
              Active Alerts ({alerts.length})
            </Typography>
            <Typography variant="body2">
              {profitTargetAlerts.length} Profit Target
              {profitTargetAlerts.length !== 1 ? 's' : ''} |{' '}
              {stopLossAlerts.length} Stop Loss
              {stopLossAlerts.length !== 1 ? 'es' : ''}
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          sx={{ color: 'warning.contrastText' }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Alert Content */}
      <Collapse in={isExpanded}>
        <Box p={2}>
          {/* Profit Target Alerts */}
          {profitTargetAlerts.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" color="success.main" mb={2}>
                🎯 Profit Targets Reached ({profitTargetAlerts.length})
              </Typography>
              {profitTargetAlerts.map((alert) => (
                <AlertNotification
                  key={`${alert.holdingId}-${alert.type}`}
                  alert={alert}
                  onDismiss={onDismiss}
                  onQuickSell={onQuickSell}
                />
              ))}
            </Box>
          )}

          {/* Divider if both types exist */}
          {profitTargetAlerts.length > 0 && stopLossAlerts.length > 0 && (
            <Divider sx={{ my: 2 }} />
          )}

          {/* Stop Loss Alerts */}
          {stopLossAlerts.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" color="error.main" mb={2}>
                🛑 Stop Loss Triggered ({stopLossAlerts.length})
              </Typography>
              {stopLossAlerts.map((alert) => (
                <AlertNotification
                  key={`${alert.holdingId}-${alert.type}`}
                  alert={alert}
                  onDismiss={onDismiss}
                  onQuickSell={onQuickSell}
                />
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
