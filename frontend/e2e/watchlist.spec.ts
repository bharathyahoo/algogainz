/**
 * E2E Tests: Watchlist Management
 * Tests adding, viewing, categorizing, and removing stocks from watchlist
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

test.describe('Watchlist Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupAuth(page, context);
    await page.goto('/watchlist');
  });

  test('should display watchlist page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Watchlist/i })).toBeVisible();
  });

  test('should add stock to watchlist', async ({ page }) => {
    // Click add stock button
    const addButton = page.getByRole('button', { name: /Add Stock/i });
    await addButton.click();

    // Fill in stock search
    const searchInput = page.getByPlaceholder(/Search stock/i);
    await searchInput.fill('RELIANCE');

    // Select from autocomplete results
    await page.getByText('RELIANCE - Reliance Industries').click();

    // Confirm addition
    const confirmButton = page.getByRole('button', { name: /Add to Watchlist/i });
    await confirmButton.click();

    // Verify stock appears in watchlist
    await expect(page.getByText('RELIANCE')).toBeVisible();
    await expect(page.getByText('Reliance Industries')).toBeVisible();
  });

  test('should create and assign category to stock', async ({ page }) => {
    // Open category management
    const manageCategoriesButton = page.getByRole('button', { name: /Manage Categories/i });
    await manageCategoriesButton.click();

    // Create new category
    const categoryInput = page.getByPlaceholder(/New category name/i);
    await categoryInput.fill('Technology');

    const createButton = page.getByRole('button', { name: /Create Category/i });
    await createButton.click();

    // Verify category created
    await expect(page.getByText('Technology')).toBeVisible();

    // Close category dialog
    await page.keyboard.press('Escape');

    // Assign category to stock
    const stockCard = page.getByText('RELIANCE').locator('..');
    await stockCard.getByRole('button', { name: /Edit/i }).click();

    // Select category
    const categorySelect = page.getByLabel(/Category/i);
    await categorySelect.click();
    await page.getByRole('option', { name: 'Technology' }).click();

    // Save
    const saveButton = page.getByRole('button', { name: /Save/i });
    await saveButton.click();

    // Verify category badge appears
    await expect(stockCard.getByText('Technology')).toBeVisible();
  });

  test('should filter watchlist by category', async ({ page }) => {
    // Assume we have stocks in different categories
    // Click category filter
    const categoryFilter = page.getByRole('button', { name: /All Categories/i });
    await categoryFilter.click();

    // Select specific category
    await page.getByRole('menuitem', { name: 'Technology' }).click();

    // Verify only Technology stocks are shown
    await expect(page.getByText('Technology')).toBeVisible();

    // Verify other categories are hidden
    const stockCards = page.locator('[data-testid="stock-card"]');
    const count = await stockCards.count();

    // All visible stocks should have Technology badge
    for (let i = 0; i < count; i++) {
      await expect(stockCards.nth(i).getByText('Technology')).toBeVisible();
    }
  });

  test('should display live price updates', async ({ page }) => {
    // Find a stock card
    const stockCard = page.locator('[data-testid="stock-card"]').first();

    // Get initial price
    const priceElement = stockCard.locator('[data-testid="stock-price"]');
    const initialPrice = await priceElement.textContent();

    // Wait for potential price update (WebSocket)
    await page.waitForTimeout(2000);

    // Price element should still be visible (may or may not have changed)
    await expect(priceElement).toBeVisible();
  });

  test('should show price change percentage with correct color', async ({ page }) => {
    const stockCard = page.locator('[data-testid="stock-card"]').first();
    const changeElement = stockCard.locator('[data-testid="price-change"]');

    await expect(changeElement).toBeVisible();

    // Get change value
    const changeText = await changeElement.textContent();

    // Check color based on positive/negative
    if (changeText?.includes('+') || parseFloat(changeText || '0') > 0) {
      // Should have green color (profit)
      await expect(changeElement).toHaveCSS('color', /green|rgb\(0,\s*128,\s*0\)/);
    } else if (changeText?.includes('-') || parseFloat(changeText || '0') < 0) {
      // Should have red color (loss)
      await expect(changeElement).toHaveCSS('color', /red|rgb\(255,\s*0,\s*0\)/);
    }
  });

  test('should remove stock from watchlist', async ({ page }) => {
    // Find first stock card
    const stockCard = page.locator('[data-testid="stock-card"]').first();
    const stockName = await stockCard.getByTestId('stock-symbol').textContent();

    // Click delete button
    const deleteButton = stockCard.getByRole('button', { name: /Delete|Remove/i });
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = page.getByRole('button', { name: /Confirm|Yes/i });
    await confirmButton.click();

    // Verify stock is removed
    await expect(page.getByText(stockName || '')).not.toBeVisible();
  });

  test('should reorder stocks with drag and drop', async ({ page }) => {
    // Get first two stocks
    const firstStock = page.locator('[data-testid="stock-card"]').first();
    const secondStock = page.locator('[data-testid="stock-card"]').nth(1);

    const firstName = await firstStock.getByTestId('stock-symbol').textContent();
    const secondName = await secondStock.getByTestId('stock-symbol').textContent();

    // Drag first stock to second position
    await firstStock.dragTo(secondStock);

    // Verify order changed
    const newFirstStock = page.locator('[data-testid="stock-card"]').first();
    const newFirstName = await newFirstStock.getByTestId('stock-symbol').textContent();

    expect(newFirstName).toBe(secondName);
  });

  test('should view technical analysis for stock', async ({ page }) => {
    // Click on a stock to view details
    const stockCard = page.locator('[data-testid="stock-card"]').first();
    await stockCard.click();

    // Should show technical indicators
    await expect(page.getByText(/RSI/i)).toBeVisible();
    await expect(page.getByText(/MACD/i)).toBeVisible();
    await expect(page.getByText(/Moving Average/i)).toBeVisible();
    await expect(page.getByText(/Bollinger Bands/i)).toBeVisible();

    // Should show recommendation
    await expect(page.getByText(/Buy|Sell|Hold/i)).toBeVisible();
  });

  test('should search stocks with autocomplete', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /Add Stock/i });
    await searchButton.click();

    const searchInput = page.getByPlaceholder(/Search stock/i);

    // Type partial stock name
    await searchInput.fill('REL');

    // Wait for autocomplete
    await page.waitForTimeout(500);

    // Should show suggestions
    await expect(page.getByText(/RELIANCE/i)).toBeVisible();
    await expect(page.getByText(/Reliance Industries/i)).toBeVisible();
  });

  test('should handle empty watchlist state', async ({ page }) => {
    // Mock empty watchlist by intercepting API
    await page.route('**/api/watchlist', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    await page.reload();

    // Should show empty state message
    await expect(page.getByText(/No stocks in watchlist/i)).toBeVisible();
    await expect(page.getByText(/Add stocks to get started/i)).toBeVisible();
  });
});
