import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/metrics - Get comprehensive portfolio metrics
router.get('/metrics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });

    // Get all holdings with current prices
    const holdings = await prisma.holding.findMany({
      where: { userId },
      include: {
        exitStrategy: true,
      },
    });

    // Calculate metrics
    const metrics = calculatePortfolioMetrics(transactions, holdings);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_FETCH_FAILED',
        message: 'Failed to fetch dashboard metrics',
      },
    });
  }
});

// GET /api/dashboard/pnl-trend - Get P&L trend data for charts
router.get('/pnl-trend', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { period = '1M' } = req.query; // 1W, 1M, 3M, 6M, 1Y, ALL

    // Get all transactions ordered by date
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate cumulative P&L over time
    const trendData = calculatePnLTrend(transactions, period as string);

    res.json({
      success: true,
      data: trendData,
    });
  } catch (error) {
    console.error('Error fetching P&L trend:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PNL_TREND_FETCH_FAILED',
        message: 'Failed to fetch P&L trend data',
      },
    });
  }
});

interface Transaction {
  id: string;
  type: string;
  symbol: string;
  companyName: string;
  quantity: number;
  pricePerShare: number;
  charges: any;
  totalValue: number;
  timestamp: Date;
}

interface Holding {
  symbol: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPercent: number | null;
}

function calculatePortfolioMetrics(transactions: any[], holdings: any[]) {
  // Calculate total invested (all buys)
  const totalInvested = transactions
    .filter((t) => t.type === 'BUY')
    .reduce((sum, t) => sum + Math.abs(t.netAmount), 0);

  // Calculate total proceeds (all sells)
  const totalProceeds = transactions
    .filter((t) => t.type === 'SELL')
    .reduce((sum, t) => sum + Math.abs(t.netAmount), 0);

  // Calculate realized P&L using FIFO
  const realizedPnL = calculateRealizedPnL(transactions);

  // Calculate unrealized P&L from current holdings
  const unrealizedPnL = holdings.reduce((sum, h) => sum + (h.unrealizedPnL || 0), 0);

  // Calculate current portfolio value
  const currentPortfolioValue = holdings.reduce(
    (sum, h) => sum + (h.currentValue || h.totalInvested),
    0
  );

  // Total P&L
  const totalPnL = realizedPnL + unrealizedPnL;

  // Return percentage (based on total invested minus proceeds)
  const netInvested = totalInvested - totalProceeds;
  const returnPercent = netInvested > 0 ? (totalPnL / netInvested) * 100 : 0;

  // Calculate trade statistics
  const completedTrades = calculateCompletedTrades(transactions);
  const totalTrades = completedTrades.length;
  const profitableTrades = completedTrades.filter((t) => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  const avgProfitPerTrade =
    totalTrades > 0 ? completedTrades.reduce((sum, t) => sum + t.pnl, 0) / totalTrades : 0;

  const largestGain = completedTrades.length > 0 ? Math.max(...completedTrades.map((t) => t.pnl)) : 0;
  const largestLoss = completedTrades.length > 0 ? Math.min(...completedTrades.map((t) => t.pnl)) : 0;

  // Top and worst performers
  const stockPerformance = calculateStockPerformance(transactions, holdings);
  const topPerformers = stockPerformance
    .filter((s) => s.totalPnL > 0)
    .sort((a, b) => b.totalPnL - a.totalPnL)
    .slice(0, 5);

  const worstPerformers = stockPerformance
    .filter((s) => s.totalPnL < 0)
    .sort((a, b) => a.totalPnL - b.totalPnL)
    .slice(0, 5);

  return {
    totalInvested,
    currentPortfolioValue,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
    returnPercent,
    totalTrades,
    winRate,
    avgProfitPerTrade,
    largestGain,
    largestLoss,
    topPerformers,
    worstPerformers,
    netInvested,
    totalProceeds,
  };
}

function calculateRealizedPnL(transactions: any[]): number {
  const stockTransactions: { [symbol: string]: any[] } = {};

  // Group transactions by symbol
  transactions.forEach((t) => {
    if (!stockTransactions[t.stockSymbol]) {
      stockTransactions[t.stockSymbol] = [];
    }
    stockTransactions[t.stockSymbol].push(t);
  });

  let totalRealizedPnL = 0;

  // Calculate P&L for each stock using FIFO
  Object.values(stockTransactions).forEach((stockTxns) => {
    const buys = stockTxns.filter((t) => t.type === 'BUY').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const sells = stockTxns.filter((t) => t.type === 'SELL').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let buyQueue = [...buys];

    sells.forEach((sell) => {
      let remainingQty = sell.quantity;

      while (remainingQty > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0];

        if (buy.remainingQty === undefined) {
          buy.remainingQty = buy.quantity;
        }

        const matchQty = Math.min(remainingQty, buy.remainingQty);

        // Calculate proportional buy cost and sell proceeds
        const buyCost = (Math.abs(buy.netAmount) / buy.quantity) * matchQty;
        const sellProceeds = (Math.abs(sell.netAmount) / sell.quantity) * matchQty;

        // P&L = Sell proceeds - Buy cost
        const pnl = sellProceeds - buyCost;

        totalRealizedPnL += pnl;

        buy.remainingQty -= matchQty;
        remainingQty -= matchQty;

        if (buy.remainingQty <= 0) {
          buyQueue.shift();
        }
      }
    });
  });

  return totalRealizedPnL;
}

