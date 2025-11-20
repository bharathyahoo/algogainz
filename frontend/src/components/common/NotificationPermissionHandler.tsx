/**
 * NotificationPermissionHandler Component
 * Handles notification permission requests and displays prompts
 */

import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { notificationService } from '../../services/notificationService';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

export const NotificationPermissionHandler: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only request permission for authenticated users
    if (!isAuthenticated) {
      return;
    }

    // Check if we should show the prompt
    const shouldPrompt = checkShouldPrompt();
    if (shouldPrompt) {
      // Show prompt after a short delay (don't interrupt login flow)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    // Update permission status
    setPermissionStatus(notificationService.getPermissionStatus());
  }, [isAuthenticated]);

  const checkShouldPrompt = (): boolean => {
    // Don't prompt if notifications are not supported
    if (!notificationService.isSupported()) {
      return false;
    }

    // Don't prompt if already granted or denied
    const currentStatus = notificationService.getPermissionStatus();
    if (currentStatus !== 'default') {
      return false;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('algogainz_notification_prompt_dismissed');
    if (dismissed === 'true') {
      return false;
    }

    return true;
  };

  const handleEnableNotifications = async () => {
    const permission = await notificationService.requestPermission();
    setPermissionStatus(permission);

    if (permission === 'granted') {
      // Show a test notification
      setTimeout(() => {
        notificationService.showTestNotification();
      }, 500);
    }

    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Remember that user dismissed the prompt
    localStorage.setItem('algogainz_notification_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || !isAuthenticated) {
    return null;
  }

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity="info"
        icon={<NotificationsIcon />}
        sx={{
          minWidth: 400,
          boxShadow: 4,
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleDismiss}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Not Now
            </Button>
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={handleEnableNotifications}
              startIcon={<NotificationsIcon />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Enable
            </Button>
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Enable Notifications
          </Typography>
          <Typography variant="body2">
            Get instant alerts when your profit targets or stop losses are hit, even when you're not on this page.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};
