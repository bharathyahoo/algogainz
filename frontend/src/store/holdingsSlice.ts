import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Holding } from '../types';

interface HoldingsState {
  holdings: Holding[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: HoldingsState = {
  holdings: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const holdingsSlice = createSlice({
  name: 'holdings',
  initialState,
  reducers: {
    // Fetch holdings
    fetchHoldingsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchHoldingsSuccess: (state, action: PayloadAction<Holding[]>) => {
      state.isLoading = false;
      state.holdings = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },
    fetchHoldingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Update single holding (for real-time price updates)
    updateHolding: (state, action: PayloadAction<Partial<Holding> & { id: string }>) => {
      const index = state.holdings.findIndex((h) => h.id === action.payload.id);
      if (index !== -1) {
        state.holdings[index] = { ...state.holdings[index], ...action.payload };
      }
    },

    // Update holding price (for WebSocket updates)
    updateHoldingPrice: (
      state,
      action: PayloadAction<{
        stockSymbol: string;
        currentPrice: number;
        change: number;
        changePct: number;
      }>
    ) => {
      const { stockSymbol, currentPrice, change, changePct } = action.payload;
      const holding = state.holdings.find((h) => h.stockSymbol === stockSymbol);

      if (holding) {
        holding.currentPrice = currentPrice;
        holding.currentValue = currentPrice * holding.quantity;
        holding.unrealizedPnL = holding.currentValue - holding.totalInvested;
        holding.unrealizedPnLPct =
          holding.totalInvested > 0
            ? (holding.unrealizedPnL / holding.totalInvested) * 100
            : 0;
        holding.dayChange = change;
        holding.dayChangePct = changePct;
      }
    },

    // Set exit strategy
    setExitStrategy: (
      state,
      action: PayloadAction<{
        id: string;
        exitStrategy: {
          profitTargetPct?: number;
          profitTargetPrice?: number;
          stopLossPct?: number;
          stopLossPrice?: number;
          alertEnabled: boolean;
        };
      }>
    ) => {
      const holding = state.holdings.find((h) => h.id === action.payload.id);
      if (holding) {
        holding.exitStrategy = action.payload.exitStrategy;
      }
    },

    // Remove exit strategy
    removeExitStrategy: (state, action: PayloadAction<string>) => {
      const holding = state.holdings.find((h) => h.id === action.payload);
      if (holding) {
        holding.exitStrategy = undefined;
      }
    },

    // Add new holding
    addHolding: (state, action: PayloadAction<Holding>) => {
      state.holdings.push(action.payload);
    },

    // Remove holding (when fully sold)
    removeHolding: (state, action: PayloadAction<string>) => {
      state.holdings = state.holdings.filter((h) => h.id !== action.payload);
    },

    // Clear all holdings
    clearHoldings: (state) => {
      state.holdings = [];
      state.lastUpdated = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchHoldingsStart,
  fetchHoldingsSuccess,
  fetchHoldingsFailure,
  updateHolding,
  updateHoldingPrice,
  setExitStrategy,
  removeExitStrategy,
  addHolding,
  removeHolding,
  clearHoldings,
  clearError,
} = holdingsSlice.actions;

export default holdingsSlice.reducer;
