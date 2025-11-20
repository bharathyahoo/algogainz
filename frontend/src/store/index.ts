import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import watchlistReducer from './watchlistSlice';
import holdingsReducer from './holdingsSlice';
import transactionsReducer from './transactionsSlice';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    watchlist: watchlistReducer,
    holdings: holdingsReducer,
    transactions: transactionsReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
