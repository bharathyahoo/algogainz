import { apiService } from './api';

export interface DashboardMetrics {
  totalInvested: number;
  currentPortfolioValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  returnPercent: number;
  totalTrades: number;
  winRate: number;
  avgProfitPerTrade: number;
  largestGain: number;
  largestLoss: number;
  topPerformers: StockPerformance[];
  worstPerformers: StockPerformance[];
  netInvested: number;
  totalProceeds: number;
}

export interface StockPerformance {
  symbol: string;
  companyName: string;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
}

export interface PnLTrendData {
  date: string;
  pnl: number;
}

class DashboardService {
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await apiService.get<DashboardMetrics>('/dashboard/metrics');
    return response.data!;
  }

  async getPnLTrend(period: '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' = '1M'): Promise<PnLTrendData[]> {
    const response = await apiService.get<PnLTrendData[]>(`/dashboard/pnl-trend?period=${period}`);
    return response.data!;
  }
}

export default new DashboardService();
