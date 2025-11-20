import { apiService } from './api';
import type { Holding } from '../types';

export interface ExitStrategy {
  id: string;
  holdingId: string;
  profitTargetPct: number | null;
  profitTargetPrice: number | null;
  stopLossPct: number | null;
  stopLossPrice: number | null;
  alertEnabled: boolean;
  profitAlertTriggered: boolean;
  stopLossAlertTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

// Note: Holding interface is now imported from '../types'
export type { Holding };

export interface ExitStrategyRequest {
  profitTargetPct: number | null;
  stopLossPct: number | null;
  alertEnabled?: boolean;
}

export interface Alert {
  holdingId: string;
  stockSymbol: string;
  companyName: string;
  currentPrice: number | undefined;
  quantity: number;
  avgBuyPrice: number;
  unrealizedPnL: number | undefined;
  profitAlertTriggered: boolean;
  stopLossAlertTriggered: boolean;
  profitTargetPrice: number | undefined;
  stopLossPrice: number | undefined;
}

class HoldingsService {
  /**
   * Get all holdings for user
   */
  async getHoldings(): Promise<Holding[]> {
    try {
      const response = await apiService.get('/holdings');
      return response.data as Holding[];
    } catch (error: any) {
      console.error('Failed to get holdings:', error);
      throw new Error(error.message || 'Failed to get holdings');
    }
  }

  /**
   * Create or update exit strategy for a holding
   */
  async setExitStrategy(holdingId: string, strategy: ExitStrategyRequest): Promise<ExitStrategy> {
    try {
      const response = await apiService.post(`/holdings/${holdingId}/exit-strategy`, strategy);
      return response.data as ExitStrategy;
    } catch (error: any) {
      console.error('Failed to set exit strategy:', error);
      throw new Error(error.message || 'Failed to set exit strategy');
    }
  }

  /**
   * Get exit strategy for a holding
   */
  async getExitStrategy(holdingId: string): Promise<ExitStrategy | null> {
    try {
      const response = await apiService.get(`/holdings/${holdingId}/exit-strategy`);
      return response.data as ExitStrategy | null;
    } catch (error: any) {
      console.error('Failed to get exit strategy:', error);
      throw new Error(error.message || 'Failed to get exit strategy');
    }
  }

  /**
   * Delete exit strategy for a holding
   */
  async deleteExitStrategy(holdingId: string): Promise<void> {
    try {
      await apiService.delete(`/holdings/${holdingId}/exit-strategy`);
    } catch (error: any) {
      console.error('Failed to delete exit strategy:', error);
      throw new Error(error.message || 'Failed to delete exit strategy');
    }
  }

  /**
   * Get all triggered alerts
   */
  async getAlerts(): Promise<Alert[]> {
    try {
      const response = await apiService.get('/holdings/alerts');
      return response.data as Alert[];
    } catch (error: any) {
      console.error('Failed to get alerts:', error);
      throw new Error(error.message || 'Failed to get alerts');
    }
  }

  /**
   * Calculate profit target price
   */
  calculateProfitTargetPrice(avgBuyPrice: number, profitTargetPct: number): number {
    return avgBuyPrice * (1 + profitTargetPct / 100);
  }

  /**
   * Calculate stop loss price
   */
  calculateStopLossPrice(avgBuyPrice: number, stopLossPct: number): number {
    return avgBuyPrice * (1 - stopLossPct / 100);
  }
}

export const holdingsService = new HoldingsService();
