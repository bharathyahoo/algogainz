import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Security,
  Assessment,
  Notifications,
  ShowChart,
  Timeline,
  AccountBalance,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../services/authService';
import { loginSuccess } from '../store/authSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const features = [
  {
    icon: <ShowChart sx={{ fontSize: 40 }} />,
    title: 'Technical Analysis',
    description: 'RSI, MACD, Bollinger Bands & more indicators at your fingertips',
  },
  {
    icon: <Notifications sx={{ fontSize: 40 }} />,
    title: 'Smart Alerts',
    description: 'Get notified when your profit targets or stop-loss levels are hit',
  },
  {
    icon: <Timeline sx={{ fontSize: 40 }} />,
    title: 'Backtesting',
    description: 'Test your strategies against historical data before trading',
  },
  {
    icon: <AccountBalance sx={{ fontSize: 40 }} />,
    title: 'Portfolio Tracking',
    description: 'Track P&L, holdings, and generate detailed reports',
  },
];

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  const handleKiteLogin = () => {
    authService.initiateLogin();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.loginWithEmail(email, password);
      localStorage.setItem('token', response.token);
      const user = authService.decodeToken(response.token);
      if (user) {
        dispatch(loginSuccess({ user, token: response.token }));
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register(email, password, name || undefined);
      localStorage.setItem('token', response.token);
      const user = authService.decodeToken(response.token);
      if (user) {
        dispatch(loginSuccess({ user, token: response.token }));
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Marketing/Hero Section
  const HeroSection = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: 'white',
        p: { xs: 4, md: 6 },
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <TrendingUp sx={{ fontSize: 48, mr: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          AlgoGainz
        </Typography>
      </Box>

      {/* Tagline */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Trade Smarter, Not Harder
      </Typography>
      <Typography variant="h6" sx={{ mb: 5, opacity: 0.9, fontWeight: 400 }}>
        AI-powered trading assistant for Indian stock markets.
        Make data-driven decisions with advanced technical analysis.
      </Typography>

      {/* Features */}
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                }}
              >
                {feature.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {feature.description}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Integration Badge */}
      <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
          Seamlessly integrated with
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Zerodha Kite Connect
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // Auth Form Section
  const AuthSection = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, md: 4 },
        bgcolor: isMobile ? 'transparent' : 'background.paper',
      }}
    >
      <Paper
        elevation={isMobile ? 24 : 0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        {/* Mobile Logo */}
        {isMobile && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <TrendingUp sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AlgoGainz
            </Typography>
          </Box>
        )}

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { fontWeight: 600 },
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab label="Sign In" />
          <Tab label="Create Account" />
        </Tabs>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Login Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleEmailLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              size="small"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              size="small"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </TabPanel>

        {/* Register Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              disabled={loading}
              size="small"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              size="small"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              size="small"
              helperText="Min 8 characters"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              size="small"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>
        </TabPanel>

        {/* Divider */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Zerodha Button */}
        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={handleKiteLogin}
          startIcon={<Assessment />}
          sx={{
            py: 1.5,
            fontWeight: 600,
            borderColor: '#387ED1',
            color: '#387ED1',
            '&:hover': {
              borderColor: '#2c6ab8',
              bgcolor: 'rgba(56, 126, 209, 0.04)',
            },
          }}
        >
          Continue with Zerodha
        </Button>

        {/* Disclaimer */}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
          sx={{ mt: 3 }}
        >
          By continuing, you agree to our Terms of Service.
          <br />
          AlgoGainz tracks only trades made through this app.
        </Typography>

        {/* Risk Warning */}
        <Typography
          variant="caption"
          color="warning.main"
          display="block"
          textAlign="center"
          sx={{ mt: 2 }}
        >
          Trading involves risk. This is not financial advice.
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: isMobile
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'none',
      }}
    >
      {/* Left Side - Hero (Desktop only) */}
      {!isMobile && (
        <Box
          sx={{
            flex: '0 0 55%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <HeroSection />
        </Box>
      )}

      {/* Right Side - Auth Form */}
      <Box
        sx={{
          flex: isMobile ? 1 : '0 0 45%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AuthSection />
      </Box>
    </Box>
  );
};

export default LoginPage;
