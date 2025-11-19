# AlgoGainz - Complete Testing Strategy

**Comprehensive testing approach for all layers of the application**

---

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Tests](#e2e-tests)
5. [Load Testing](#load-testing)
6. [Running Tests](#running-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Test Coverage Goals](#test-coverage-goals)

---

## Testing Pyramid

AlgoGainz follows the standard testing pyramid approach:

```
        /\
       /  \
      / E2E \         ~15 tests (slow, expensive)
     /______\
    /        \
   /Integration\     ~20 tests (medium speed)
  /____________\
 /              \
/   Unit Tests   \   ~60 tests (fast, cheap)
/_________________\
```

### Test Distribution
- **Unit Tests**: 60+ tests (80% of total tests)
- **Integration Tests**: ~20 tests (15% of total tests)
- **E2E Tests**: ~15 tests (5% of total tests)

**Total**: ~95 tests covering all critical paths

---

## Unit Tests

### Backend Unit Tests (Jest)

**Location**: `backend/src/__tests__/services/`

#### 1. FIFO P&L Calculation Tests (20 tests)

**File**: `reportService.test.ts`

```typescript
// Example test
it('should calculate profit for simple buy-sell pair', () => {
  const buys = [createMockTransaction('BUY', 10, 100, ...)];
  const sells = [createMockTransaction('SELL', 10, 110, ...)];

  const pnl = calculateFIFOPnL(buys, sells);

  expect(pnl).toBeCloseTo(30.8, 1);
});
```

**Coverage**:
- ✅ Basic scenarios (profit, loss)
- ✅ FIFO ordering (earliest buys first)
- ✅ Partial sells
- ✅ Complex multi-transaction scenarios
- ✅ Edge cases (overselling, fractional shares)
- ✅ Charge distribution

**Run**:
```bash
cd backend
npm test -- reportService.test.ts
```

#### 2. Holdings Calculation Tests (28 tests)

**File**: `holdingsCalculation.test.ts`

```typescript
// Example test
it('should average down when buying at lower price', () => {
  const existing = { quantity: 10, avgBuyPrice: 150, ... };
  const result = calculateBuyHolding(existing, 20, 100, 0);

  expect(result.avgBuyPrice).toBeCloseTo(116.67, 2);
});
```

**Coverage**:
- ✅ New holding creation
- ✅ Averaging up/down
- ✅ Partial sells
- ✅ Complete exits
- ✅ Real-world trading patterns

**Run**:
```bash
cd backend
npm test -- holdingsCalculation.test.ts
```

#### 3. Frontend Unit Tests (12 tests)

**File**: `frontend/src/__tests__/store/authSlice.test.ts`

```typescript
// Example test
it('should set authenticated state with user and token', () => {
  const state = authReducer(initialState, loginSuccess({ user, token }));

  expect(state.isAuthenticated).toBe(true);
  expect(state.token).toBe(token);
});
```

**Coverage**:
- ✅ Redux store actions
- ✅ State transitions
- ✅ LocalStorage interactions

**Run**:
```bash
cd frontend
npm test
```

---

## Integration Tests

### Backend Integration Tests

**Location**: `backend/src/__tests__/integration/`

#### Trading Flow Integration Tests

**File**: `trading-flow.test.ts`

Tests complete database operations for trading flows.

**Scenarios Covered**:

1. **Buy Order Flow**
   ```typescript
   it('should create buy transaction and update holdings', async () => {
     // Create transaction
     const transaction = await prisma.transaction.create({...});

     // Verify holding created/updated
     const holding = await prisma.holding.findUnique({...});
     expect(holding.quantity).toBe(10);
   });
   ```

2. **Sell Order Flow**
   - Partial sell reduces holdings
   - Complete sell deletes holding
   - Holdings calculation maintains avg buy price

3. **Exit Strategy**
   - Create exit strategy with profit target/stop loss
   - Update alert triggers

4. **Manual Transactions**
   - Record manual buy/sell
   - Correctly tag transaction source

5. **Query Performance**
   - Test database index performance
   - Verify query speed with indices

**Run**:
```bash
cd backend
npm test -- integration/trading-flow.test.ts
```

**Prerequisites**:
- Database connection (uses actual Prisma client)
- Clean test database or isolated test user

---

## E2E Tests

### Playwright E2E Tests

**Location**: `frontend/e2e/`

**Configuration**: `frontend/playwright.config.ts`

#### 1. Authentication Flow (7 tests)

**File**: `authentication.spec.ts`

```typescript
test('should successfully authenticate and redirect to dashboard', async ({ page, context }) => {
  // Mock authentication
  await context.addCookies([...]);

  // Navigate to dashboard
  await page.goto('/dashboard');

  // Verify dashboard content
  await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
});
```

**Scenarios**:
- ✅ Display login page for unauthenticated users
- ✅ Redirect to Zerodha login
- ✅ Show error for failed login
- ✅ Successfully authenticate
- ✅ Logout functionality
- ✅ Maintain auth across reloads
- ✅ Redirect to login if accessing protected route

#### 2. Watchlist Management (12 tests)

**File**: `watchlist.spec.ts`

**Scenarios**:
- ✅ Add stock to watchlist
- ✅ Create and assign categories
- ✅ Filter by category
- ✅ Live price updates
- ✅ Price change color coding
- ✅ Remove stock
- ✅ Drag-and-drop reordering
- ✅ View technical analysis
- ✅ Search with autocomplete
- ✅ Empty watchlist state

#### 3. Complete Trading Flow (11 tests)

**File**: `trading-flow.spec.ts`

**Critical Test**:
```typescript
test('should execute complete buy → holdings → sell flow', async ({ page }) => {
  // Step 1: Buy Stock
  await page.goto('/watchlist');
  // ... buy flow ...

  // Step 2: Verify Holdings
  await page.goto('/holdings');
  // ... verify holding created ...

  // Step 3: Set Exit Strategy
  // ... set profit target/stop loss ...

  // Step 4: Sell Stock
  // ... sell flow ...

  // Step 5: Verify Transaction History
  await page.goto('/transactions');
  // ... verify both buy and sell ...

  // Step 6: Verify P&L in Dashboard
  await page.goto('/dashboard');
  // ... verify realized P&L ...
});
```

**Other Scenarios**:
- ✅ Partial sell
- ✅ Prevent overselling
- ✅ Manual transaction recording
- ✅ Exit strategy alerts
- ✅ Report generation
- ✅ FIFO P&L calculation
- ✅ Transaction source badges
- ✅ Offline mode

**Run E2E Tests**:
```bash
cd frontend

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

**Test on Multiple Browsers**:
```bash
# Test on all configured browsers
npm run test:e2e

# Test on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## Load Testing

### Using k6 for Load Testing

**Location**: `load-tests/` directory

AlgoGainz includes comprehensive k6 load tests for performance and stress testing:

#### Available Load Tests

1. **`trading-api.js`** - General API load test
   - Duration: ~4 minutes
   - Max VUs: 100 concurrent users
   - Tests: Health, watchlist, holdings, transactions, dashboard

2. **`authentication.js`** - Auth flow and rate limiting
   - Duration: ~50 seconds
   - Max VUs: 10 concurrent users
   - Tests: Login, callback, rate limiting, logout

3. **`watchlist.js`** - Watchlist CRUD operations
   - Duration: ~1 minute 40 seconds
   - Max VUs: 30 concurrent users
   - Tests: Get, add, update, delete, search, categories

4. **`stress-test.js`** - Aggressive stress testing ⚠️
   - Duration: ~14 minutes
   - Max VUs: 400 concurrent users
   - **WARNING**: Only run in staging/test environments!

#### Installation

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (Chocolatey)
choco install k6

# Or download from: https://k6.io/docs/getting-started/installation/
```

#### Running Load Tests

**Using the convenience script** (recommended):
```bash
# Interactive menu
cd load-tests
./run-tests.sh

# Command line options
./run-tests.sh quick      # Quick baseline (1 min)
./run-tests.sh trading    # Full trading API test
./run-tests.sh auth       # Authentication test
./run-tests.sh watchlist  # Watchlist operations
./run-tests.sh all        # Run all tests sequentially

# With custom API URL
API_BASE_URL=https://api.algogainz.com ./run-tests.sh trading
```

**Direct k6 commands**:
```bash
# Run specific test
k6 run load-tests/trading-api.js

# With custom API URL
k6 run --env API_BASE_URL=https://api.algogainz.com load-tests/trading-api.js

# Quick baseline test
k6 run --vus 20 --duration 1m load-tests/trading-api.js

# Stress test (⚠️ use with caution)
k6 run load-tests/stress-test.js

# Save results to JSON
k6 run --out json=results.json load-tests/trading-api.js
```

#### CI/CD Integration

GitHub Actions workflow for automated load testing:

**File**: `.github/workflows/load-tests.yml`

The workflow:
- Runs weekly (Monday 2 AM UTC)
- Can be manually triggered with custom parameters
- Supports multiple test types
- Uploads results as artifacts
- Sends notifications on failure

**Manual trigger from GitHub**:
1. Go to Actions tab
2. Select "Load Tests" workflow
3. Click "Run workflow"
4. Choose test type and API URL
5. Run workflow

#### Performance Targets

| Metric | Target | Max |
|--------|--------|-----|
| Response Time (p95) | < 500ms | < 1000ms |
| Error Rate | < 1% | < 5% |
| Throughput | 100 req/s | 200+ req/s |
| Concurrent Users | 100 | 200+ |

#### Documentation

For detailed information, see `load-tests/README.md` which includes:
- Complete installation guide
- Test scenario descriptions
- Interpreting results
- Performance targets
- Troubleshooting
- Best practices

---

## Running Tests

### Quick Test Commands

#### All Tests
```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# Frontend E2E tests
cd frontend && npm run test:e2e
```

#### Specific Tests
```bash
# Run single test file
npm test -- reportService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="FIFO"

# Run in watch mode
npm test -- --watch
```

#### Coverage Reports
```bash
# Backend coverage
cd backend && npm test -- --coverage

# Frontend coverage
cd frontend && npm test:coverage
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/tests.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install Backend Dependencies
        run: cd backend && npm install

      - name: Run Backend Unit Tests
        run: cd backend && npm test

      - name: Run Backend Integration Tests
        run: cd backend && npm test -- integration/

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install Frontend Dependencies
        run: cd frontend && npm install

      - name: Run Frontend Unit Tests
        run: cd frontend && npm test

      - name: Install Playwright Browsers
        run: cd frontend && npx playwright install --with-deps

      - name: Run E2E Tests
        run: cd frontend && npm run test:e2e

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## Test Coverage Goals

### Current Coverage

| Component | Unit Tests | Integration Tests | E2E Tests | Total Coverage |
|-----------|-----------|-------------------|-----------|----------------|
| **Backend** | 48 tests | 15 tests | N/A | 100% critical logic |
| **Frontend** | 12 tests | N/A | 30 tests | 80% critical paths |
| **Total** | **60 tests** | **15 tests** | **30 tests** | **~105 tests** |

### Coverage Targets

- ✅ **Critical Business Logic**: 100% (FIFO P&L, Holdings calculation)
- ✅ **API Endpoints**: 80% (all major routes tested)
- ✅ **User Flows**: 90% (authentication, trading, reporting)
- ⚠️ **Edge Cases**: 70% (ongoing improvement)

---

## Test Quality Metrics

### Performance Benchmarks

| Test Type | Execution Time | Target |
|-----------|---------------|--------|
| **Unit Tests** | ~4 seconds | < 10 seconds |
| **Integration Tests** | ~10 seconds | < 30 seconds |
| **E2E Tests** | ~2-3 minutes | < 5 minutes |

### Reliability Targets

- **Test Stability**: > 99% (no flaky tests)
- **False Positives**: < 1%
- **CI Pass Rate**: > 95%

---

## Best Practices

### 1. Writing Tests

```typescript
// ✅ Good: Descriptive test names
test('should calculate FIFO P&L correctly for partial sells', () => {
  // Arrange
  const buys = [createMockBuy(10, 100)];
  const sells = [createMockSell(5, 110)];

  // Act
  const pnl = calculateFIFOPnL(buys, sells);

  // Assert
  expect(pnl).toBeCloseTo(expectedValue, 2);
});

// ❌ Bad: Vague test names
test('test1', () => {
  // ...
});
```

### 2. Test Isolation

```typescript
// ✅ Good: Clean setup and teardown
beforeEach(async () => {
  await cleanupDatabase();
  await setupTestData();
});

afterEach(async () => {
  await cleanupDatabase();
});

// ❌ Bad: Tests depend on each other
```

### 3. Mocking

```typescript
// ✅ Good: Mock external dependencies
test('should handle API error gracefully', async () => {
  await page.route('**/api/watchlist', route => {
    route.fulfill({ status: 500 });
  });

  // ... test error handling ...
});
```

---

## Debugging Tests

### Unit Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- -t "should calculate profit"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Tests

```bash
# Debug mode (opens debugger)
npm run test:e2e:debug

# Run in headed mode (see browser)
npm run test:e2e:headed

# Generate trace
npx playwright test --trace on
```

---

## Continuous Improvement

### Regular Tasks

- **Weekly**: Review test failures, update flaky tests
- **Monthly**: Review coverage reports, add missing tests
- **Quarterly**: Performance audit, optimize slow tests

### Adding New Tests

When adding new features:

1. **Write unit tests first** (TDD approach)
2. **Add integration test** for database operations
3. **Add E2E test** for critical user flows
4. **Update this documentation**

---

## Test Maintenance

### Updating Tests

When code changes:

1. Update affected tests
2. Run full test suite
3. Fix any breaking tests
4. Verify coverage hasn't dropped

### Removing Tests

When removing features:

1. Remove associated tests
2. Update coverage reports
3. Document in PR

---

## Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **k6 Documentation**: https://k6.io/docs/
- **Testing Best Practices**: https://testingjavascript.com/

---

**Last Updated**: November 19, 2025
**Test Suite Version**: 2.0
**Total Tests**: ~105 tests
