/**
 * Unit Tests for Report Service - FIFO P&L Calculation
 * Tests the critical FIFO (First In First Out) P&L matching algorithm
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Transaction type
type Transaction = {
  id: string;
  userId: string;
  stockSymbol: string;
  companyName: string;
  type: string;
  quantity: number;
  pricePerShare: number;
  grossAmount: number;
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
  totalCharges: number;
  netAmount: number;
  source: string;
  orderIdRef: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
};

// FIFO P&L Calculation Logic (copied from reportService.ts for testing)
function calculateFIFOPnL(buyTransactions: Transaction[], sellTransactions: Transaction[]): number {
  let totalPnL = 0;

  type BuyWithRemaining = Transaction & { remainingQty?: number };
  const buyQueue: BuyWithRemaining[] = [...buyTransactions].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const sell of sellTransactions) {
    let remainingQty = sell.quantity;

    while (remainingQty > 0 && buyQueue.length > 0) {
      const buy = buyQueue[0];

      if (!buy.remainingQty) {
        buy.remainingQty = buy.quantity;
      }

      const qtyToMatch = Math.min(remainingQty, buy.remainingQty);

      // Calculate P&L for this matched pair
      const buyCost = (buy.pricePerShare * qtyToMatch) +
                      (buy.totalCharges * qtyToMatch / buy.quantity);
      const sellProceeds = (sell.pricePerShare * qtyToMatch) -
                           (sell.totalCharges * qtyToMatch / sell.quantity);

      totalPnL += sellProceeds - buyCost;

      buy.remainingQty -= qtyToMatch;
      remainingQty -= qtyToMatch;

      if (buy.remainingQty <= 0) {
        buyQueue.shift();
      }
    }
  }

  return totalPnL;
}

// Helper function to create mock transactions
function createMockTransaction(
  type: 'BUY' | 'SELL',
  quantity: number,
  pricePerShare: number,
  timestamp: Date,
  charges: {
    brokerage?: number;
    exchangeCharges?: number;
    gst?: number;
    sebiCharges?: number;
    stampDuty?: number;
  } = {}
): Transaction {
  const {
    brokerage = 20,
    exchangeCharges = 5,
    gst = 4.5,
    sebiCharges = 0.1,
    stampDuty = 5
  } = charges;

  const totalCharges = brokerage + exchangeCharges + gst + sebiCharges + stampDuty;
  const grossAmount = pricePerShare * quantity;
  const netAmount = type === 'BUY'
    ? grossAmount + totalCharges
    : grossAmount - totalCharges;

  return {
    id: `txn-${Date.now()}-${Math.random()}`,
    userId: 'test-user-123',
    stockSymbol: 'RELIANCE',
    companyName: 'Reliance Industries',
    type,
    quantity,
    pricePerShare,
    grossAmount,
    brokerage,
    exchangeCharges,
    gst,
    sebiCharges,
    stampDuty,
    totalCharges,
    netAmount,
    source: 'APP_EXECUTED',
    orderIdRef: null,
    timestamp,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('FIFO P&L Calculation', () => {
  describe('Basic Scenarios', () => {
    it('should calculate profit for simple buy-sell pair', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01'))
      ];
      const sells = [
        createMockTransaction('SELL', 10, 110, new Date('2025-01-02'))
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Expected: (110 * 10 - 34.6) - (100 * 10 + 34.6) = 1065.4 - 1034.6 = 30.8
      // Sell proceeds: 1100 - 34.6 = 1065.4
      // Buy cost: 1000 + 34.6 = 1034.6
      expect(pnl).toBeCloseTo(30.8, 1);
    });

    it('should calculate loss for simple buy-sell pair', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01'))
      ];
      const sells = [
        createMockTransaction('SELL', 10, 90, new Date('2025-01-02'))
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Expected: (90 * 10 - 34.6) - (100 * 10 + 34.6) = 865.4 - 1034.6 = -169.2
      expect(pnl).toBeCloseTo(-169.2, 1);
    });

    it('should return 0 P&L when no sell transactions', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01'))
      ];
      const sells: Transaction[] = [];

      const pnl = calculateFIFOPnL(buys, sells);

      expect(pnl).toBe(0);
    });

    it('should return 0 P&L when no buy transactions', () => {
      const buys: Transaction[] = [];
      const sells = [
        createMockTransaction('SELL', 10, 100, new Date('2025-01-01'))
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      expect(pnl).toBe(0);
    });
  });

  describe('FIFO Ordering', () => {
    it('should match sells with earliest buys first (FIFO)', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')), // First buy at 100
        createMockTransaction('BUY', 10, 120, new Date('2025-01-02')), // Second buy at 120
      ];
      const sells = [
        createMockTransaction('SELL', 10, 110, new Date('2025-01-03')), // Sell 10 at 110
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Should match with first buy (at 100), not second (at 120)
      // Expected: (110 * 10 - 34.6) - (100 * 10 + 34.6) = 30.8
      expect(pnl).toBeCloseTo(30.8, 1);
    });

    it('should handle out-of-order buy transactions correctly', () => {
      // Buys added in wrong order but should still follow FIFO by timestamp
      const buys = [
        createMockTransaction('BUY', 10, 120, new Date('2025-01-02')), // Second buy (added first)
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')), // First buy (added second)
      ];
      const sells = [
        createMockTransaction('SELL', 10, 110, new Date('2025-01-03')),
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Should still match with earliest buy (at 100), not 120
      expect(pnl).toBeCloseTo(30.8, 1);
    });
  });

  describe('Partial Sells', () => {
    it('should handle partial sell of first buy', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')),
      ];
      const sells = [
        createMockTransaction('SELL', 5, 110, new Date('2025-01-02')),
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Sell proceeds: (110 * 5) - (34.6 * 5/5) = 550 - 34.6 = 515.4
      // Buy cost: (100 * 5) + (34.6 * 5/10) = 500 + 17.3 = 517.3
      // P&L = 515.4 - 517.3 = -1.9
      expect(pnl).toBeCloseTo(-1.9, 1);
    });

    it('should handle multiple partial sells from same buy', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')),
      ];
      const sells = [
        createMockTransaction('SELL', 3, 105, new Date('2025-01-02')),
        createMockTransaction('SELL', 4, 110, new Date('2025-01-03')),
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // First sell (3 shares): (105 * 3) - (34.6 * 3/3) = 315 - 34.6 = 280.4
      // Buy cost (3 shares): (100 * 3) + (34.6 * 3/10) = 300 + 10.38 = 310.38
      // P&L1 = 280.4 - 310.38 = -29.98

      // Second sell (4 shares): (110 * 4) - (34.6 * 4/4) = 440 - 34.6 = 405.4
      // Buy cost (4 shares): (100 * 4) + (34.6 * 4/10) = 400 + 13.84 = 413.84
      // P&L2 = 405.4 - 413.84 = -8.44

      // Total: -29.98 + -8.44 = -38.42
      expect(pnl).toBeCloseTo(-38.42, 1);
    });

    it('should handle sell quantity spanning multiple buys', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')),
        createMockTransaction('BUY', 10, 105, new Date('2025-01-02')),
      ];
      const sells = [
        createMockTransaction('SELL', 15, 110, new Date('2025-01-03')),
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // First 10 from first buy: (110 * 10 - 23.07) - (100 * 10 + 34.6) = 1076.93 - 1034.6 = 42.33
      // Next 5 from second buy: (110 * 5 - 11.53) - (105 * 5 + 17.3) = 538.47 - 542.3 = -3.83
      // Total: 42.33 - 3.83 = 38.5
      expect(pnl).toBeCloseTo(38.5, 1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple buys and sells with varying prices', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')),
        createMockTransaction('BUY', 5, 110, new Date('2025-01-03')),
        createMockTransaction('BUY', 8, 105, new Date('2025-01-05')),
      ];
      const sells = [
        createMockTransaction('SELL', 7, 115, new Date('2025-01-02')),
        createMockTransaction('SELL', 10, 120, new Date('2025-01-04')),
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Complex calculation:
      // First sell (7 shares at 115): matches with first buy (100)
      // Second sell (10 shares at 120): 3 from first buy (100) + 5 from second buy (110) + 2 from third buy (105)
      expect(pnl).toBeGreaterThan(0); // Should be profitable
    });

    it('should handle alternating buy-sell-buy-sell pattern', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')),
        createMockTransaction('BUY', 10, 110, new Date('2025-01-03')),
      ];
      const sells = [
        createMockTransaction('SELL', 5, 105, new Date('2025-01-02')),
        createMockTransaction('SELL', 10, 115, new Date('2025-01-04')),
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // First sell (5 at 105): from first buy (100)
      // Second sell (10 at 115): 5 from first buy (100) + 5 from second buy (110)
      expect(pnl).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sell quantity exceeding buy quantity', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01')),
      ];
      const sells = [
        createMockTransaction('SELL', 15, 110, new Date('2025-01-02')),
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Should only match available 10 shares from buy
      // Sell proceeds: (110 * 10) - (34.6 * 10/15) = 1100 - 23.07 = 1076.93
      // Buy cost: (100 * 10) + (34.6 * 10/10) = 1000 + 34.6 = 1034.6
      // P&L = 1076.93 - 1034.6 = 42.33
      expect(pnl).toBeCloseTo(42.33, 1);
    });

    it('should handle zero charges correctly', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01'), {
          brokerage: 0,
          exchangeCharges: 0,
          gst: 0,
          sebiCharges: 0,
          stampDuty: 0
        })
      ];
      const sells = [
        createMockTransaction('SELL', 10, 110, new Date('2025-01-02'), {
          brokerage: 0,
          exchangeCharges: 0,
          gst: 0,
          sebiCharges: 0,
          stampDuty: 0
        })
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Pure price difference: (110 * 10) - (100 * 10) = 100
      expect(pnl).toBe(100);
    });

    it('should handle high charges reducing profit significantly', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01'), {
          brokerage: 200,
          exchangeCharges: 50,
          gst: 45,
          sebiCharges: 10,
          stampDuty: 50
        })
      ];
      const sells = [
        createMockTransaction('SELL', 10, 110, new Date('2025-01-02'), {
          brokerage: 200,
          exchangeCharges: 50,
          gst: 45,
          sebiCharges: 10,
          stampDuty: 50
        })
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // High charges eat into profit: (1100 - 355) - (1000 + 355) = 745 - 1355 = -610
      expect(pnl).toBeCloseTo(-610, 1);
    });

    it('should handle same buy and sell price (break-even minus charges)', () => {
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01'))
      ];
      const sells = [
        createMockTransaction('SELL', 10, 100, new Date('2025-01-02'))
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Should be negative due to charges on both sides
      // (1000 - 34.6) - (1000 + 34.6) = -69.2
      expect(pnl).toBeCloseTo(-69.2, 1);
    });

    it('should handle fractional share quantities correctly', () => {
      const buys = [
        createMockTransaction('BUY', 0.5, 1000, new Date('2025-01-01'))
      ];
      const sells = [
        createMockTransaction('SELL', 0.5, 1100, new Date('2025-01-02'))
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // (1100 * 0.5 - 34.6) - (1000 * 0.5 + 34.6) = 515.4 - 534.6 = -19.2
      expect(pnl).toBeCloseTo(-19.2, 1);
    });
  });

  describe('Charge Distribution', () => {
    it('should distribute charges proportionally for partial sells', () => {
      const totalCharges = 100;
      const buys = [
        createMockTransaction('BUY', 10, 100, new Date('2025-01-01'), {
          brokerage: 50,
          exchangeCharges: 20,
          gst: 18,
          sebiCharges: 2,
          stampDuty: 10
        })
      ];
      const sells = [
        createMockTransaction('SELL', 5, 110, new Date('2025-01-02'), {
          brokerage: 50,
          exchangeCharges: 20,
          gst: 18,
          sebiCharges: 2,
          stampDuty: 10
        })
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Selling 5 shares (entire sell order)
      // Sell proceeds: (110 * 5) - (100 * 5/5) = 550 - 100 = 450
      // Buy cost for 5 shares: (100 * 5) + (100 * 5/10) = 500 + 50 = 550
      // P&L: 450 - 550 = -100
      expect(pnl).toBeCloseTo(-100, 1);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle day trading scenario (same day buy-sell)', () => {
      const timestamp = new Date('2025-01-15T09:30:00');
      const buys = [
        createMockTransaction('BUY', 100, 2500, timestamp)
      ];
      const sellTimestamp = new Date('2025-01-15T15:00:00');
      const sells = [
        createMockTransaction('SELL', 100, 2520, sellTimestamp)
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Quick 20 rupee gain per share, minus charges
      expect(pnl).toBeGreaterThan(0);
      expect(pnl).toBeLessThan(2000); // Should be less than 2000 due to charges
    });

    it('should handle averaging down scenario', () => {
      const buys = [
        createMockTransaction('BUY', 10, 150, new Date('2025-01-01')), // Buy at high
        createMockTransaction('BUY', 20, 100, new Date('2025-01-02')), // Average down
      ];
      const sells = [
        createMockTransaction('SELL', 30, 120, new Date('2025-01-03')), // Sell at middle
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // FIFO: First 10 at 150 (loss), then 20 at 100 (profit)
      // First 10: (120 * 10 - 11.53) - (150 * 10 + 34.6) = 1188.47 - 1534.6 = -346.13
      // Next 20: (120 * 20 - 23.07) - (100 * 20 + 34.6) = 2376.93 - 2034.6 = 342.33
      // Total: -346.13 + 342.33 = -3.8
      expect(pnl).toBeLessThan(0); // Should result in small loss due to charges
    });

    it('should handle long position with multiple adds and exits', () => {
      const buys = [
        createMockTransaction('BUY', 10, 1000, new Date('2025-01-01')),
        createMockTransaction('BUY', 5, 1050, new Date('2025-01-05')),
        createMockTransaction('BUY', 8, 1020, new Date('2025-01-10')),
      ];
      const sells = [
        createMockTransaction('SELL', 6, 1100, new Date('2025-01-07')), // First partial exit
        createMockTransaction('SELL', 10, 1150, new Date('2025-01-15')), // Second partial exit
      ];

      const pnl = calculateFIFOPnL(buys, sells);

      // Complex FIFO matching across multiple transactions
      expect(pnl).toBeGreaterThan(0); // Overall should be profitable
    });
  });
});
