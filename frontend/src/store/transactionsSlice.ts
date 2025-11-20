import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Transaction } from '../types';

interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'BUY' | 'SELL' | 'ALL';
  symbol?: string;
  source?: 'APP_EXECUTED' | 'MANUALLY_RECORDED' | 'ALL';
}

interface TransactionsState {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
}

const initialState: TransactionsState = {
  transactions: [],
  filteredTransactions: [],
  filters: {
    type: 'ALL',
    source: 'ALL',
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
  totalCount: 0,
  page: 1,
  pageSize: 20,
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // Fetch transactions
    fetchTransactionsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchTransactionsSuccess: (
      state,
      action: PayloadAction<{ transactions: Transaction[]; totalCount: number }>
    ) => {
      state.isLoading = false;
      state.transactions = action.payload.transactions;
      state.filteredTransactions = action.payload.transactions;
      state.totalCount = action.payload.totalCount;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },
    fetchTransactionsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Add new transaction
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload); // Add to beginning
      state.totalCount += 1;
      // Reapply filters
      applyFilters(state);
    },

    // Update transaction
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
        // Reapply filters
        applyFilters(state);
      }
    },

    // Delete transaction
    deleteTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter((t) => t.id !== action.payload);
      state.totalCount -= 1;
      // Reapply filters
      applyFilters(state);
    },

    // Set filters
    setFilters: (state, action: PayloadAction<TransactionFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      applyFilters(state);
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        type: 'ALL',
        source: 'ALL',
      };
      state.filteredTransactions = state.transactions;
    },

    // Set pagination
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1; // Reset to first page
    },

    // Clear all transactions
    clearTransactions: (state) => {
      state.transactions = [];
      state.filteredTransactions = [];
      state.totalCount = 0;
      state.lastUpdated = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Helper function to apply filters
function applyFilters(state: TransactionsState) {
  let filtered = [...state.transactions];

  // Filter by date range
  if (state.filters.startDate) {
    filtered = filtered.filter(
      (t) => new Date(t.timestamp) >= new Date(state.filters.startDate!)
    );
  }
  if (state.filters.endDate) {
    filtered = filtered.filter(
      (t) => new Date(t.timestamp) <= new Date(state.filters.endDate!)
    );
  }

  // Filter by type
  if (state.filters.type && state.filters.type !== 'ALL') {
    filtered = filtered.filter((t) => t.type === state.filters.type);
  }

  // Filter by symbol
  if (state.filters.symbol) {
    filtered = filtered.filter((t) =>
      t.stockSymbol.toLowerCase().includes(state.filters.symbol!.toLowerCase())
    );
  }

  // Filter by source
  if (state.filters.source && state.filters.source !== 'ALL') {
    filtered = filtered.filter((t) => t.source === state.filters.source);
  }

  state.filteredTransactions = filtered;
}

export const {
  fetchTransactionsStart,
  fetchTransactionsSuccess,
  fetchTransactionsFailure,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setFilters,
  clearFilters,
  setPage,
  setPageSize,
  clearTransactions,
  clearError,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
