import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DashboardMetrics } from '../types';

interface DashboardState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refreshInterval: number; // in milliseconds
  autoRefreshEnabled: boolean;
}

const initialState: DashboardState = {
  metrics: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  refreshInterval: 60000, // 1 minute
  autoRefreshEnabled: true,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Fetch metrics
    fetchMetricsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMetricsSuccess: (state, action: PayloadAction<DashboardMetrics>) => {
      state.isLoading = false;
      state.metrics = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },
    fetchMetricsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Update specific metric (for real-time updates)
    updateMetric: <K extends keyof DashboardMetrics>(
      state: DashboardState,
      action: PayloadAction<{ key: K; value: DashboardMetrics[K] }>
    ) => {
      if (state.metrics) {
        state.metrics[action.payload.key] = action.payload.value;
      }
    },

    // Update portfolio value (from real-time price updates)
    updatePortfolioValue: (state, action: PayloadAction<number>) => {
      if (state.metrics) {
        const oldValue = state.metrics.currentPortfolioValue;
        const newValue = action.payload;
        const diff = newValue - oldValue;

        state.metrics.currentPortfolioValue = newValue;

        // Update unrealized P&L
        state.metrics.unrealizedPnL = (state.metrics.unrealizedPnL || 0) + diff;

        // Update total P&L
        state.metrics.totalPnL = (state.metrics.realizedPnL || 0) + state.metrics.unrealizedPnL;

        // Update return percentage
        if (state.metrics.totalInvested && state.metrics.totalInvested > 0) {
          state.metrics.returnPercent =
            (state.metrics.totalPnL / state.metrics.totalInvested) * 100;
        }
      }
    },

    // Update unrealized P&L (from price changes)
    updateUnrealizedPnL: (state, action: PayloadAction<number>) => {
      if (state.metrics) {
        const diff = action.payload - (state.metrics.unrealizedPnL || 0);

        state.metrics.unrealizedPnL = action.payload;
        state.metrics.currentPortfolioValue =
          (state.metrics.currentPortfolioValue || 0) + diff;
        state.metrics.totalPnL = (state.metrics.realizedPnL || 0) + state.metrics.unrealizedPnL;

        if (state.metrics.totalInvested && state.metrics.totalInvested > 0) {
          state.metrics.returnPercent =
            (state.metrics.totalPnL / state.metrics.totalInvested) * 100;
        }
      }
    },

    // Update realized P&L (after trade completion)
    updateRealizedPnL: (state, action: PayloadAction<number>) => {
      if (state.metrics) {
        state.metrics.realizedPnL = action.payload;
        state.metrics.totalPnL = state.metrics.realizedPnL + (state.metrics.unrealizedPnL || 0);

        if (state.metrics.totalInvested && state.metrics.totalInvested > 0) {
          state.metrics.returnPercent =
            (state.metrics.totalPnL / state.metrics.totalInvested) * 100;
        }
      }
    },

    // Update win rate (after trade completion)
    updateWinRate: (state, action: PayloadAction<{ totalTrades: number; winRate: number }>) => {
      if (state.metrics) {
        state.metrics.totalTrades = action.payload.totalTrades;
        state.metrics.winRate = action.payload.winRate;
      }
    },

    // Update top/worst performers
    updatePerformers: (
      state,
      action: PayloadAction<{
        topPerformers: Array<{ symbol: string; pnl: number; pnlPct: number }>;
        worstPerformers: Array<{ symbol: string; pnl: number; pnlPct: number }>;
      }>
    ) => {
      if (state.metrics) {
        state.metrics.topPerformers = action.payload.topPerformers;
        state.metrics.worstPerformers = action.payload.worstPerformers;
      }
    },

    // Set refresh interval
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },

    // Toggle auto refresh
    toggleAutoRefresh: (state) => {
      state.autoRefreshEnabled = !state.autoRefreshEnabled;
    },
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefreshEnabled = action.payload;
    },

    // Clear metrics
    clearMetrics: (state) => {
      state.metrics = null;
      state.lastUpdated = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset dashboard
    resetDashboard: () => {
      return initialState;
    },
  },
});

export const {
  fetchMetricsStart,
  fetchMetricsSuccess,
  fetchMetricsFailure,
  updateMetric,
  updatePortfolioValue,
  updateUnrealizedPnL,
  updateRealizedPnL,
  updateWinRate,
  updatePerformers,
  setRefreshInterval,
  toggleAutoRefresh,
  setAutoRefresh,
  clearMetrics,
  clearError,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
