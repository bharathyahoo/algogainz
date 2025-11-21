/**
 * Backtest Service - API calls for backtesting operations
 */

import { apiService } from './api';
import type {
  BacktestConfig,
  BacktestResult,
  BacktestSummary,
  ApiResponse,
} from '../types';

class BacktestService {
  /**
   * Run a new backtest
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    try {
      const response = await apiService.post<BacktestResult>(
        '/backtest/run',
        config
      );
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Failed to run backtest:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to run backtest');
    }
  }

  /**
   * Get all backtest results for user
   */
  async getBacktestResults(params?: {
    limit?: number;
    offset?: number;
    symbol?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    results: BacktestSummary[];
    pagination: { total: number; limit: number; offset: number };
  }> {
    try {
      const response = await apiService.get<{
        results: BacktestSummary[];
        pagination: { total: number; limit: number; offset: number };
      }>('/backtest/results', params);

      return {
        results: response.data?.results || [],
        pagination: response.data?.pagination || { total: 0, limit: 20, offset: 0 },
      };
    } catch (error: any) {
      console.error('Failed to get backtest results:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get backtest results');
    }
  }

  /**
   * Get detailed backtest result by ID
   */
  async getBacktestById(id: string): Promise<BacktestResult> {
    try {
      const response = await apiService.get<BacktestResult>(`/backtest/${id}`);
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Failed to get backtest result:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get backtest result');
    }
  }

  /**
   * Delete a backtest result
   */
  async deleteBacktest(id: string): Promise<void> {
    try {
      await apiService.delete(`/backtest/${id}`);
    } catch (error: any) {
      console.error('Failed to delete backtest:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete backtest');
    }
  }

  /**
   * Compare multiple backtest results
   */
  async compareBacktests(backtestIds: string[]): Promise<BacktestSummary[]> {
    try {
      const response = await apiService.post<ApiResponse<BacktestSummary[]>>(
        '/backtest/compare',
        { backtestIds }
      );
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Failed to compare backtests:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to compare backtests');
    }
  }
}

export default new BacktestService();
export { BacktestService };
