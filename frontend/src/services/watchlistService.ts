import { apiService } from './api';
import type { WatchlistStock } from '../types';

export interface StockSearchResult {
  instrumentToken: string;
  tradingsymbol: string;
  name: string;
  exchange: string;
  instrumentType: string;
}

export interface AddToWatchlistRequest {
  stockSymbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  instrumentToken: string;
  categories?: string[];
}

export const watchlistService = {
  /**
   * Get all stocks in watchlist
   */
  async getWatchlist(): Promise<WatchlistStock[]> {
    const response = await apiService.get<WatchlistStock[]>('/watchlist');
    return response.data || [];
  },

  /**
   * Add stock to watchlist
   */
  async addStock(stock: AddToWatchlistRequest): Promise<WatchlistStock> {
    const response = await apiService.post<WatchlistStock>('/watchlist', stock);
    if (!response.data) {
      throw new Error('Failed to add stock');
    }
    return response.data;
  },

  /**
   * Remove stock from watchlist
   */
  async removeStock(id: string): Promise<void> {
    await apiService.delete(`/watchlist/${id}`);
  },

  /**
   * Update watchlist item (categories, etc.)
   */
  async updateStock(id: string, updates: { categories?: string[]; sortOrder?: number }): Promise<WatchlistStock> {
    const response = await apiService.put<WatchlistStock>(`/watchlist/${id}`, updates);
    if (!response.data) {
      throw new Error('Failed to update stock');
    }
    return response.data;
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const response = await apiService.get<string[]>('/watchlist/categories');
    return response.data || [];
  },

  /**
   * Reorder watchlist
   */
  async reorderWatchlist(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await apiService.put('/watchlist/reorder', { items });
  },

  /**
   * Search for stocks
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    const response = await apiService.get<StockSearchResult[]>('/instruments/search', { q: query });
    return response.data || [];
  },

  /**
   * Get live quotes for stocks
   */
  async getQuotes(symbols: string[]): Promise<Record<string, any>> {
    const symbolsParam = symbols.join(',');
    const response = await apiService.get<Record<string, any>>('/instruments/quote', { symbols: symbolsParam });
    return response.data || {};
  },

  /**
   * Get last traded price for stocks
   */
  async getLTP(symbols: string[]): Promise<Record<string, { last_price: number }>> {
    const symbolsParam = symbols.join(',');
    const response = await apiService.get<Record<string, { last_price: number }>>('/instruments/ltp', { symbols: symbolsParam });
    return response.data || {};
  },
};
