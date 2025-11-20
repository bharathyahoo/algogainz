/**
 * Utility functions for financial calculations in AlgoGainz
 */

import type { Transaction, TransactionCharges, Holding } from '../types';

/**
 * Calculate total charges for a transaction
 * @param charges - Transaction charges object
 * @returns Total charges amount
 */
export const calculateTotalCharges = (charges: TransactionCharges): number => {
  return (
    (charges.brokerage || 0) +
    (charges.exchangeCharges || 0) +
    (charges.gst || 0) +
    (charges.sebiCharges || 0) +
    (charges.stampDuty || 0)
  );
};

/**
 * Calculate net amount for a transaction
 * @param type - Transaction type ('BUY' or 'SELL')
 * @param grossAmount - Gross amount (price * quantity)
 * @param totalCharges - Total charges
 * @returns Net amount
 */
export const calculateNetAmount = (
  type: 'BUY' | 'SELL',
  grossAmount: number,
  totalCharges: number
): number => {
  // For BUY: Net = Gross + Charges (money going out)
  // For SELL: Net = Gross - Charges (money coming in)
  return type === 'BUY' ? grossAmount + totalCharges : grossAmount - totalCharges;
};

/**
 * Calculate P&L for a single buy-sell pair using FIFO
 * @param buyTransaction - Buy transaction
 * @param sellTransaction - Sell transaction
 * @param quantity - Quantity being matched
 * @returns P&L amount
 */
export const calculatePairPnL = (
  buyPrice: number,
  buyCharges: number,
  sellPrice: number,
  sellCharges: number,
  quantity: number
): number => {
  // Buy Cost = (Price × Quantity) + Charges
  const buyCost = buyPrice * quantity + buyCharges;

  // Sell Proceeds = (Price × Quantity) - Charges
  const sellProceeds = sellPrice * quantity - sellCharges;

  // P&L = Sell Proceeds - Buy Cost
  return sellProceeds - buyCost;
};

/**
 * Calculate average buy price from transactions
 * @param transactions - Array of BUY transactions
 * @returns Average buy price
 */
export const calculateAverageBuyPrice = (
  transactions: Array<{ pricePerShare: number; quantity: number; charges: TransactionCharges }>
): number => {
  if (transactions.length === 0) return 0;

  const totalQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0);
  if (totalQuantity === 0) return 0;

  const totalCost = transactions.reduce((sum, t) => {
    const charges = calculateTotalCharges(t.charges);
    return sum + t.pricePerShare * t.quantity + charges;
  }, 0);

  return totalCost / totalQuantity;
};

/**
 * Calculate holding quantity from transactions
 * @param transactions - All transactions for a stock
 * @returns Current holding quantity
 */
export const calculateHoldingQuantity = (
  transactions: Array<{ type: 'BUY' | 'SELL'; quantity: number }>
): number => {
  return transactions.reduce((total, t) => {
    return t.type === 'BUY' ? total + t.quantity : total - t.quantity;
  }, 0);
};

/**
 * Calculate unrealized P&L for a holding
 * @param quantity - Current holding quantity
 * @param avgBuyPrice - Average buy price (includes charges)
 * @param currentPrice - Current market price
 * @returns Unrealized P&L
 */
export const calculateUnrealizedPnL = (
  quantity: number,
  avgBuyPrice: number,
  currentPrice: number
): number => {
  const currentValue = currentPrice * quantity;
  const totalInvested = avgBuyPrice * quantity;
  return currentValue - totalInvested;
};

/**
 * Calculate unrealized P&L percentage
 * @param unrealizedPnL - Unrealized P&L amount
 * @param totalInvested - Total amount invested
 * @returns P&L percentage
 */
export const calculatePnLPercentage = (
  unrealizedPnL: number,
  totalInvested: number
): number => {
  if (totalInvested === 0) return 0;
  return (unrealizedPnL / totalInvested) * 100;
};

/**
 * Calculate day change percentage
 * @param currentPrice - Current price
 * @param previousClose - Previous close price
 * @returns Day change percentage
 */
export const calculateDayChangePercent = (
  currentPrice: number,
  previousClose: number
): number => {
  if (previousClose === 0) return 0;
  return ((currentPrice - previousClose) / previousClose) * 100;
};

/**
 * Calculate profit target price
 * @param avgBuyPrice - Average buy price
 * @param profitTargetPct - Profit target percentage
 * @returns Target price
 */
export const calculateProfitTargetPrice = (
  avgBuyPrice: number,
  profitTargetPct: number
): number => {
  return avgBuyPrice * (1 + profitTargetPct / 100);
};

/**
 * Calculate stop loss price
 * @param avgBuyPrice - Average buy price
 * @param stopLossPct - Stop loss percentage
 * @returns Stop loss price
 */
