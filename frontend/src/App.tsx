import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';

// Components loaded immediately (critical path)
import ProtectedRoute from './components/common/ProtectedRoute';
import OfflineBanner from './components/common/OfflineBanner';

// Lazy-loaded pages (code splitting)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const HoldingsPage = lazy(() => import('./pages/HoldingsPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

// Loading fallback component
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'background.default',
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          {/* Offline Detection Banner */}
          <OfflineBanner />

          {/* Routes with Suspense for lazy loading */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/success" element={<AuthCallbackPage />} />
              <Route path="/auth/error" element={<AuthCallbackPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <ProtectedRoute>
                    <WatchlistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/holdings"
                element={
                  <ProtectedRoute>
                    <HoldingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 - Redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
