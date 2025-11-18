import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { WatchlistStock } from '../types';

interface WatchlistState {
  stocks: WatchlistStock[];
  categories: string[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WatchlistState = {
  stocks: [],
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setWatchlist: (state, action: PayloadAction<WatchlistStock[]>) => {
      state.stocks = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addStock: (state, action: PayloadAction<WatchlistStock>) => {
      state.stocks.push(action.payload);
    },
    removeStock: (state, action: PayloadAction<string>) => {
      state.stocks = state.stocks.filter(stock => stock.id !== action.payload);
    },
    updateStock: (state, action: PayloadAction<WatchlistStock>) => {
      const index = state.stocks.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.stocks[index] = action.payload;
      }
    },
    updateStockPrice: (state, action: PayloadAction<{ symbol: string; price: number; change: number; changePct: number }>) => {
      const stock = state.stocks.find(s => s.stockSymbol === action.payload.symbol);
      if (stock) {
        stock.currentPrice = action.payload.price;
        stock.dayChange = action.payload.change;
        stock.dayChangePct = action.payload.changePct;
      }
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    reorderStocks: (state, action: PayloadAction<WatchlistStock[]>) => {
      state.stocks = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setWatchlist,
  addStock,
  removeStock,
  updateStock,
  updateStockPrice,
  setCategories,
  setSelectedCategory,
  reorderStocks,
  setLoading,
  setError,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;