export const calculateStopLossPrice = (avgBuyPrice: number, stopLossPct: number): number => {
  return avgBuyPrice * (1 - stopLossPct / 100);
};

/**
 * Check if profit target is hit
 * @param currentPrice - Current market price
 * @param targetPrice - Profit target price
 * @returns True if target is hit
 */
export const isProfitTargetHit = (currentPrice: number, targetPrice: number): boolean => {
  return currentPrice >= targetPrice;
};

/**
 * Check if stop loss is hit
 * @param currentPrice - Current market price
 * @param stopLossPrice - Stop loss price
 * @returns True if stop loss is hit
 */
export const isStopLossHit = (currentPrice: number, stopLossPrice: number): boolean => {
  return currentPrice <= stopLossPrice;
};

/**
 * Calculate win rate
 * @param winningTrades - Number of winning trades
 * @param totalTrades - Total number of trades
 * @returns Win rate percentage
 */
export const calculateWinRate = (winningTrades: number, totalTrades: number): number => {
  if (totalTrades === 0) return 0;
  return (winningTrades / totalTrades) * 100;
};

/**
 * Calculate Sharpe Ratio (simplified version)
 * @param returns - Array of periodic returns
 * @param riskFreeRate - Risk-free rate (default: 6% for India)
 * @returns Sharpe ratio
 */
export const calculateSharpeRatio = (
  returns: number[],
  riskFreeRate: number = 0.06
): number => {
  if (returns.length === 0) return 0;

  // Calculate average return
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calculate standard deviation
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Sharpe Ratio = (Average Return - Risk Free Rate) / Standard Deviation
  return (avgReturn - riskFreeRate / 12) / stdDev; // Monthly risk-free rate
};

/**
 * Calculate maximum drawdown
 * @param values - Array of portfolio values over time
 * @returns Maximum drawdown percentage
 */
export const calculateMaxDrawdown = (values: number[]): number => {
  if (values.length === 0) return 0;

  let maxDrawdown = 0;
  let peak = values[0];

  for (const value of values) {
    if (value > peak) {
      peak = value;
    }

    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
};

/**
 * Calculate portfolio return percentage
 * @param totalInvested - Total amount invested
 * @param currentValue - Current portfolio value
 * @returns Return percentage
 */
export const calculatePortfolioReturn = (
  totalInvested: number,
  currentValue: number
): number => {
  if (totalInvested === 0) return 0;
  return ((currentValue - totalInvested) / totalInvested) * 100;
};

/**
 * Calculate average profit per trade
 * @param totalPnL - Total P&L (realized)
 * @param totalTrades - Total number of trades
 * @returns Average profit per trade
 */
export const calculateAvgProfitPerTrade = (
  totalPnL: number,
  totalTrades: number
): number => {
  if (totalTrades === 0) return 0;
  return totalPnL / totalTrades;
};

/**
 * Calculate profit factor
 * @param grossProfit - Total profit from winning trades
 * @param grossLoss - Total loss from losing trades
 * @returns Profit factor
 */
export const calculateProfitFactor = (grossProfit: number, grossLoss: number): number => {
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / Math.abs(grossLoss);
};

/**
 * Calculate position size based on risk percentage
 * @param accountSize - Total account size
 * @param riskPercent - Risk percentage per trade (e.g., 2%)
 * @param entryPrice - Entry price per share
 * @param stopLossPrice - Stop loss price per share
 * @returns Suggested quantity
 */
export const calculatePositionSize = (
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number
): number => {
  const riskAmount = accountSize * (riskPercent / 100);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);

  if (riskPerShare === 0) return 0;

  return Math.floor(riskAmount / riskPerShare);
};

/**
 * Calculate annualized return
 * @param totalReturn - Total return percentage
 * @param days - Number of days invested
 * @returns Annualized return percentage
 */
export const calculateAnnualizedReturn = (totalReturn: number, days: number): number => {
  if (days === 0) return 0;
  const years = days / 365;
  return ((Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100);
};

/**
 * Calculate compound annual growth rate (CAGR)
 * @param beginningValue - Beginning portfolio value
 * @param endingValue - Ending portfolio value
 * @param years - Number of years
 * @returns CAGR percentage
 */
export const calculateCAGR = (
  beginningValue: number,
  endingValue: number,
  years: number
): number => {
  if (beginningValue === 0 || years === 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
};

/**
 * Check if transaction quantity is valid for sell
 * @param sellQuantity - Quantity to sell
 * @param availableQuantity - Available holding quantity
 * @returns True if valid
 */
export const isValidSellQuantity = (
  sellQuantity: number,
  availableQuantity: number
): boolean => {
  return sellQuantity > 0 && sellQuantity <= availableQuantity;
};

/**
 * Round to specified decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export const roundTo = (value: number, decimals: number = 2): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};