function calculateCompletedTrades(transactions: any[]): any[] {
  const stockTransactions: { [symbol: string]: any[] } = {};

  // Group transactions by symbol
  transactions.forEach((t) => {
    if (!stockTransactions[t.stockSymbol]) {
      stockTransactions[t.stockSymbol] = [];
    }
    stockTransactions[t.stockSymbol].push(t);
  });

  const completedTrades: any[] = [];

  // Calculate completed trades for each stock using FIFO
  Object.entries(stockTransactions).forEach(([symbol, stockTxns]) => {
    const buys = stockTxns.filter((t) => t.type === 'BUY').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const sells = stockTxns.filter((t) => t.type === 'SELL').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let buyQueue = [...buys];

    sells.forEach((sell) => {
      let remainingQty = sell.quantity;

      while (remainingQty > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0];

        if (buy.remainingQty === undefined) {
          buy.remainingQty = buy.quantity;
        }

        const matchQty = Math.min(remainingQty, buy.remainingQty);

        // Calculate proportional costs
        const buyCost = (Math.abs(buy.netAmount) / buy.quantity) * matchQty;
        const sellProceeds = (Math.abs(sell.netAmount) / sell.quantity) * matchQty;
        const pnl = sellProceeds - buyCost;

        completedTrades.push({
          symbol,
          buyDate: buy.timestamp,
          sellDate: sell.timestamp,
          quantity: matchQty,
          buyPrice: buy.pricePerShare,
          sellPrice: sell.pricePerShare,
          pnl,
        });

        buy.remainingQty -= matchQty;
        remainingQty -= matchQty;

        if (buy.remainingQty <= 0) {
          buyQueue.shift();
        }
      }
    });
  });

  return completedTrades;
}

function calculateStockPerformance(transactions: any[], holdings: any[]): any[] {
  const stockMap: { [symbol: string]: any } = {};

  // Initialize with transactions
  transactions.forEach((t) => {
    if (!stockMap[t.stockSymbol]) {
      stockMap[t.stockSymbol] = {
        symbol: t.stockSymbol,
        companyName: t.companyName,
        realizedPnL: 0,
        unrealizedPnL: 0,
      };
    }
  });

  // Add holdings unrealized P&L
  holdings.forEach((h) => {
    if (stockMap[h.stockSymbol]) {
      stockMap[h.stockSymbol].unrealizedPnL = h.unrealizedPnL || 0;
    }
  });

  // Calculate realized P&L per stock
  Object.keys(stockMap).forEach((symbol) => {
    const stockTxns = transactions.filter((t) => t.stockSymbol === symbol);
    const realizedPnL = calculateRealizedPnLForStock(stockTxns);
    stockMap[symbol].realizedPnL = realizedPnL;
    stockMap[symbol].totalPnL = realizedPnL + stockMap[symbol].unrealizedPnL;
  });

  return Object.values(stockMap);
}

function calculateRealizedPnLForStock(transactions: any[]): number {
  const buys = transactions.filter((t) => t.type === 'BUY').sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const sells = transactions.filter((t) => t.type === 'SELL').sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let buyQueue = [...buys];
  let totalPnL = 0;

  sells.forEach((sell) => {
    let remainingQty = sell.quantity;

    while (remainingQty > 0 && buyQueue.length > 0) {
      const buy = buyQueue[0];

      if (buy.remainingQty === undefined) {
        buy.remainingQty = buy.quantity;
      }

      const matchQty = Math.min(remainingQty, buy.remainingQty);

      const buyCost = (Math.abs(buy.netAmount) / buy.quantity) * matchQty;
      const sellProceeds = (Math.abs(sell.netAmount) / sell.quantity) * matchQty;
      const pnl = sellProceeds - buyCost;

      totalPnL += pnl;

      buy.remainingQty -= matchQty;
      remainingQty -= matchQty;

      if (buy.remainingQty <= 0) {
        buyQueue.shift();
      }
    }
  });

  return totalPnL;
}

function calculatePnLTrend(transactions: any[], period: string): any[] {
  // Filter transactions based on period
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case '1W':
      startDate.setDate(now.getDate() - 7);
      break;
    case '1M':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'ALL':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  const filteredTransactions = transactions.filter(
    (t) => new Date(t.timestamp) >= startDate
  );

  // Calculate cumulative P&L day by day
  const dailyPnL: { [date: string]: number } = {};

  filteredTransactions.forEach((t) => {
    const date = new Date(t.timestamp).toISOString().split('T')[0];

    if (!dailyPnL[date]) {
      dailyPnL[date] = 0;
    }

    if (t.type === 'BUY') {
      dailyPnL[date] -= Math.abs(t.netAmount);
    } else {
      dailyPnL[date] += Math.abs(t.netAmount);
    }
  });

  // Convert to array and calculate cumulative
  const dates = Object.keys(dailyPnL).sort();
  let cumulative = 0;

  const trendData = dates.map((date) => {
    cumulative += dailyPnL[date];
    return {
      date,
      pnl: cumulative,
    };
  });

  return trendData;
}

export default router;
