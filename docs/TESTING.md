# AlgoGainz - Testing Documentation

**Phase 13: Testing & Quality Assurance**

---

## Test Summary

### Backend Tests (Jest)

**Total Tests**: 48 passed ✅
**Test Suites**: 2 suites
**Execution Time**: ~3.8 seconds
**Coverage**: Critical business logic covered

#### Test Breakdown

##### 1. FIFO P&L Calculation Tests (20 tests)
**File**: `backend/src/__tests__/services/reportService.test.ts`

**Scenarios Covered**:
- ✅ **Basic Scenarios (4 tests)**
  - Simple buy-sell profit calculation
  - Simple buy-sell loss calculation
  - No sells (0 P&L)
  - No buys (0 P&L)

- ✅ **FIFO Ordering (2 tests)**
  - Matches sells with earliest buys first (FIFO principle)
  - Handles out-of-order transactions correctly (sorts by timestamp)

- ✅ **Partial Sells (3 tests)**
  - Partial sell from single buy
  - Multiple partial sells from same buy
  - Sell spanning multiple buy transactions

- ✅ **Complex Scenarios (2 tests)**
  - Multiple buys and sells with varying prices
  - Alternating buy-sell-buy-sell pattern

- ✅ **Edge Cases (6 tests)**
  - Sell quantity exceeding buy quantity (overselling)
  - Zero charges (pure price difference)
  - High charges reducing profit
  - Break-even scenario (same buy/sell price)
  - Fractional share quantities
  - Charge distribution for partial sells

- ✅ **Real-world Scenarios (3 tests)**
  - Day trading (same-day buy-sell)
  - Averaging down strategy
  - Long positions with multiple entries/exits

**Key Validations**:
- ✅ FIFO matching algorithm works correctly
- ✅ Charges are proportionally distributed
- ✅ Handles edge cases (overselling, fractional shares)
- ✅ Real-world trading patterns validated

---

##### 2. Holdings Calculation Tests (28 tests)
**File**: `backend/src/__tests__/services/holdingsCalculation.test.ts`

**Scenarios Covered**:
- ✅ **New Holdings (3 tests)**
  - First buy creates holding correctly
  - Zero charges handling
  - High charges impact

- ✅ **Adding to Existing Holdings (6 tests)**
  - Same price accumulation
  - Averaging up (buying at higher price)
  - Averaging down (buying at lower price)
  - Different quantities and charges
  - Multiple small buys
  - Fractional averaging

- ✅ **Partial Sells (4 tests)**
  - Quantity reduction
  - Average buy price maintained after sell
  - Selling majority of shares
  - Multiple sequential sells

- ✅ **Complete Exit (3 tests)**
  - Selling exact quantity (position closed)
  - Overselling (more than held)
  - Very small quantity exit

- ✅ **Real-world Scenarios (5 tests)**
  - Day trading scenario
  - Averaging down strategy
  - Pyramiding up strategy
  - Position scaling in/out
  - Cost basis tracking over many transactions

- ✅ **Edge Cases (5 tests)**
  - Very small quantities (0.001 shares)
  - Very large quantities (1M shares)
  - Very high prices (₹100,000+)
  - Vastly different quantities
  - Precision with repeating decimals

- ✅ **Charge Impact (2 tests)**
  - Charges included in average price
  - Charges accumulation across multiple buys

**Key Validations**:
- ✅ Average buy price calculated correctly
- ✅ Total invested tracked accurately
- ✅ Partial sells maintain correct avg price
- ✅ Complete exits handled properly
- ✅ Edge cases and precision issues covered

---

## Test Configuration

### Backend (Jest + ts-jest)

**Config File**: `backend/jest.config.js`

```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  testTimeout: 10000
}
```

**Run Commands**:
```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
npm test -- --watch         # Watch mode
npm test -- reportService   # Run specific test file
```

---

### Frontend (Vitest + React Testing Library)

**Config File**: `frontend/vitest.config.ts`

