/**
 * NotificationSettings Component
 * Compact notification controls for page headers
 */

import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Switch,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  TestTube as TestTubeIcon,
} from '@mui/icons-material';
import { notificationService } from '../../services/notificationService';

export const NotificationSettings: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
    setSoundEnabled(notificationService.isSoundEnabled());
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEnableNotifications = async () => {
    const permission = await notificationService.requestPermission();
    setPermissionStatus(permission);
    handleClose();
  };

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    notificationService.setSoundEnabled(newValue);
    setSoundEnabled(newValue);
  };

  const handleTestNotification = () => {
    if (permissionStatus === 'granted') {
      notificationService.showTestNotification();
      handleClose();
    }
  };

  const isOpen = Boolean(anchorEl);
  const hasPermission = permissionStatus === 'granted';

  return (
    <>
      <Tooltip title="Notification Settings">
        <IconButton
          onClick={handleClick}
          size="small"
          color={hasPermission ? 'primary' : 'default'}
          sx={{
            border: hasPermission ? '2px solid' : '1px solid',
            borderColor: hasPermission ? 'primary.main' : 'divider',
          }}
        >
          {hasPermission ? (
            <NotificationsIcon fontSize="small" />
          ) : (
            <NotificationsOffIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { minWidth: 280, mt: 1 },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Notification Settings
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Manage alert notifications
          </Typography>
        </Box>

        <Divider />

        {/* Permission Status */}
        {!hasPermission && (
          <>
            <MenuItem onClick={handleEnableNotifications}>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Enable Notifications"
                secondary="Get alerts for profit/stop loss"
              />
            </MenuItem>
            <Divider />
          </>
        )}

        {hasPermission && (
          <>
            {/* Sound Toggle */}
            <MenuItem onClick={handleToggleSound}>
              <ListItemIcon>
                {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </ListItemIcon>
              <ListItemText primary="Notification Sound" />
              <Switch
                edge="end"
                checked={soundEnabled}
                onChange={handleToggleSound}
                size="small"
              />
            </MenuItem>

            <Divider />

            {/* Test Notification */}
            <MenuItem onClick={handleTestNotification}>
              <ListItemIcon>
                <TestTubeIcon />
              </ListItemIcon>
              <ListItemText
                primary="Test Notification"
                secondary="Send a test alert"
              />
            </MenuItem>
          </>
        )}

        {/* Status Info */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary">
            Status:{' '}
            <Typography
              component="span"
              variant="caption"
              fontWeight="bold"
              color={hasPermission ? 'success.main' : 'warning.main'}
            >
              {permissionStatus === 'granted'
                ? 'Enabled'
                : permissionStatus === 'denied'
                ? 'Blocked'
                : 'Not Enabled'}
            </Typography>
          </Typography>
        </Box>
      </Menu>
    </>
  );
};
