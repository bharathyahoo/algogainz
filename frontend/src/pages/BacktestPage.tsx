import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import StrategyBuilderForm from '../components/backtest/StrategyBuilderForm';
import BacktestResults from '../components/backtest/BacktestResults';
import backtestService from '../services/backtestService';
import type { BacktestResult, BacktestSummary } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`backtest-tabpanel-${index}`}
      aria-labelledby={`backtest-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const BacktestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<BacktestResult | null>(null);
  const [backtestHistory, setBacktestHistory] = useState<BacktestSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load backtest history when results tab is active
  useEffect(() => {
    if (activeTab === 1) {
      loadBacktestHistory();
    }
  }, [activeTab]);

  const loadBacktestHistory = async () => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const data = await backtestService.getBacktestResults({
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setBacktestHistory(data.results);
    } catch (err: any) {
      console.error('Failed to load backtest history:', err);
      setError(err.message || 'Failed to load backtest history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRunBacktest = async (config: any) => {
    setIsRunning(true);
    setError(null);
    try {
      const result = await backtestService.runBacktest(config);
      setCurrentResult(result);
      setSuccessMessage(`Backtest completed successfully: ${result.totalTrades} trades executed`);

      // Switch to results tab after successful backtest
      setActiveTab(1);

      // Reload history
      await loadBacktestHistory();
    } catch (err: any) {
      console.error('Backtest failed:', err);
      setError(err.message || 'Backtest execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleViewBacktest = async (id: string) => {
    setError(null);
    try {
      const result = await backtestService.getBacktestById(id);
      setCurrentResult(result);
    } catch (err: any) {
      console.error('Failed to load backtest:', err);
      setError(err.message || 'Failed to load backtest details');
    }
  };

  const handleDeleteBacktest = async (id: string) => {
    setError(null);
    try {
      await backtestService.deleteBacktest(id);
      setSuccessMessage('Backtest deleted successfully');

      // Clear current result if it was deleted
      if (currentResult?.id === id) {
        setCurrentResult(null);
      }

      // Reload history
      await loadBacktestHistory();
    } catch (err: any) {
      console.error('Failed to delete backtest:', err);
      setError(err.message || 'Failed to delete backtest');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Backtesting
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Test your trading strategies against historical data to evaluate performance before going live.
          </Typography>
        </Box>

        {/* Info Banner */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>How it works:</strong> Configure entry and exit conditions using technical indicators,
            select a stock and date range, then run the backtest to see how your strategy would have performed
            historically. Review detailed metrics, trade logs, and equity curves to optimize your approach.
          </Typography>
        </Alert>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <Paper elevation={2}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="backtest tabs"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
            }}
          >
            <Tab label="Create Strategy" id="backtest-tab-0" aria-controls="backtest-tabpanel-0" />
            <Tab label="Results History" id="backtest-tab-1" aria-controls="backtest-tabpanel-1" />
          </Tabs>

          <Box sx={{ px: 3, pb: 3 }}>
            {/* Tab 1: Create Strategy */}
            <TabPanel value={activeTab} index={0}>
              <StrategyBuilderForm onSubmit={handleRunBacktest} isRunning={isRunning} />
            </TabPanel>

            {/* Tab 2: Results History */}
            <TabPanel value={activeTab} index={1}>
              {isLoadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <BacktestResults
                  backtestHistory={backtestHistory}
                  currentResult={currentResult}
                  onViewBacktest={handleViewBacktest}
                  onDeleteBacktest={handleDeleteBacktest}
                />
              )}
            </TabPanel>
          </Box>
        </Paper>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BacktestPage;
