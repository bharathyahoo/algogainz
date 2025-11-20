/**
 * Integration Tests: Complete Trading Flow
 * Tests end-to-end trading operations with database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test user ID
const testUserId = 'integration-test-user-123';

describe('Trading Flow Integration Tests', () => {
  beforeAll(async () => {
    // Create test user
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'integration-test@example.com',
        kiteUserId: 'KITE-TEST-123',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      },
    });
  });

  afterAll(async () => {
    // Cleanup: Delete all test data
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.holding.deleteMany({ where: { userId: testUserId } });
    await prisma.exitStrategy.deleteMany({
      where: { holding: { userId: testUserId } },
    });
    await prisma.watchlist.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.holding.deleteMany({ where: { userId: testUserId } });
    await prisma.exitStrategy.deleteMany({
      where: { holding: { userId: testUserId } },
    });
  });

  describe('Buy Order Flow', () => {
    it('should create buy transaction and update holdings', async () => {
      // Create buy transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          type: 'BUY',
          quantity: 10,
          pricePerShare: 2500,
          grossAmount: 25000,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          totalCharges: 34.6,
          netAmount: 25034.6,
          source: 'APP_EXECUTED',
          timestamp: new Date(),
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('BUY');

      // Create/update holding
      const holding = await prisma.holding.upsert({
        where: {
          userId_stockSymbol: {
            userId: testUserId,
            stockSymbol: 'RELIANCE',
          },
        },
        create: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          quantity: 10,
          avgBuyPrice: 2500,
          totalInvested: 25034.6,
        },
        update: {
          quantity: { increment: 10 },
          totalInvested: { increment: 25034.6 },
        },
      });

      expect(holding.quantity).toBe(10);
      expect(holding.avgBuyPrice).toBe(2500);
      expect(holding.totalInvested).toBeCloseTo(25034.6, 1);
    });

    it('should average buy price correctly on multiple buys', async () => {
      // First buy: 10 shares at 2500
      await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          type: 'BUY',
          quantity: 10,
          pricePerShare: 2500,
          grossAmount: 25000,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          totalCharges: 34.6,
          netAmount: 25034.6,
          source: 'APP_EXECUTED',
          timestamp: new Date('2025-01-01'),
        },
      });

      let holding = await prisma.holding.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          quantity: 10,
          avgBuyPrice: 2500,
          totalInvested: 25034.6,
        },
      });

      // Second buy: 10 shares at 2600
      await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          type: 'BUY',
          quantity: 10,
          pricePerShare: 2600,
          grossAmount: 26000,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          totalCharges: 34.6,
          netAmount: 26034.6,
          source: 'APP_EXECUTED',
          timestamp: new Date('2025-01-02'),
        },
      });

      // Update holding
      const newTotalInvested = holding.totalInvested + 26034.6;
      const newQuantity = holding.quantity + 10;
      const newAvgBuyPrice = newTotalInvested / newQuantity;

      holding = await prisma.holding.update({
        where: { id: holding.id },
        data: {
          quantity: newQuantity,
          totalInvested: newTotalInvested,
          avgBuyPrice: newAvgBuyPrice,
        },
      });

      // Verify: (25034.6 + 26034.6) / 20 = 2553.46
      expect(holding.quantity).toBe(20);
      expect(holding.avgBuyPrice).toBeCloseTo(2553.46, 2);
      expect(holding.totalInvested).toBeCloseTo(51069.2, 1);
    });
  });

  describe('Sell Order Flow', () => {
    beforeEach(async () => {
      // Setup: Create initial holding (10 shares at 2500)
      await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          type: 'BUY',
          quantity: 10,
          pricePerShare: 2500,
          grossAmount: 25000,
          totalCharges: 34.6,
          netAmount: 25034.6,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          source: 'APP_EXECUTED',
          timestamp: new Date('2025-01-01'),
        },
      });

      await prisma.holding.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          quantity: 10,
          avgBuyPrice: 2500,
          totalInvested: 25034.6,
        },
      });
    });

    it('should create sell transaction and reduce holdings', async () => {
      const holding = await prisma.holding.findUnique({
        where: {
          userId_stockSymbol: {
            userId: testUserId,
            stockSymbol: 'RELIANCE',
          },
        },
      });

      expect(holding).toBeDefined();

      // Create sell transaction (sell 5 shares)
      const sellTransaction = await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          type: 'SELL',
          quantity: 5,
          pricePerShare: 2600,
          grossAmount: 13000,
          totalCharges: 34.6,
          netAmount: 12965.4,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          source: 'APP_EXECUTED',
          timestamp: new Date('2025-01-05'),
        },
      });

      expect(sellTransaction.type).toBe('SELL');

      // Update holding (partial sell)
      const newQuantity = holding!.quantity - 5;
      const newTotalInvested = holding!.avgBuyPrice * newQuantity;

      const updatedHolding = await prisma.holding.update({
        where: { id: holding!.id },
        data: {
          quantity: newQuantity,
          totalInvested: newTotalInvested,
        },
      });

      expect(updatedHolding.quantity).toBe(5);
      expect(updatedHolding.avgBuyPrice).toBe(2500); // Should remain same
      expect(updatedHolding.totalInvested).toBeCloseTo(12500, 1);
    });

    it('should delete holding when all shares are sold', async () => {
      const holding = await prisma.holding.findUnique({
        where: {
          userId_stockSymbol: {
            userId: testUserId,
            stockSymbol: 'RELIANCE',
          },
        },
      });

      // Sell all 10 shares
      await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          type: 'SELL',
          quantity: 10,
          pricePerShare: 2600,
          grossAmount: 26000,
          totalCharges: 34.6,
          netAmount: 25965.4,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          source: 'APP_EXECUTED',
          timestamp: new Date('2025-01-05'),
        },
      });

      // Delete holding
      await prisma.holding.delete({
        where: { id: holding!.id },
      });

      // Verify holding is deleted
      const deletedHolding = await prisma.holding.findUnique({
        where: {
          userId_stockSymbol: {
            userId: testUserId,
            stockSymbol: 'RELIANCE',
          },
        },
      });

      expect(deletedHolding).toBeNull();
    });
  });

  describe('Exit Strategy Integration', () => {
    beforeEach(async () => {
      // Setup: Create holding
      await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          type: 'BUY',
          quantity: 10,
          pricePerShare: 2500,
          grossAmount: 25000,
          totalCharges: 34.6,
          netAmount: 25034.6,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          source: 'APP_EXECUTED',
          timestamp: new Date('2025-01-01'),
        },
      });

      await prisma.holding.create({
        data: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
          companyName: 'Reliance Industries',
          quantity: 10,
          avgBuyPrice: 2500,
          totalInvested: 25034.6,
        },
      });
    });

    it('should create exit strategy for holding', async () => {
      const holding = await prisma.holding.findUnique({
        where: {
          userId_stockSymbol: {
            userId: testUserId,
            stockSymbol: 'RELIANCE',
          },
        },
      });

      expect(holding).toBeDefined();

      // Create exit strategy: 5% profit target, 2% stop loss
      const profitTargetPct = 5;
      const stopLossPct = 2;

      const profitTargetPrice = holding!.avgBuyPrice * (1 + profitTargetPct / 100);
      const stopLossPrice = holding!.avgBuyPrice * (1 - stopLossPct / 100);

      const exitStrategy = await prisma.exitStrategy.create({
        data: {
          holdingId: holding!.id,
          profitTargetPct,
          profitTargetPrice,
          stopLossPct,
          stopLossPrice,
          alertEnabled: true,
        },
      });

      expect(exitStrategy).toBeDefined();
      expect(exitStrategy.profitTargetPrice).toBeCloseTo(2625, 1); // 2500 * 1.05
      expect(exitStrategy.stopLossPrice).toBeCloseTo(2450, 1); // 2500 * 0.98
    });

    it('should update exit strategy alert triggers', async () => {
      const holding = await prisma.holding.findFirst({
        where: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
        },
      });

      const exitStrategy = await prisma.exitStrategy.create({
        data: {
          holdingId: holding!.id,
          profitTargetPct: 5,
          profitTargetPrice: 2625,
          stopLossPct: 2,
          stopLossPrice: 2450,
          alertEnabled: true,
        },
      });

      // Simulate profit target hit
      const updatedStrategy = await prisma.exitStrategy.update({
        where: { id: exitStrategy.id },
        data: {
          profitAlertTriggered: true,
        },
      });

      expect(updatedStrategy.profitAlertTriggered).toBe(true);
      expect(updatedStrategy.stopLossAlertTriggered).toBe(false);
    });
  });

  describe('Manual Transaction Recording', () => {
    it('should record manual transaction and create holding', async () => {
      // Record manual buy transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'TCS',
          companyName: 'Tata Consultancy Services',
          type: 'BUY',
          quantity: 5,
          pricePerShare: 3500,
          grossAmount: 17500,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          totalCharges: 34.6,
          netAmount: 17534.6,
          source: 'MANUALLY_RECORDED',
          timestamp: new Date('2025-01-10'),
        },
      });

      expect(transaction.source).toBe('MANUALLY_RECORDED');

      // Create holding
      const holding = await prisma.holding.create({
        data: {
          userId: testUserId,
          stockSymbol: 'TCS',
          companyName: 'Tata Consultancy Services',
          quantity: 5,
          avgBuyPrice: 3500,
          totalInvested: 17534.6,
        },
      });

      expect(holding.quantity).toBe(5);
      expect(holding.avgBuyPrice).toBe(3500);
    });

    it('should correctly tag transaction source in database', async () => {
      // App-executed transaction
      const appTxn = await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'INFY',
          companyName: 'Infosys',
          type: 'BUY',
          quantity: 10,
          pricePerShare: 1500,
          grossAmount: 15000,
          totalCharges: 34.6,
          netAmount: 15034.6,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          source: 'APP_EXECUTED',
          timestamp: new Date(),
        },
      });

      // Manually recorded transaction
      const manualTxn = await prisma.transaction.create({
        data: {
          userId: testUserId,
          stockSymbol: 'WIPRO',
          companyName: 'Wipro',
          type: 'BUY',
          quantity: 15,
          pricePerShare: 500,
          grossAmount: 7500,
          totalCharges: 34.6,
          netAmount: 7534.6,
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          source: 'MANUALLY_RECORDED',
          timestamp: new Date(),
        },
      });

      // Query by source
      const appTransactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          source: 'APP_EXECUTED',
        },
      });

      const manualTransactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          source: 'MANUALLY_RECORDED',
        },
      });

      expect(appTransactions.length).toBeGreaterThanOrEqual(1);
      expect(manualTransactions.length).toBeGreaterThanOrEqual(1);
      expect(appTxn.source).toBe('APP_EXECUTED');
      expect(manualTxn.source).toBe('MANUALLY_RECORDED');
    });
  });

  describe('Query Performance with Indices', () => {
    beforeEach(async () => {
      // Create multiple transactions for performance testing
      const transactions = [];
      for (let i = 0; i < 50; i++) {
        transactions.push({
          userId: testUserId,
          stockSymbol: i % 2 === 0 ? 'RELIANCE' : 'TCS',
          companyName: i % 2 === 0 ? 'Reliance Industries' : 'Tata Consultancy Services',
          type: i % 3 === 0 ? 'BUY' : 'SELL',
          quantity: 10,
          pricePerShare: 2500 + i * 10,
          grossAmount: (2500 + i * 10) * 10,
          totalCharges: 34.6,
          netAmount: (2500 + i * 10) * 10 + (i % 3 === 0 ? 34.6 : -34.6),
          brokerage: 20,
          exchangeCharges: 5,
          gst: 4.5,
          sebiCharges: 0.1,
          stampDuty: 5,
          source: 'APP_EXECUTED',
          timestamp: new Date(Date.now() - i * 86400000), // Spread over days
        });
      }

      await prisma.transaction.createMany({ data: transactions });
    });

    it('should query transactions by userId efficiently', async () => {
      const startTime = Date.now();

      const transactions = await prisma.transaction.findMany({
        where: { userId: testUserId },
      });

      const queryTime = Date.now() - startTime;

      expect(transactions.length).toBe(50);
      expect(queryTime).toBeLessThan(100); // Should be very fast with index
    });

    it('should query transactions by userId and stockSymbol efficiently', async () => {
      const startTime = Date.now();

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          stockSymbol: 'RELIANCE',
        },
      });

      const queryTime = Date.now() - startTime;

      expect(transactions.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(100); // Should be fast with composite index
    });

    it('should query transactions by timestamp efficiently', async () => {
      const startTime = Date.now();

      const oneWeekAgo = new Date(Date.now() - 7 * 86400000);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: testUserId,
          timestamp: {
            gte: oneWeekAgo,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      const queryTime = Date.now() - startTime;

      expect(transactions.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(100); // Should be fast with timestamp index
    });
  });
});
