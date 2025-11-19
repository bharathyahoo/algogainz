/**
 * E2E Tests: Authentication Flow
 * Tests the complete login/logout flow with Zerodha OAuth
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Verify login page is shown
    await expect(page.getByRole('heading', { name: /AlgoGainz/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect to Zerodha/i })).toBeVisible();
  });

  test('should redirect to Zerodha login on Connect button click', async ({ page }) => {
    // Click Connect to Zerodha button
    const connectButton = page.getByRole('button', { name: /Connect to Zerodha/i });
    await connectButton.click();

    // Should redirect to Kite login page
    // Note: In real scenario, this would redirect to kite.zerodha.com
    // For testing, we might need to mock this or use a test OAuth endpoint
    await page.waitForURL(/.*kite.*|.*auth.*/);
  });

  test('should show error message for failed login', async ({ page }) => {
    // Simulate failed login by navigating to callback with invalid token
    await page.goto('/auth/callback?status=error');

    // Should show error message
    await expect(page.getByText(/authentication failed/i)).toBeVisible();
  });

  test('should successfully authenticate and redirect to dashboard', async ({ page, context }) => {
    // Mock successful authentication by setting auth token
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-jwt-token-for-testing',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Set user in localStorage
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        userId: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
      }));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Should show dashboard content
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('should logout successfully', async ({ page, context }) => {
    // Set authenticated state
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
    });

    await page.goto('/dashboard');

    // Click logout button (usually in user menu)
    const userMenu = page.getByRole('button', { name: /Test User|Account/i });
    await userMenu.click();

    const logoutButton = page.getByRole('menuitem', { name: /Logout/i });
    await logoutButton.click();

    // Should redirect to login page
    await expect(page.getByRole('button', { name: /Connect to Zerodha/i })).toBeVisible();

    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('should maintain authentication across page reloads', async ({ page, context }) => {
    // Set authenticated state
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

    await page.goto('/dashboard');

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('should redirect to login if accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page.getByRole('button', { name: /Connect to Zerodha/i })).toBeVisible();
  });
});
