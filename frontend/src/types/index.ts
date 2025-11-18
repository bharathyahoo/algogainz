/**
 * Core TypeScript types for AlgoGainz
 */

// User types
export interface User {
  userId: string;
  userName: string;
  email?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  timestamp?: string;
}

// Watchlist types
export interface WatchlistStock {
  id: string;
  stockSymbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  instrumentToken: string;
  categories: string[];
  currentPrice?: number;
  dayChange?: number;
  dayChangePct?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export type TransactionType = 'BUY' | 'SELL';
export type TransactionSource = 'APP_EXECUTED' | 'MANUALLY_RECORDED';

export interface TransactionCharges {
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
}

export interface Transaction {
  id: string;
  stockSymbol: string;
  companyName: string;
  type: TransactionType;
  quantity: number;
  pricePerShare: number;
  grossAmount: number;
  charges: TransactionCharges;
  totalCharges: number;
  netAmount: number;
  source: TransactionSource;
  orderIdRef?: string;
  timestamp: string;
  createdAt: string;
}

// Holdings types
export interface ExitStrategy {
  profitTargetPct?: number;
  profitTargetPrice?: number;
  stopLossPct?: number;
  stopLossPrice?: number;
  alertEnabled: boolean;
}

export interface Holding {
  id: string;
  stockSymbol: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnL?: number;
  unrealizedPnLPct?: number;
  dayChange?: number;
  dayChangePct?: number;
  exitStrategy?: ExitStrategy;
  lastUpdated: string;
}

// Order types
export type OrderType = 'MARKET' | 'LIMIT';
export type ProductType = 'CNC' | 'MIS' | 'NRML';

export interface OrderRequest {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  transactionType: TransactionType;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  product: ProductType;
}

// Technical Analysis types
export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export interface TechnicalIndicator {
  value: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
}

export interface TechnicalAnalysis {
  symbol: string;
  signal: SignalType;
  score: number;
  indicators: {
    rsi?: TechnicalIndicator;
    macd?: TechnicalIndicator;
    movingAverages?: TechnicalIndicator;
    bollingerBands?: TechnicalIndicator;
    volume?: TechnicalIndicator;
  };
  reasons: string[];
  timestamp: string;
}

// Dashboard types
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
  topPerformers: Array<{
    symbol: string;
    pnl: number;
    pnlPct: number;
  }>;
  worstPerformers: Array<{
    symbol: string;
    pnl: number;
    pnlPct: number;
  }>;
}

// WebSocket types
export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  timestamp: string;
}

export interface Alert {
  type: 'PROFIT_TARGET' | 'STOP_LOSS';
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  message: string;
  timestamp: string;
}
