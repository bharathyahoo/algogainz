/**
 * Backtest Service - Historical Strategy Testing Engine
 *
 * Fetches historical data, applies trading strategies, and calculates performance metrics
 */

import { RSI, MACD, SMA, EMA } from 'technicalindicators';
import { createKiteService } from './kiteService';

/**
 * Strategy condition interface
 */
interface StrategyCondition {
  indicator: 'RSI' | 'MACD' | 'SMA' | 'EMA' | 'PRICE';
  operator: '<' | '>' | '=' | 'crossover' | 'crossunder';
  value: number | string;
  combinator?: 'AND' | 'OR';
}

/**
 * Exit condition interface
 */
interface ExitCondition {
  type: 'profit_target' | 'stop_loss' | 'time_based';
  value: number; // Percentage or days
}

/**
 * Trade result interface
 */
interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPct: number;
  type: 'WIN' | 'LOSS';
  holdingPeriod: number; // Days
}

/**
 * Backtest configuration
 */
interface BacktestConfig {
  stockSymbol: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  initialCapital: number;
  entryConditions: StrategyCondition[];
  exitConditions: ExitCondition[];
  strategyName: string;
}

/**
 * Backtest result interface
 */
interface BacktestResult {
  // Strategy config
  strategyName: string;
  stockSymbol: string;
  companyName: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;

  // Performance metrics
  totalReturn: number;
  totalReturnPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  maxDrawdownAmount: number;
  sharpeRatio?: number;
  avgTradeDuration?: number;

  // Trade data
  tradeHistory: Trade[];
  equityCurve: Array<{
    date: string;
    portfolioValue: number;
    cash: number;
    position: number;
  }>;

  // Metadata
  executionTime: number; // Milliseconds
  entryConditions: any;
  exitConditions: any;
}

class BacktestService {
  /**
   * Run a backtest for a given strategy
   */
  async runBacktest(config: BacktestConfig, userId: string, accessToken: string): Promise<BacktestResult> {
    const startTime = Date.now();

    try {
      // 1. Fetch historical data
      console.log(`Fetching historical data for ${config.stockSymbol}...`);
      const historicalData = await this.fetchHistoricalData(
        config.stockSymbol,
        config.startDate,
        config.endDate,
        accessToken
      );

      if (!historicalData || historicalData.length === 0) {
        throw new Error('No historical data available for the selected period');
      }

      console.log(`Fetched ${historicalData.length} candles`);

      // 2. Calculate technical indicators
      console.log('Calculating technical indicators...');
      const dataWithIndicators = await this.calculateIndicators(historicalData);

      // 3. Simulate trades based on strategy
      console.log('Simulating trades...');
      const trades = this.simulateTrades(
        dataWithIndicators,
        config.entryConditions,
        config.exitConditions,
        config.initialCapital
      );

      // 4. Calculate performance metrics
      console.log('Calculating performance metrics...');
      const metrics = this.calculateMetrics(trades, config.initialCapital, dataWithIndicators);

      // 5. Build equity curve
      const equityCurve = this.buildEquityCurve(trades, config.initialCapital);

      const executionTime = Date.now() - startTime;

      return {
        strategyName: config.strategyName,
        stockSymbol: config.stockSymbol,
        companyName: historicalData[0]?.tradingsymbol || config.stockSymbol,
        startDate: config.startDate,
        endDate: config.endDate,
        initialCapital: config.initialCapital,
        finalCapital: metrics.finalCapital,
        totalReturn: metrics.totalReturn,
        totalReturnPct: metrics.totalReturnPct,
        totalTrades: trades.length,
        winningTrades: metrics.winningTrades,
        losingTrades: metrics.losingTrades,
        winRate: metrics.winRate,
        avgProfitPerTrade: metrics.avgProfitPerTrade,
        avgLossPerTrade: metrics.avgLossPerTrade,
        profitFactor: metrics.profitFactor,
        largestWin: metrics.largestWin,
        largestLoss: metrics.largestLoss,
        maxDrawdown: metrics.maxDrawdown,
        maxDrawdownAmount: metrics.maxDrawdownAmount,
        sharpeRatio: metrics.sharpeRatio,
        avgTradeDuration: metrics.avgTradeDuration,
        tradeHistory: trades,
        equityCurve,
        executionTime,
        entryConditions: config.entryConditions,
        exitConditions: config.exitConditions,
      };
    } catch (error: any) {
      console.error('Backtest failed:', error);
      throw new Error(error.message || 'Failed to run backtest');
    }
  }

