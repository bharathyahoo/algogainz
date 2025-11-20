import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';

// Components loaded immediately (critical path)
import ProtectedRoute from './components/common/ProtectedRoute';
import OfflineBanner from './components/common/OfflineBanner';
import Layout from './components/common/Layout';
import { useWebSocketConnection } from './hooks/useWebSocket';

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

// WebSocket initializer component
function WebSocketProvider({ children }: { children: React.ReactNode }) {
  // Initialize WebSocket connection when user is authenticated
  useWebSocketConnection();
  return <>{children}</>;
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <WebSocketProvider>
            {/* Offline Detection Banner */}
            <OfflineBanner />

          {/* Routes with Suspense for lazy loading */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/success" element={<AuthCallbackPage />} />
              <Route path="/auth/error" element={<AuthCallbackPage />} />

              {/* Protected Routes with Layout */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <WatchlistPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/holdings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <HoldingsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TransactionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Default redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 - Redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
          </WebSocketProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
