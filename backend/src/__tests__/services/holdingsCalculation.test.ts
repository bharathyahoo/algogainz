/**
 * Unit Tests for Holdings Calculation Logic
 * Tests the critical holdings calculation algorithm
 */

import { describe, it, expect } from '@jest/globals';

/**
 * Holdings Calculation Logic (extracted from transactions.ts for testing)
 */

type Holding = {
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
};

/**
 * Calculate new holding after a BUY transaction
 */
function calculateBuyHolding(
  existingHolding: Holding | null,
  quantity: number,
  pricePerShare: number,
  charges: number
): Holding {
  if (existingHolding) {
    // Update existing holding
    const newQuantity = existingHolding.quantity + quantity;
    const newTotalInvested = existingHolding.totalInvested + (pricePerShare * quantity + charges);
    const newAvgBuyPrice = newTotalInvested / newQuantity;

    return {
      quantity: newQuantity,
      avgBuyPrice: newAvgBuyPrice,
      totalInvested: newTotalInvested,
    };
  } else {
    // Create new holding
    const totalInvested = pricePerShare * quantity + charges;
    return {
      quantity,
      avgBuyPrice: pricePerShare,
      totalInvested,
    };
  }
}

/**
 * Calculate new holding after a SELL transaction
 */
function calculateSellHolding(
  existingHolding: Holding,
  quantity: number
): Holding | null {
  const newQuantity = existingHolding.quantity - quantity;

  if (newQuantity <= 0) {
    // All shares sold
    return null;
  } else {
    // Reduce quantity, keep avg buy price
    const newTotalInvested = existingHolding.avgBuyPrice * newQuantity;
    return {
      quantity: newQuantity,
      avgBuyPrice: existingHolding.avgBuyPrice,
      totalInvested: newTotalInvested,
    };
  }
}

