import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import { TrendingUp, Security, Assessment, Notifications } from '@mui/icons-material';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
  const handleLogin = () => {
    authService.initiateLogin();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ mb: 4 }}>
            <TrendingUp
              sx={{
                fontSize: 64,
                color: 'primary.main',
                mb: 2,
              }}
            />
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AlgoGainz
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Smart Trading Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maximize your gains with intelligent technical analysis
            </Typography>
          </Box>

          {/* Features */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ mb: 4, justifyContent: 'center' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="body2">Technical Analysis</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Notifications color="primary" />
              <Typography variant="body2">Smart Alerts</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
              <Typography variant="body2">Secure Trading</Typography>
            </Box>
          </Stack>

          {/* Login Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleLogin}
            sx={{
              py: 1.5,
              px: 5,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Connect to Zerodha Kite
          </Button>

          {/* Info */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              You will be redirected to Zerodha Kite for secure authentication
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              AlgoGainz tracks only trades made through this app or manually recorded
            </Typography>
          </Box>

          {/* Disclaimer */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="warning.main" display="block">
              ⚠️ This is not financial advice. Trade at your own risk.
            </Typography>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          color="white"
          align="center"
          sx={{ mt: 3, opacity: 0.8 }}
        >
          Powered by Zerodha Kite Connect API
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginPage;
