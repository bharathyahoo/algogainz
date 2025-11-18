import { apiService } from './api';

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema20: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
  stochastic: {
    k: number;
    d: number;
  };
  volume: {
    current: number;
    average: number;
  };
}

export interface TradingSignal {
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  indicators: TechnicalIndicators;
  price: number;
  timestamp: string;
}

export interface StockAnalysis extends TradingSignal {
  symbol?: string;
  instrumentToken?: string;
}

class AnalysisService {
  /**
   * Get technical analysis for a single stock
   */
  async getAnalysis(instrumentToken: string, interval: string = 'day'): Promise<TradingSignal> {
    try {
      const response = await apiService.get(`/analysis/${instrumentToken}`, { interval });
      return response.data as TradingSignal;
    } catch (error: any) {
      console.error('Failed to get analysis:', error);
      throw new Error(error.message || 'Failed to get technical analysis');
    }
  }

  /**
   * Get technical analysis for multiple stocks
   */
  async getBatchAnalysis(
    stocks: { instrumentToken: string; symbol: string }[]
  ): Promise<StockAnalysis[]> {
    try {
      const response = await apiService.post('/analysis/batch', { stocks });
      return response.data as StockAnalysis[];
    } catch (error: any) {
      console.error('Failed to get batch analysis:', error);
      throw new Error(error.message || 'Failed to get batch analysis');
    }
  }

  /**
   * Get only technical indicators without recommendation
   */
  async getIndicators(instrumentToken: string, interval: string = 'day'): Promise<TechnicalIndicators> {
    try {
      const response = await apiService.get(`/analysis/${instrumentToken}/indicators`, { interval });
      return response.data as TechnicalIndicators;
    } catch (error: any) {
      console.error('Failed to get indicators:', error);
      throw new Error(error.message || 'Failed to get indicators');
    }
  }
}

export const analysisService = new AnalysisService();
