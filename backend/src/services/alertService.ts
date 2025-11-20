/**
 * Alert Monitoring Service
 * Monitors holdings against exit strategies and triggers alerts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Alert {
  id: string;
  userId: string;
  holdingId: string;
  stockSymbol: string;
  companyName: string;
  type: 'PROFIT_TARGET' | 'STOP_LOSS';
  targetPrice: number;
  currentPrice: number;
  targetPercent: number;
  quantity: number;
  avgBuyPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  message: string;
  timestamp: Date;
}

export class AlertService {
  /**
   * Check all holdings against their exit strategies
   * Returns array of triggered alerts
   */
  async checkExitStrategies(): Promise<Alert[]> {
    try {
      // Fetch all holdings with active exit strategies
      const holdings = await prisma.holding.findMany({
        where: {
          exitStrategy: {
            alertEnabled: true,
            OR: [
              { profitAlertTriggered: false },
              { stopLossAlertTriggered: false },
            ],
          },
        },
        include: {
          exitStrategy: true,
          user: {
            select: {
              id: true,
              kiteUserId: true,
            },
          },
        },
      });

      const alerts: Alert[] = [];

      for (const holding of holdings) {
        if (!holding.exitStrategy || !holding.currentPrice) {
          continue; // Skip if no exit strategy or no current price
        }

        const { exitStrategy, currentPrice, avgBuyPrice, quantity } = holding;

        // Check profit target
        if (
          exitStrategy.profitTargetPrice &&
          !exitStrategy.profitAlertTriggered &&
          currentPrice >= exitStrategy.profitTargetPrice
        ) {
          const unrealizedPnL = (currentPrice - avgBuyPrice) * quantity;
          const unrealizedPnLPct = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;

          alerts.push({
            id: holding.id,
            userId: holding.userId,
            holdingId: holding.id,
            stockSymbol: holding.stockSymbol,
            companyName: holding.companyName,
            type: 'PROFIT_TARGET',
            targetPrice: exitStrategy.profitTargetPrice,
            currentPrice,
            targetPercent: exitStrategy.profitTargetPct || 0,
            quantity,
            avgBuyPrice,
            unrealizedPnL,
            unrealizedPnLPct,
            message: `${holding.companyName} has reached your profit target of ${exitStrategy.profitTargetPct}% (₹${exitStrategy.profitTargetPrice.toFixed(2)})`,
            timestamp: new Date(),
          });

          // Mark profit alert as triggered
          await prisma.exitStrategy.update({
            where: { id: exitStrategy.id },
            data: { profitAlertTriggered: true },
          });
        }

        // Check stop loss
        if (
          exitStrategy.stopLossPrice &&
          !exitStrategy.stopLossAlertTriggered &&
          currentPrice <= exitStrategy.stopLossPrice
        ) {
          const unrealizedPnL = (currentPrice - avgBuyPrice) * quantity;
          const unrealizedPnLPct = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;

          alerts.push({
            id: holding.id,
            userId: holding.userId,
            holdingId: holding.id,
            stockSymbol: holding.stockSymbol,
            companyName: holding.companyName,
            type: 'STOP_LOSS',
            targetPrice: exitStrategy.stopLossPrice,
            currentPrice,
            targetPercent: exitStrategy.stopLossPct || 0,
            quantity,
            avgBuyPrice,
            unrealizedPnL,
            unrealizedPnLPct,
            message: `${holding.companyName} has hit your stop loss of ${exitStrategy.stopLossPct}% (₹${exitStrategy.stopLossPrice.toFixed(2)})`,
            timestamp: new Date(),
          });

          // Mark stop loss alert as triggered
          await prisma.exitStrategy.update({
            where: { id: exitStrategy.id },
            data: { stopLossAlertTriggered: true },
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking exit strategies:', error);
      return [];
    }
  }

  /**
   * Reset alert flags for a specific holding
   * Called when user edits exit strategy or resets alerts
   */
  async resetAlerts(holdingId: string): Promise<void> {
    try {
      await prisma.exitStrategy.updateMany({
        where: { holdingId },
        data: {
          profitAlertTriggered: false,
          stopLossAlertTriggered: false,
        },
      });
    } catch (error) {
      console.error('Error resetting alerts:', error);
    }
  }

  /**
   * Update holding's current price and unrealized P&L
   * Called when new price data is received
   */
  async updateHoldingPrice(
    userId: string,
    stockSymbol: string,
    currentPrice: number
  ): Promise<void> {
    try {
      const holding = await prisma.holding.findUnique({
        where: {
          userId_stockSymbol: {
            userId,
            stockSymbol,
          },
        },
      });

      if (!holding) {
        return; // No holding found
      }

      const currentValue = currentPrice * holding.quantity;
      const unrealizedPnL = currentValue - holding.totalInvested;
      const unrealizedPnLPct = (unrealizedPnL / holding.totalInvested) * 100;

      await prisma.holding.update({
        where: { id: holding.id },
        data: {
          currentPrice,
          currentValue,
          unrealizedPnL,
          unrealizedPnLPct,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error updating holding price for ${stockSymbol}:`, error);
    }
  }

  /**
   * Get all active alerts for a user
   */
  async getActiveAlerts(userId: string): Promise<Alert[]> {
    try {
      const holdings = await prisma.holding.findMany({
        where: {
          userId,
          exitStrategy: {
            alertEnabled: true,
            OR: [
              { profitAlertTriggered: true },
              { stopLossAlertTriggered: true },
            ],
          },
        },
        include: {
          exitStrategy: true,
        },
      });

      const alerts: Alert[] = [];

      for (const holding of holdings) {
        if (!holding.exitStrategy || !holding.currentPrice) {
          continue;
        }

        const { exitStrategy, currentPrice, avgBuyPrice, quantity } = holding;
        const unrealizedPnL = (currentPrice - avgBuyPrice) * quantity;
        const unrealizedPnLPct = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;

        if (exitStrategy.profitAlertTriggered && exitStrategy.profitTargetPrice) {
          alerts.push({
            id: holding.id,
            userId: holding.userId,
            holdingId: holding.id,
            stockSymbol: holding.stockSymbol,
            companyName: holding.companyName,
            type: 'PROFIT_TARGET',
            targetPrice: exitStrategy.profitTargetPrice,
            currentPrice,
            targetPercent: exitStrategy.profitTargetPct || 0,
            quantity,
            avgBuyPrice,
            unrealizedPnL,
            unrealizedPnLPct,
            message: `${holding.companyName} has reached your profit target`,
            timestamp: holding.lastUpdated,
          });
        }

        if (exitStrategy.stopLossAlertTriggered && exitStrategy.stopLossPrice) {
          alerts.push({
            id: holding.id,
            userId: holding.userId,
            holdingId: holding.id,
            stockSymbol: holding.stockSymbol,
            companyName: holding.companyName,
            type: 'STOP_LOSS',
            targetPrice: exitStrategy.stopLossPrice,
            currentPrice,
            targetPercent: exitStrategy.stopLossPct || 0,
            quantity,
            avgBuyPrice,
            unrealizedPnL,
            unrealizedPnLPct,
            message: `${holding.companyName} has hit your stop loss`,
            timestamp: holding.lastUpdated,
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Dismiss a specific alert
   * Note: This keeps the trigger flag as TRUE (already triggered) to prevent re-triggering.
   * Use resetAlerts() if you want to allow the alert to trigger again.
   */
  async dismissAlert(holdingId: string, type: 'PROFIT_TARGET' | 'STOP_LOSS'): Promise<void> {
    try {
      // Do NOT reset the trigger flag - it should remain true to prevent re-triggering
      // This is just a client-side UI dismissal
      // The flag stays true meaning "this alert has already been triggered"
      console.log(`Alert dismissed (keeping trigger flag active): ${holdingId} - ${type}`);
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }
}

export const alertService = new AlertService();