  /**
   * Fetch historical data from Kite API
   */
  private async fetchHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string,
    accessToken: string
  ): Promise<any[]> {
    try {
      console.log(`[Backtest] Using accessToken: ${accessToken ? accessToken.substring(0, 10) + '...' : 'EMPTY'}`);
      const kite = createKiteService(accessToken);

      // Get all NSE instruments and find the matching symbol
      const instruments = await kite.getInstruments('NSE');
      const instrument = instruments.find(
        (inst: any) => inst.tradingsymbol === symbol.toUpperCase()
      );

      if (!instrument) {
        throw new Error(`Instrument not found: ${symbol}`);
      }

      // Fetch historical data (daily candles)
      const data = await kite.getHistoricalData(
        instrument.instrument_token.toString(),
        'day',
        startDate,
        endDate
      );

      return data;
    } catch (error: any) {
      console.error('Failed to fetch historical data:', error);
      throw error;
    }
  }

  /**
   * Calculate technical indicators for historical data
   */
  private async calculateIndicators(historicalData: any[]): Promise<any[]> {
    const closePrices = historicalData.map((candle) => candle.close);

    // Calculate RSI (14 period)
    const rsiValues = RSI.calculate({ values: closePrices, period: 14 });

    // Calculate MACD (12, 26, 9)
    const macdData = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });

    // Calculate SMA (50 period)
    const sma50 = SMA.calculate({ values: closePrices, period: 50 });

    // Calculate EMA (20 period)
    const ema20 = EMA.calculate({ values: closePrices, period: 20 });

    // Pad arrays to match historicalData length (indicators have fewer values at start)
    const rsiPadded = [...Array(closePrices.length - rsiValues.length).fill(null), ...rsiValues];
    const macdPadded = [...Array(closePrices.length - macdData.length).fill(null), ...macdData];
    const sma50Padded = [...Array(closePrices.length - sma50.length).fill(null), ...sma50];
    const ema20Padded = [...Array(closePrices.length - ema20.length).fill(null), ...ema20];

    // Attach indicators to each candle
    return historicalData.map((candle, index) => ({
      ...candle,
      rsi: rsiPadded[index],
      macd: macdPadded[index]?.MACD,
      macdSignal: macdPadded[index]?.signal,
      macdHistogram: macdPadded[index]?.histogram,
      sma50: sma50Padded[index],
      ema20: ema20Padded[index],
    }));
  }

  /**
   * Simulate trades based on strategy conditions
   */
  private simulateTrades(
    data: any[],
    entryConditions: StrategyCondition[],
    exitConditions: ExitCondition[],
    initialCapital: number
  ): Trade[] {
    const trades: Trade[] = [];
    let cash = initialCapital;
    let position: any = null; // Current open position

    for (let i = 0; i < data.length; i++) {
      const candle = data[i];

      // Check exit conditions if we have an open position
      if (position) {
        const shouldExit = this.checkExitConditions(
          position,
          candle,
          exitConditions,
          i - position.entryIndex
        );

        if (shouldExit) {
          // Exit position
          const exitPrice = candle.close;
          const pnl = (exitPrice - position.entryPrice) * position.quantity;
          const pnlPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
          const holdingPeriod = i - position.entryIndex;

          trades.push({
            entryDate: position.entryDate,
            exitDate: candle.date,
            entryPrice: position.entryPrice,
            exitPrice,
            quantity: position.quantity,
            pnl,
            pnlPct,
            type: pnl >= 0 ? 'WIN' : 'LOSS',
            holdingPeriod,
          });

          // Update cash
          cash += exitPrice * position.quantity;
          position = null;
        }
      }

      // Check entry conditions if we don't have a position
      if (!position && this.checkEntryConditions(candle, entryConditions, data, i)) {
        // Enter position
        const entryPrice = candle.close;
        const quantity = Math.floor(cash / entryPrice); // Buy as many shares as possible

        if (quantity > 0) {
          position = {
            entryDate: candle.date,
            entryPrice,
            quantity,
            entryIndex: i,
          };

          // Update cash
          cash -= entryPrice * quantity;
        }
      }
    }

    // Close any open position at the end
    if (position) {
      const lastCandle = data[data.length - 1];
      const exitPrice = lastCandle.close;
      const pnl = (exitPrice - position.entryPrice) * position.quantity;
      const pnlPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
      const holdingPeriod = data.length - 1 - position.entryIndex;

      trades.push({
        entryDate: position.entryDate,
        exitDate: lastCandle.date,
        entryPrice: position.entryPrice,
        exitPrice,
        quantity: position.quantity,
        pnl,
        pnlPct,
        type: pnl >= 0 ? 'WIN' : 'LOSS',
        holdingPeriod,
      });
    }

    return trades;
  }

  /**
   * Check if entry conditions are met
   */
  private checkEntryConditions(
    candle: any,
    conditions: StrategyCondition[],
    data: any[],
    currentIndex: number
  ): boolean {
    if (conditions.length === 0) return false;

    let result = this.evaluateCondition(candle, conditions[0], data, currentIndex);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(candle, condition, data, currentIndex);

      if (condition.combinator === 'OR') {
        result = result || conditionResult;
      } else {
        // Default to AND
        result = result && conditionResult;
      }
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    candle: any,
    condition: StrategyCondition,
    data: any[],
    currentIndex: number
  ): boolean {
    const { indicator, operator, value } = condition;

    // Get indicator value
    let indicatorValue: number | undefined;

    switch (indicator) {
      case 'RSI':
        indicatorValue = candle.rsi;
        break;
      case 'MACD':
        indicatorValue = candle.macd;
        break;
      case 'SMA':
        indicatorValue = candle.sma50;
        break;
      case 'EMA':
        indicatorValue = candle.ema20;
        break;
      case 'PRICE':
        indicatorValue = candle.close;
        break;
    }

    if (indicatorValue === undefined || indicatorValue === null) {
      return false;
    }

    // Handle crossover/crossunder (requires previous candle)
    if (operator === 'crossover' && currentIndex > 0) {
      const prevCandle = data[currentIndex - 1];
      const prevMACD = prevCandle.macd;
      const prevSignal = prevCandle.macdSignal;
      const currentMACD = candle.macd;
      const currentSignal = candle.macdSignal;

      // MACD crosses above signal line
      return prevMACD <= prevSignal && currentMACD > currentSignal;
    }

    if (operator === 'crossunder' && currentIndex > 0) {
      const prevCandle = data[currentIndex - 1];
      const prevMACD = prevCandle.macd;
      const prevSignal = prevCandle.macdSignal;
      const currentMACD = candle.macd;
      const currentSignal = candle.macdSignal;

      // MACD crosses below signal line
      return prevMACD >= prevSignal && currentMACD < currentSignal;
    }

    // Handle comparison operators
    const targetValue = typeof value === 'number' ? value : parseFloat(value as string);

    switch (operator) {
      case '<':
        return indicatorValue < targetValue;
      case '>':
        return indicatorValue > targetValue;
      case '=':
        return Math.abs(indicatorValue - targetValue) < 0.01; // Allow small epsilon
      default:
        return false;
    }
  }

  /**
   * Check if exit conditions are met
   */
  private checkExitConditions(
    position: any,
    candle: any,
    exitConditions: ExitCondition[],
    daysHeld: number
  ): boolean {
    for (const condition of exitConditions) {
      if (condition.type === 'profit_target') {
        const pnlPct = ((candle.close - position.entryPrice) / position.entryPrice) * 100;
        if (pnlPct >= condition.value) {
          return true;
        }
      }

      if (condition.type === 'stop_loss') {
        const pnlPct = ((candle.close - position.entryPrice) / position.entryPrice) * 100;
        if (pnlPct <= -condition.value) {
          return true;
        }
      }

      if (condition.type === 'time_based') {
        if (daysHeld >= condition.value) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(trades: Trade[], initialCapital: number, data: any[]): any {
    if (trades.length === 0) {
      return {
        finalCapital: initialCapital,
        totalReturn: 0,
        totalReturnPct: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgProfitPerTrade: 0,
        avgLossPerTrade: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
        maxDrawdown: 0,
        maxDrawdownAmount: 0,
      };
    }

    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const finalCapital = initialCapital + totalPnL;
    const totalReturnPct = (totalPnL / initialCapital) * 100;

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);

    const winRate = (winningTrades.length / trades.length) * 100;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgProfitPerTrade =
      winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLossPerTrade = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.pnl)) : 0;
    const largestLoss =
      losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.pnl)) : 0;

    // Calculate max drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    let maxDrawdownAmount = 0;
    let runningCapital = initialCapital;

    for (const trade of trades) {
      runningCapital += trade.pnl;

      if (runningCapital > peak) {
        peak = runningCapital;
      }

      const drawdown = peak - runningCapital;
      const drawdownPct = (drawdown / peak) * 100;

      if (drawdownPct > maxDrawdown) {
        maxDrawdown = drawdownPct;
        maxDrawdownAmount = drawdown;
      }
    }

    // Calculate Sharpe Ratio (simplified)
    const returns = trades.map((t) => t.pnlPct);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Calculate average trade duration
    const avgTradeDuration =
      trades.reduce((sum, t) => sum + t.holdingPeriod, 0) / trades.length;

    return {
      finalCapital,
      totalReturn: totalPnL,
      totalReturnPct,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgProfitPerTrade,
      avgLossPerTrade,
      profitFactor,
      largestWin,
      largestLoss,
      maxDrawdown,
      maxDrawdownAmount,
      sharpeRatio,
      avgTradeDuration,
    };
  }

  /**
   * Build equity curve data
   */
  private buildEquityCurve(
    trades: Trade[],
    initialCapital: number
  ): Array<{ date: string; portfolioValue: number; cash: number; position: number }> {
    const equityCurve: any[] = [];
    let cash = initialCapital;
    let position = 0;

    // Start with initial capital
    if (trades.length > 0) {
      equityCurve.push({
        date: trades[0].entryDate,
        portfolioValue: initialCapital,
        cash: initialCapital,
        position: 0,
      });
    }

    // Build curve from trades
    for (const trade of trades) {
      // Entry
      cash -= trade.entryPrice * trade.quantity;
      position = trade.quantity;

      equityCurve.push({
        date: trade.entryDate,
        portfolioValue: cash + trade.entryPrice * trade.quantity,
        cash,
        position,
      });

      // Exit
      cash += trade.exitPrice * trade.quantity;
      position = 0;

      equityCurve.push({
        date: trade.exitDate,
        portfolioValue: cash,
        cash,
        position,
      });
    }

    return equityCurve;
  }
}

module.exports = new BacktestService();
