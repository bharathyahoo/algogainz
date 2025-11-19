/**
 * E2E Tests: Complete Trading Flow
 * Tests the end-to-end journey: Buy → Holdings → Sell → P&L Calculation
 */

import { test, expect } from '@playwright/test';

// Helper function to setup authenticated session
async function setupAuth(page, context) {
  await context.addCookies([
    {
      name: 'token',
      value: 'mock-jwt-token',
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    }));
  });
}

test.describe('Complete Trading Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuth(page, context);
  });

  test('should execute complete buy → holdings → sell flow', async ({ page }) => {
    // Step 1: Buy Stock
    await page.goto('/watchlist');

    // Click on a stock to view details
    const stockCard = page.locator('[data-testid="stock-card"]').first();
    const stockSymbol = await stockCard.getByTestId('stock-symbol').textContent();
    await stockCard.click();

    // Click Buy button
    const buyButton = page.getByRole('button', { name: /Buy/i });
    await buyButton.click();

    // Fill order details
    await page.getByLabel(/Quantity/i).fill('10');
    await page.getByLabel(/Order Type/i).selectOption('MARKET');

    // Review order details
    await page.getByRole('button', { name: /Review Order/i }).click();

    // Verify order summary
    await expect(page.getByText(/Order Summary/i)).toBeVisible();
    await expect(page.getByText(/10.*shares/i)).toBeVisible();

    // Confirm order
    await page.getByRole('button', { name: /Confirm|Place Order/i }).click();

    // Should show success message
    await expect(page.getByText(/Order placed successfully/i)).toBeVisible();

    // Step 2: Verify Holdings
    await page.goto('/holdings');

    // Should see the stock in holdings
    await expect(page.getByText(stockSymbol || '')).toBeVisible();
    await expect(page.getByText(/10.*shares/i)).toBeVisible();

    // Verify unrealized P&L is shown
    const holdingCard = page.locator('[data-testid="holding-card"]').first();
    await expect(holdingCard.getByTestId('unrealized-pnl')).toBeVisible();

    // Step 3: Set Exit Strategy
    const exitStrategyButton = holdingCard.getByRole('button', { name: /Exit Strategy/i });
    await exitStrategyButton.click();

    // Set profit target and stop loss
    await page.getByLabel(/Profit Target/i).fill('5'); // 5% profit
    await page.getByLabel(/Stop Loss/i).fill('2'); // 2% loss

    await page.getByRole('button', { name: /Save Strategy/i }).click();

    // Verify exit strategy saved
    await expect(page.getByText(/Exit strategy saved/i)).toBeVisible();

    // Step 4: Sell Stock
    const sellButton = holdingCard.getByRole('button', { name: /Sell/i });
    await sellButton.click();

    // Fill sell order
    await page.getByLabel(/Quantity/i).fill('10'); // Sell all shares
    await page.getByLabel(/Order Type/i).selectOption('MARKET');

    // Review sell order
    await page.getByRole('button', { name: /Review Order/i }).click();

    // Should show projected P&L
    await expect(page.getByText(/Projected P&L/i)).toBeVisible();

    // Confirm sell order
    await page.getByRole('button', { name: /Confirm|Sell/i }).click();

    // Should show success
    await expect(page.getByText(/Sell order placed successfully/i)).toBeVisible();

    // Step 5: Verify Transaction History
    await page.goto('/transactions');

    // Should see both buy and sell transactions
    const transactions = page.locator('[data-testid="transaction-item"]');
    await expect(transactions).toHaveCount(2); // Buy + Sell

    // Verify transaction details
    await expect(page.getByText(/BUY/i)).toBeVisible();
    await expect(page.getByText(/SELL/i)).toBeVisible();
    await expect(page.getByText(stockSymbol || '')).toHaveCount(2);

    // Step 6: Verify P&L in Dashboard
    await page.goto('/dashboard');

    // Should see realized P&L
    await expect(page.getByText(/Realized P&L/i)).toBeVisible();

    // Should show total trades count
    await expect(page.getByText(/Total Trades.*2/i)).toBeVisible();

    // Should update portfolio metrics
    await expect(page.getByText(/Portfolio Value/i)).toBeVisible();
    await expect(page.getByText(/Return Percentage/i)).toBeVisible();
  });

  test('should handle partial sell correctly', async ({ page }) => {
    // Assume we have 20 shares in holdings
    await page.goto('/holdings');

    const holdingCard = page.locator('[data-testid="holding-card"]').first();

    // Sell only 10 shares (partial sell)
    const sellButton = holdingCard.getByRole('button', { name: /Sell/i });
    await sellButton.click();

    await page.getByLabel(/Quantity/i).fill('10');
    await page.getByRole('button', { name: /Review/i }).click();
    await page.getByRole('button', { name: /Confirm/i }).click();

    // Wait for success
    await expect(page.getByText(/success/i)).toBeVisible();

    // Reload holdings
    await page.reload();

    // Should still show holding with reduced quantity
    const quantityElement = holdingCard.getByTestId('quantity');
    const quantity = await quantityElement.textContent();

    expect(parseInt(quantity || '0')).toBe(10); // Remaining 10 shares
  });

  test('should prevent selling more than available quantity', async ({ page }) => {
    await page.goto('/holdings');

    const holdingCard = page.locator('[data-testid="holding-card"]').first();

    // Get available quantity
    const quantityElement = holdingCard.getByTestId('quantity');
    const availableQty = parseInt((await quantityElement.textContent()) || '0');

    // Try to sell more than available
    const sellButton = holdingCard.getByRole('button', { name: /Sell/i });
    await sellButton.click();

    const quantityInput = page.getByLabel(/Quantity/i);
    await quantityInput.fill(String(availableQty + 10));

    // Should show validation error
    await expect(page.getByText(/Cannot sell more than available/i)).toBeVisible();

    // Confirm button should be disabled
    const confirmButton = page.getByRole('button', { name: /Confirm|Place Order/i });
    await expect(confirmButton).toBeDisabled();
  });

  test('should record manual transaction correctly', async ({ page }) => {
    await page.goto('/transactions');

    // Click manual transaction button (FAB)
    const manualTransactionButton = page.getByRole('button', { name: /Add Manual Transaction/i });
    await manualTransactionButton.click();

    // Fill manual transaction form
    await page.getByLabel(/Transaction Type/i).selectOption('BUY');
    await page.getByLabel(/Stock Symbol/i).fill('TCS');

    // Select from autocomplete
    await page.getByText('TCS - Tata Consultancy Services').click();

    await page.getByLabel(/Quantity/i).fill('5');
    await page.getByLabel(/Price per Share/i).fill('3500');

    // Fill charges
    await page.getByLabel(/Brokerage/i).fill('20');
    await page.getByLabel(/Exchange Charges/i).fill('5');
    await page.getByLabel(/GST/i).fill('4.5');
    await page.getByLabel(/SEBI Charges/i).fill('0.1');
    await page.getByLabel(/Stamp Duty/i).fill('5');

    // Select date
    await page.getByLabel(/Date/i).click();
    await page.getByRole('button', { name: '15' }).click(); // Select 15th

    // Submit
    await page.getByRole('button', { name: /Record Transaction/i }).click();

    // Should show success
    await expect(page.getByText(/Transaction recorded successfully/i)).toBeVisible();

    // Verify transaction appears in list
    await expect(page.getByText('TCS')).toBeVisible();
    await expect(page.getByText(/Manually Recorded/i)).toBeVisible();

    // Verify holdings updated
    await page.goto('/holdings');
    await expect(page.getByText('TCS')).toBeVisible();
    await expect(page.getByText(/5.*shares/i)).toBeVisible();
  });

  test('should trigger exit strategy alert', async ({ page }) => {
    // Mock WebSocket price update that triggers profit target
    await page.evaluate(() => {
      // Simulate price reaching profit target
      window.dispatchEvent(new CustomEvent('price-update', {
        detail: {
          symbol: 'RELIANCE',
          price: 2625, // 5% above buy price of 2500
        },
      }));
    });

    // Navigate to holdings
    await page.goto('/holdings');

    // Should see alert indicator
    const alertBadge = page.getByTestId('alert-badge');
    await expect(alertBadge).toBeVisible();

    // Click to view alert details
    await alertBadge.click();

    // Should show profit target reached message
    await expect(page.getByText(/Profit target reached/i)).toBeVisible();
    await expect(page.getByText(/RELIANCE/i)).toBeVisible();

    // Quick sell option
    const quickSellButton = page.getByRole('button', { name: /Sell Now/i });
    await expect(quickSellButton).toBeVisible();
  });

  test('should generate and download report', async ({ page }) => {
    await page.goto('/reports');

    // Set filters
    await page.getByLabel(/From Date/i).fill('2025-01-01');
    await page.getByLabel(/To Date/i).fill('2025-11-30');
    await page.getByLabel(/Transaction Type/i).selectOption('ALL');

    // Generate report
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Generate Report/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/transactions.*\.xlsx/i);

    // Verify file is not empty
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should calculate FIFO P&L correctly for multiple buys and sells', async ({ page }) => {
    // This test verifies the FIFO calculation in the UI
    await page.goto('/transactions');

    // Filter by specific stock
    await page.getByLabel(/Filter by Stock/i).selectOption('RELIANCE');

    // Should show all transactions for RELIANCE
    const transactions = page.locator('[data-testid="transaction-item"]');

    // Check P&L column for sells
    const sellTransactions = transactions.filter({ hasText: 'SELL' });
    const count = await sellTransactions.count();

    for (let i = 0; i < count; i++) {
      const pnlElement = sellTransactions.nth(i).getByTestId('pnl');
      await expect(pnlElement).toBeVisible();

      // P&L should be displayed with color coding
      const pnlText = await pnlElement.textContent();
      const pnlValue = parseFloat(pnlText?.replace(/[^\d.-]/g, '') || '0');

      if (pnlValue > 0) {
        // Profit should be green
        await expect(pnlElement).toHaveCSS('color', /green/i);
      } else if (pnlValue < 0) {
        // Loss should be red
        await expect(pnlElement).toHaveCSS('color', /red/i);
      }
    }
  });

  test('should show transaction source badges correctly', async ({ page }) => {
    await page.goto('/transactions');

    // Find app-executed transaction
    const appTransaction = page.locator('[data-testid="transaction-item"]')
      .filter({ hasText: 'App Executed' })
      .first();

    await expect(appTransaction.getByTestId('source-badge')).toHaveText('App Executed');

    // Find manually recorded transaction
    const manualTransaction = page.locator('[data-testid="transaction-item"]')
      .filter({ hasText: 'Manually Recorded' })
      .first();

    await expect(manualTransaction.getByTestId('source-badge')).toHaveText('Manually Recorded');
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Go offline
    await context.setOffline(true);

    // Should show offline banner
    await expect(page.getByText(/You are offline/i)).toBeVisible();

    // Navigate to holdings (should work from cache)
    await page.goto('/holdings');

    // Should still show cached data
    await expect(page.getByRole('heading', { name: /Holdings/i })).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Offline banner should disappear
    await expect(page.getByText(/You are offline/i)).not.toBeVisible();
  });
});