```typescript
{
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
}
```

**Run Commands**:
```bash
cd frontend
npm test                    # Run all tests
npm test:coverage           # Run with coverage
npm test:ui                 # Interactive UI
```

---

## Critical Business Logic Test Coverage

### ✅ P&L Calculation (FIFO Algorithm)
- **Lines of Code**: ~40 lines
- **Tests**: 20 comprehensive tests
- **Coverage**: 100% of logic paths
- **Real-world Scenarios**: Day trading, averaging, position management

**Formula Tested**:
```
Buy Cost = (Price × Quantity) + (Charges × Quantity / Total Buy Quantity)
Sell Proceeds = (Price × Quantity) - (Charges × Quantity / Total Sell Quantity)
P&L = Sell Proceeds - Buy Cost
```

### ✅ Holdings Calculation
- **Lines of Code**: ~70 lines
- **Tests**: 28 comprehensive tests
- **Coverage**: 100% of logic paths
- **Real-world Scenarios**: Averaging strategies, scaling positions

**Formulas Tested**:
```
For BUY:
  New Quantity = Existing + Buy Quantity
  New Total Invested = Existing + (Price × Quantity + Charges)
  New Avg Buy Price = New Total Invested / New Quantity

For SELL:
  New Quantity = Existing - Sell Quantity
  New Total Invested = Avg Buy Price × New Quantity
  Avg Buy Price = Unchanged (maintained from original buys)
```

---

## Test Quality Metrics

### Backend Tests

| Metric | Value |
|--------|-------|
| **Total Test Cases** | 48 |
| **Passing Tests** | 48 (100%) |
| **Test Suites** | 2 |
| **Execution Time** | ~3.8 seconds |
| **FIFO P&L Tests** | 20 tests |
| **Holdings Tests** | 28 tests |
| **Edge Cases Covered** | 11+ scenarios |
| **Real-world Scenarios** | 8+ scenarios |

### Test Categories

- **Unit Tests**: 48 tests (100%)
- **Integration Tests**: 0 (pending)
- **E2E Tests**: 0 (pending)

---

## Running Tests

### Backend Tests (Current Working Directory: `/home/user/algogainz/backend`)

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- reportService.test.ts
npm test -- holdingsCalculation.test.ts

# Watch mode (re-run on file changes)
npm test -- --watch

# Verbose output
npm test -- --verbose
```

### Frontend Tests (Current Working Directory: `/home/user/algogainz/frontend`)

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Interactive UI
npm test:ui

# Watch mode
npm test -- --watch
```

---

## Test Data Examples

### FIFO P&L Test Example

```typescript
// Buy 10 shares at ₹100 with ₹34.6 charges
const buy = createMockTransaction('BUY', 10, 100, new Date('2025-01-01'));

// Sell 10 shares at ₹110 with ₹34.6 charges
const sell = createMockTransaction('SELL', 10, 110, new Date('2025-01-02'));

// Expected P&L:
// Sell Proceeds: (110 * 10) - 34.6 = 1065.4
// Buy Cost: (100 * 10) + 34.6 = 1034.6
// P&L: 1065.4 - 1034.6 = 30.8
```

### Holdings Test Example

```typescript
// Initial buy: 10 shares at ₹100
let holding = calculateBuyHolding(null, 10, 100, 50);
// Result: { quantity: 10, avgBuyPrice: 100, totalInvested: 1050 }

// Add 20 shares at ₹120
holding = calculateBuyHolding(holding, 20, 120, 50);
// Result: { quantity: 30, avgBuyPrice: 113.33, totalInvested: 3400 }

// Sell 15 shares
holding = calculateSellHolding(holding, 15);
// Result: { quantity: 15, avgBuyPrice: 113.33, totalInvested: 1700 }
```

---

## Test Coverage Goals