describe('Holdings Calculation', () => {
  describe('Buy Transactions - New Holdings', () => {
    it('should create new holding for first buy', () => {
      const result = calculateBuyHolding(null, 10, 100, 34.6);

      expect(result.quantity).toBe(10);
      expect(result.avgBuyPrice).toBe(100);
      expect(result.totalInvested).toBeCloseTo(1034.6, 2);
    });

    it('should create new holding with zero charges', () => {
      const result = calculateBuyHolding(null, 5, 200, 0);

      expect(result.quantity).toBe(5);
      expect(result.avgBuyPrice).toBe(200);
      expect(result.totalInvested).toBe(1000);
    });

    it('should create new holding with high charges', () => {
      const result = calculateBuyHolding(null, 20, 50, 500);

      expect(result.quantity).toBe(20);
      expect(result.avgBuyPrice).toBe(50);
      expect(result.totalInvested).toBe(1500); // (50 * 20) + 500
    });
  });

  describe('Buy Transactions - Add to Existing Holdings', () => {
    it('should add to existing holding with same price', () => {
      const existing: Holding = {
        quantity: 10,
        avgBuyPrice: 100,
        totalInvested: 1034.6,
      };

      const result = calculateBuyHolding(existing, 10, 100, 34.6);

      expect(result.quantity).toBe(20);
      // With charges included: (1034.6 + 1034.6) / 20 = 103.46
      expect(result.avgBuyPrice).toBeCloseTo(103.46, 2);
      expect(result.totalInvested).toBeCloseTo(2069.2, 2);
    });

    it('should average up when buying at higher price', () => {
      const existing: Holding = {
        quantity: 10,
        avgBuyPrice: 100,
        totalInvested: 1000,
      };

      const result = calculateBuyHolding(existing, 10, 120, 0);

      expect(result.quantity).toBe(20);
      expect(result.avgBuyPrice).toBeCloseTo(110, 2); // (1000 + 1200) / 20 = 110
      expect(result.totalInvested).toBe(2200);
    });

    it('should average down when buying at lower price', () => {
      const existing: Holding = {
        quantity: 10,
        avgBuyPrice: 150,
        totalInvested: 1500,
      };

      const result = calculateBuyHolding(existing, 20, 100, 0);

      expect(result.quantity).toBe(30);
      expect(result.avgBuyPrice).toBeCloseTo(116.67, 2); // (1500 + 2000) / 30 = 116.67
      expect(result.totalInvested).toBe(3500);
    });

    it('should handle averaging with different quantities and charges', () => {
      const existing: Holding = {
        quantity: 5,
        avgBuyPrice: 200,
        totalInvested: 1000,
      };

      const result = calculateBuyHolding(existing, 10, 180, 50);

      expect(result.quantity).toBe(15);
      // Total: 1000 + (180 * 10 + 50) = 1000 + 1850 = 2850
      // Avg: 2850 / 15 = 190
      expect(result.avgBuyPrice).toBeCloseTo(190, 2);
      expect(result.totalInvested).toBe(2850);
    });

    it('should handle multiple small buys accumulating', () => {
      let holding: Holding = {
        quantity: 1,
        avgBuyPrice: 100,
        totalInvested: 100,
      };

      // Add 1 share at 110
      holding = calculateBuyHolding(holding, 1, 110, 0);
      expect(holding.quantity).toBe(2);
      expect(holding.avgBuyPrice).toBeCloseTo(105, 2); // (100 + 110) / 2

      // Add 1 share at 120
      holding = calculateBuyHolding(holding, 1, 120, 0);
      expect(holding.quantity).toBe(3);
      expect(holding.avgBuyPrice).toBeCloseTo(110, 2); // (210 + 120) / 3
    });

    it('should handle fractional averaging correctly', () => {
      const existing: Holding = {
        quantity: 7,
        avgBuyPrice: 142.85714,
        totalInvested: 1000,
      };

      const result = calculateBuyHolding(existing, 3, 150, 10);

      expect(result.quantity).toBe(10);
      // Total: 1000 + (150 * 3 + 10) = 1000 + 460 = 1460
      // Avg: 1460 / 10 = 146
      expect(result.avgBuyPrice).toBeCloseTo(146, 2);
      expect(result.totalInvested).toBeCloseTo(1460, 2);
    });
  });

  describe('Sell Transactions - Partial Sells', () => {
    it('should reduce quantity on partial sell', () => {
      const existing: Holding = {
        quantity: 10,
        avgBuyPrice: 100,
        totalInvested: 1000,
      };

      const result = calculateSellHolding(existing, 5);

      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(5);
      expect(result!.avgBuyPrice).toBe(100); // Avg buy price should remain same
      expect(result!.totalInvested).toBe(500); // 100 * 5
    });

    it('should maintain average buy price after sell', () => {
      const existing: Holding = {
        quantity: 20,
        avgBuyPrice: 125.5,
        totalInvested: 2510,
      };

      const result = calculateSellHolding(existing, 8);

      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(12);
      expect(result!.avgBuyPrice).toBeCloseTo(125.5, 2); // Should remain unchanged
      expect(result!.totalInvested).toBeCloseTo(1506, 2); // 125.5 * 12
    });

    it('should handle selling majority of shares', () => {
      const existing: Holding = {
        quantity: 100,
        avgBuyPrice: 50,
        totalInvested: 5000,
      };

      const result = calculateSellHolding(existing, 99);

      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(1);
      expect(result!.avgBuyPrice).toBe(50);
      expect(result!.totalInvested).toBe(50); // 50 * 1
    });

    it('should handle multiple partial sells', () => {
      let holding: Holding = {
        quantity: 20,
        avgBuyPrice: 110,
        totalInvested: 2200,
      };

      // Sell 5 shares
      holding = calculateSellHolding(holding, 5)!;
      expect(holding.quantity).toBe(15);
      expect(holding.avgBuyPrice).toBe(110);
      expect(holding.totalInvested).toBe(1650); // 110 * 15

      // Sell 8 more shares
      holding = calculateSellHolding(holding, 8)!;
      expect(holding.quantity).toBe(7);
      expect(holding.avgBuyPrice).toBe(110);
      expect(holding.totalInvested).toBe(770); // 110 * 7
    });
  });

  describe('Sell Transactions - Complete Exit', () => {
    it('should return null when selling exact quantity', () => {
      const existing: Holding = {
        quantity: 10,
        avgBuyPrice: 100,
        totalInvested: 1000,
      };

      const result = calculateSellHolding(existing, 10);

      expect(result).toBeNull(); // Holding should be deleted
    });

    it('should return null when selling more than held (overselling)', () => {
      const existing: Holding = {
        quantity: 10,
        avgBuyPrice: 100,
        totalInvested: 1000,
      };

      const result = calculateSellHolding(existing, 15);

      expect(result).toBeNull(); // Should still be deleted (quantity becomes negative)
    });

    it('should return null when selling very small remaining quantity', () => {
      const existing: Holding = {
        quantity: 0.001,
        avgBuyPrice: 1000,
        totalInvested: 1,
      };

      const result = calculateSellHolding(existing, 0.001);

      expect(result).toBeNull();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical day trading scenario', () => {
      // Buy 100 shares at market open
      let holding = calculateBuyHolding(null, 100, 2500, 100);
      expect(holding.quantity).toBe(100);
      expect(holding.avgBuyPrice).toBe(2500);
      expect(holding.totalInvested).toBe(250100);

      // Sell all 100 shares at market close
      const result = calculateSellHolding(holding, 100);
      expect(result).toBeNull(); // Closed position
    });

    it('should handle averaging down strategy', () => {
      // Initial buy: 10 shares at 150
      let holding = calculateBuyHolding(null, 10, 150, 50);
      expect(holding.quantity).toBe(10);
      expect(holding.avgBuyPrice).toBe(150);
      expect(holding.totalInvested).toBe(1550);

      // Average down: 20 shares at 100
      holding = calculateBuyHolding(holding, 20, 100, 50);
      expect(holding.quantity).toBe(30);
      // Total: 1550 + (2000 + 50) = 3600
      // Avg: 3600 / 30 = 120
      expect(holding.avgBuyPrice).toBeCloseTo(120, 2);
      expect(holding.totalInvested).toBe(3600);

      // Partial sell: 15 shares
      holding = calculateSellHolding(holding, 15)!;
      expect(holding.quantity).toBe(15);
      expect(holding.avgBuyPrice).toBeCloseTo(120, 2); // Avg should remain
      expect(holding.totalInvested).toBeCloseTo(1800, 2); // 120 * 15
    });

    it('should handle pyramiding up strategy', () => {
      // Initial buy: 10 shares at 100
      let holding = calculateBuyHolding(null, 10, 100, 34.6);
      expect(holding.avgBuyPrice).toBe(100);

      // Add 5 shares at 110 (price moving up)
      holding = calculateBuyHolding(holding, 5, 110, 17.3);
      // Total: 1034.6 + (550 + 17.3) = 1601.9
      // Avg: 1601.9 / 15 = 106.79
      expect(holding.avgBuyPrice).toBeCloseTo(106.79, 2);

      // Add 5 more shares at 120
      holding = calculateBuyHolding(holding, 5, 120, 17.3);
      // Total: 1601.9 + (600 + 17.3) = 2219.2
      // Avg: 2219.2 / 20 = 110.96
      expect(holding.avgBuyPrice).toBeCloseTo(110.96, 2);
      expect(holding.quantity).toBe(20);
    });

    it('should handle position scaling in and out', () => {
      // Buy 100 shares at 50
      let holding = calculateBuyHolding(null, 100, 50, 100);
      expect(holding.totalInvested).toBe(5100);

      // Add 50 shares at 55
      holding = calculateBuyHolding(holding, 50, 55, 50);
      // Total: 5100 + (2750 + 50) = 7900
      // Avg: 7900 / 150 = 52.67
      expect(holding.avgBuyPrice).toBeCloseTo(52.67, 2);
      expect(holding.quantity).toBe(150);

      // Sell 75 shares
      holding = calculateSellHolding(holding, 75)!;
      expect(holding.quantity).toBe(75);
      expect(holding.avgBuyPrice).toBeCloseTo(52.67, 2); // Maintained
      // Total invested: avgBuyPrice * quantity = 52.666... * 75 = 3950
      expect(holding.totalInvested).toBeCloseTo(3950, 2);

      // Add 25 shares at 60
      holding = calculateBuyHolding(holding, 25, 60, 30);
      // Total: 3950.25 + (1500 + 30) = 5480.25
      // Avg: 5480.25 / 100 = 54.80
      expect(holding.avgBuyPrice).toBeCloseTo(54.80, 2);
      expect(holding.quantity).toBe(100);
    });

    it('should handle cost basis tracking over many transactions', () => {
      // Start with small position
      let holding = calculateBuyHolding(null, 1, 100, 10);
      expect(holding.avgBuyPrice).toBe(100);

      // Add various amounts at different prices
      holding = calculateBuyHolding(holding, 2, 105, 10);
      holding = calculateBuyHolding(holding, 3, 95, 10);
      holding = calculateBuyHolding(holding, 4, 110, 10);

      expect(holding.quantity).toBe(10);
      // Total invested: (100+10) + (210+10) + (285+10) + (440+10) = 110 + 220 + 295 + 450 = 1075
      // Avg: 1075 / 10 = 107.5
      expect(holding.avgBuyPrice).toBeCloseTo(107.5, 2);
      expect(holding.totalInvested).toBe(1075);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small quantities', () => {
      const holding = calculateBuyHolding(null, 0.001, 10000, 0);
      expect(holding.quantity).toBe(0.001);
      expect(holding.avgBuyPrice).toBe(10000);
      expect(holding.totalInvested).toBe(10); // 0.001 * 10000
    });

    it('should handle very large quantities', () => {
      const holding = calculateBuyHolding(null, 1000000, 1, 10000);
      expect(holding.quantity).toBe(1000000);
      expect(holding.avgBuyPrice).toBe(1);
      expect(holding.totalInvested).toBe(1010000);
    });

    it('should handle very high prices', () => {
      const holding = calculateBuyHolding(null, 1, 100000, 1000);
      expect(holding.quantity).toBe(1);
      expect(holding.avgBuyPrice).toBe(100000);
      expect(holding.totalInvested).toBe(101000);
    });

    it('should handle averaging with vastly different quantities', () => {
      const existing: Holding = {
        quantity: 1,
        avgBuyPrice: 1000,
        totalInvested: 1000,
      };

      const result = calculateBuyHolding(existing, 1000, 10, 0);

      expect(result.quantity).toBe(1001);
      // Total: 1000 + 10000 = 11000
      // Avg: 11000 / 1001 = 10.99
      expect(result.avgBuyPrice).toBeCloseTo(10.99, 2);
    });

    it('should maintain precision with repeating decimals', () => {
      const existing: Holding = {
        quantity: 3,
        avgBuyPrice: 100,
        totalInvested: 300,
      };

      const result = calculateBuyHolding(existing, 1, 100, 1);

      expect(result.quantity).toBe(4);
      // Total: 300 + 101 = 401
      // Avg: 401 / 4 = 100.25
      expect(result.avgBuyPrice).toBeCloseTo(100.25, 2);
      expect(result.totalInvested).toBe(401);
    });
  });

  describe('Charge Impact on Average Price', () => {
    it('should include charges in average buy price calculation', () => {
      const holding1 = calculateBuyHolding(null, 10, 100, 0);
      const holding2 = calculateBuyHolding(null, 10, 100, 100);

      expect(holding1.avgBuyPrice).toBe(100);
      expect(holding2.avgBuyPrice).toBe(100); // Base price remains same
      expect(holding2.totalInvested).toBe(holding1.totalInvested + 100);
    });

    it('should accumulate charges across multiple buys', () => {
      let holding = calculateBuyHolding(null, 10, 100, 50);
      holding = calculateBuyHolding(holding, 10, 100, 50);

      // Total: (1000 + 50) + (1000 + 50) = 2100
      // Avg: 2100 / 20 = 105
      expect(holding.avgBuyPrice).toBeCloseTo(105, 2);
      expect(holding.totalInvested).toBe(2100);
    });
  });
});