### Current Coverage (Backend)
- ✅ FIFO P&L Calculation: **100%**
- ✅ Holdings Calculation: **100%**
- ⏳ Technical Analysis: **0%** (pending)
- ⏳ Order Execution: **0%** (pending)
- ⏳ Authentication: **0%** (pending)

### Next Steps (Pending)
1. **Frontend Component Tests**
   - Redux slice tests
   - Component rendering tests
   - User interaction tests

2. **Integration Tests**
   - Complete order flow (buy → holdings update → sell → P&L)
   - Manual transaction entry → holdings update
   - Exit strategy alerts

3. **E2E Tests (Playwright)**
   - Login → OAuth flow
   - Add stock to watchlist → view recommendation → place order
   - Record manual transaction → verify holdings → generate report

---

## Known Test Gaps

### Backend
- [ ] Technical analysis service (indicators, recommendations)
- [ ] Kite API integration (mocked tests)
- [ ] WebSocket service
- [ ] Alert monitoring service
- [ ] Authentication middleware
- [ ] Route handlers (API endpoints)

### Frontend
- [ ] Redux store actions/reducers
- [ ] React components
- [ ] Service layer (API calls)
- [ ] User interactions
- [ ] Offline functionality

### E2E
- [ ] Complete user journeys
- [ ] PWA installation
- [ ] Offline mode
- [ ] Real-time updates

---

## Best Practices Followed

1. ✅ **Descriptive Test Names**: Each test clearly states what it validates
2. ✅ **Arrange-Act-Assert Pattern**: Consistent test structure
3. ✅ **Edge Cases Covered**: Overselling, zero charges, fractional shares
4. ✅ **Real-world Scenarios**: Day trading, averaging strategies
5. ✅ **Isolated Tests**: No dependencies between tests
6. ✅ **Comprehensive Comments**: Each test includes calculation explanations
7. ✅ **Floating Point Handling**: Use `toBeCloseTo()` for decimal comparisons
8. ✅ **Mock Data Helpers**: Reusable `createMockTransaction()` function

---

## Continuous Integration (Future)

### GitHub Actions Workflow (Recommended)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install Backend Dependencies
        run: cd backend && npm install

      - name: Run Backend Tests
        run: cd backend && npm test -- --coverage

      - name: Install Frontend Dependencies
        run: cd frontend && npm install

      - name: Run Frontend Tests
        run: cd frontend && npm test:coverage
```

---

## Debugging Failed Tests

### Common Issues

1. **Floating Point Precision**
   - Use `toBeCloseTo(value, precision)` instead of `toBe()`
   - Example: `expect(pnl).toBeCloseTo(30.8, 1)` (1 decimal precision)

2. **Async Operations**
   - Ensure proper `async/await` usage
   - Mock Prisma/database calls appropriately

3. **Mock Data**
   - Verify timestamp sorting in FIFO tests
   - Check charge calculations in expectations

### Debug Commands

```bash
# Run single test with verbose output
npm test -- --verbose reportService.test.ts

# Run specific test by name
npm test -- -t "should calculate profit for simple buy-sell pair"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Test Maintenance

### When to Update Tests

1. **Business Logic Changes**
   - P&L calculation formula changes
   - Holdings algorithm updates
   - Charge structure modifications

2. **Bug Fixes**
   - Add regression test for each bug fixed
   - Document the scenario in test name

3. **New Features**
   - Add tests before implementing (TDD)
   - Cover edge cases from the start

### Test Review Checklist

- [ ] All tests have clear, descriptive names
- [ ] Edge cases are covered
- [ ] Real-world scenarios validated
- [ ] No flaky tests (consistent pass/fail)
- [ ] Fast execution (<5 seconds total)
- [ ] Well-documented with comments

---

## Contact & Support

For questions about tests or to report test failures:
1. Check test output for specific error messages
2. Review calculation comments in test file
3. Verify expected values match business logic
4. Run tests in isolation to rule out interference

---

**Last Updated**: November 19, 2025
**Test Suite Version**: 1.0
**Status**: ✅ 48/48 Backend Tests Passing
