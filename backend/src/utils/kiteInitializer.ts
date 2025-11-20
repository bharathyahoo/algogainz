/**
 * Kite API Initialization Utility
 *
 * This file contains helper functions to initialize Kite Connect API
 * for real-time market data in AlgoGainz.
 *
 * Usage:
 * 1. Call initializeKiteForUser() after successful authentication
 * 2. Call enableRealDataMode() to switch from mock to real data
 * 3. Call refreshKiteConnection() daily (tokens expire in 24 hours)
 *
 * See docs/KITE_INTEGRATION_GUIDE.md for detailed setup instructions
 */

import { wsServer } from '../websocket/server';
import { instrumentService } from '../services/instrumentService';
import { getKiteWebSocketClient, initializeKiteWebSocket } from '../websocket/kiteWebSocket';

/**
 * Initialize Kite API for a user after successful authentication
 *
 * This should be called in your authentication callback handler
 * after exchanging the request token for an access token.
 *
 * @param apiKey - Your Kite API key (from environment variable)
 * @param accessToken - User's access token (from Kite OAuth)
 * @returns Promise<boolean> - true if initialization successful
 *
 * @example
 * ```typescript
 * // In backend/src/routes/auth.ts
 * router.get('/callback', async (req, res) => {
 *   const { request_token } = req.query;
 *
 *   // Exchange request token for access token
 *   const { access_token } = await kiteConnect.generateSession(request_token);
 *
 *   // Initialize Kite real-time data
 *   const initialized = await initializeKiteForUser(
 *     process.env.KITE_API_KEY!,
 *     access_token
 *   );
 *
 *   if (initialized) {
 *     console.log('✅ Kite real-time data enabled for user');
 *   }
 * });
 * ```
 */
export async function initializeKiteForUser(
  apiKey: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Check if real data mode is enabled via environment variable
    const useRealData = process.env.USE_KITE_REAL_DATA === 'true';

    if (!useRealData) {
      console.log('📊 USE_KITE_REAL_DATA=false - Using mock data mode');
      wsServer.setUseRealData(false);
      return true; // Return success but use mock data
    }

    console.log('🔧 Initializing Kite API (USE_KITE_REAL_DATA=true)...');

    // Step 1: Fetch and cache instrument mappings
    // This fetches the complete list of ~50,000 instruments from Kite
    // and caches them for symbol-to-token mapping
    console.log('📥 Fetching instruments from Kite API...');
    await instrumentService.fetchInstruments(apiKey);

    const stats = instrumentService.getStats();
    console.log(`✅ Cached ${stats.cachedInstruments} instruments`);

    // Step 2: Initialize Kite WebSocket connection
    console.log('🔌 Connecting to Kite WebSocket...');
    await wsServer.initializeKiteData(apiKey, accessToken);

    const kiteClient = getKiteWebSocketClient();
    if (kiteClient && kiteClient.isClientConnected()) {
      console.log('✅ Connected to Kite WebSocket');

      // Step 3: Enable real data mode
      wsServer.setUseRealData(true);
      console.log('✅ Real data mode enabled');

      return true;
    } else {
      console.warn('⚠️  Kite WebSocket connection failed - falling back to mock data');
      wsServer.setUseRealData(false);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to initialize Kite API:', error.message);
    console.log('⚠️  Falling back to mock data mode');
    wsServer.setUseRealData(false);
    return false;
  }
}

/**
 * Enable real data mode (switch from mock to Kite API)
 *
 * Note: This is now controlled by the USE_KITE_REAL_DATA environment variable.
 * This function is mainly for runtime toggling in special cases.
 *
 * @example
 * ```typescript
 * // Typically not needed - use USE_KITE_REAL_DATA env var instead
 * enableRealDataMode();
 * ```
 */
export function enableRealDataMode(): void {
  const envSetting = process.env.USE_KITE_REAL_DATA === 'true';

  if (!envSetting) {
    console.warn('⚠️  USE_KITE_REAL_DATA is set to false in environment variables');
    console.warn('⚠️  Consider setting USE_KITE_REAL_DATA=true in .env instead of calling this function');
  }

  wsServer.setUseRealData(true);
  console.log('✅ Real data mode enabled - Using Kite API for live prices');
}

/**
 * Disable real data mode (switch to mock data)
 *
 * Useful for testing or when Kite API is unavailable
 *
 * @example
 * ```typescript
 * disableRealDataMode(); // Fall back to mock data
 * ```
 */
export function disableRealDataMode(): void {
  wsServer.setUseRealData(false);
  console.log('⚠️  Mock data mode enabled - Using simulated prices');
}

/**
 * Check if Kite API is initialized and connected
 *
 * @returns Object with connection status and stats
 *
 * @example
 * ```typescript
 * const status = getKiteStatus();
 * console.log('Connected:', status.connected);
 * console.log('Using real data:', status.useRealData);
 * console.log('Subscribed instruments:', status.subscribedInstruments);
 * ```
 */
export function getKiteStatus() {
  const kiteClient = getKiteWebSocketClient();
  const instrumentStats = instrumentService.getStats();
  const envUseRealData = process.env.USE_KITE_REAL_DATA === 'true';
  const wsStats = wsServer.getStats();

  return {
    // Environment configuration
    envUseRealData, // What's set in .env file
    useRealData: wsStats.useRealData || false, // What's currently active

    // WebSocket connection status
    connected: kiteClient?.isClientConnected() || false,
    subscribedInstruments: kiteClient?.getSubscribedTokens().length || 0,

    // Instrument cache status
    cachedInstruments: instrumentStats.cachedInstruments,
    cacheValid: instrumentStats.cacheValid,
    lastFetch: instrumentStats.lastFetchTime,

    // Data source info
    dataSource: wsStats.useRealData ? 'Kite API (Real)' : 'Mock Data (Simulated)',
  };
}

/**
 * Refresh Kite connection with new access token
 *
 * Kite access tokens expire after 24 hours. Call this function
 * daily to refresh the connection with a new token.
 *
 * @param apiKey - Your Kite API key
 * @param newAccessToken - Fresh access token from re-authentication
 *
 * @example
 * ```typescript
 * // In a daily cron job or token refresh handler
 * const newToken = await refreshUserKiteToken(userId);
 * await refreshKiteConnection(process.env.KITE_API_KEY!, newToken);
 * ```
 */
export async function refreshKiteConnection(
  apiKey: string,
  newAccessToken: string
): Promise<boolean> {
  try {
    console.log('🔄 Refreshing Kite connection with new access token...');

    // Re-initialize WebSocket with new token
    await wsServer.initializeKiteData(apiKey, newAccessToken);

    const kiteClient = getKiteWebSocketClient();
    if (kiteClient && kiteClient.isClientConnected()) {
      console.log('✅ Kite connection refreshed successfully');
      return true;
    } else {
      console.warn('⚠️  Failed to refresh Kite connection');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error refreshing Kite connection:', error.message);
    return false;
  }
}

/**
 * Subscribe to watchlist symbols on Kite WebSocket
 *
 * Call this when a user adds stocks to their watchlist
 *
 * @param symbols - Array of stock symbols to subscribe to
 *
 * @example
 * ```typescript
 * // When user adds stocks to watchlist
 * await subscribeToWatchlist(['RELIANCE', 'TCS', 'INFY']);
 * ```
 */
export async function subscribeToWatchlist(symbols: string[]): Promise<void> {
  try {
    await wsServer.subscribeToKite(symbols);
    console.log(`📊 Subscribed to ${symbols.length} symbols:`, symbols.join(', '));
  } catch (error: any) {
    console.error('❌ Failed to subscribe to symbols:', error.message);
    throw error;
  }
}

/**
 * Complete initialization example
 *
 * This is a complete example showing how to initialize Kite API
 * in your authentication flow.
 */
export async function completeInitializationExample() {
  /*

  COMPLETE EXAMPLE: Add this to backend/src/routes/auth.ts

  import {
    initializeKiteForUser,
    enableRealDataMode,
    subscribeToWatchlist,
    getKiteStatus
  } from '../utils/kiteInitializer';

  router.get('/callback', async (req, res) => {
    try {
      const { request_token } = req.query;

      // Step 1: Exchange request token for access token
      const kiteConnect = new KiteConnect({ api_key: process.env.KITE_API_KEY! });
      const session = await kiteConnect.generateSession(request_token as string);

      const { access_token, user_id } = session;

      // Step 2: Store access token in database
      await prisma.user.update({
        where: { kiteUserId: user_id },
        data: {
          accessToken: access_token,
          tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });

      // Step 3: Initialize Kite API for real-time data
      const initialized = await initializeKiteForUser(
        process.env.KITE_API_KEY!,
        access_token
      );

      if (initialized) {
        // Step 4: Enable real data mode
        enableRealDataMode();

        // Step 5: Subscribe to user's watchlist (if any)
        const watchlist = await prisma.watchlist.findMany({
          where: { userId: user_id }
        });

        if (watchlist.length > 0) {
          const symbols = watchlist.map(w => w.stockSymbol);
          await subscribeToWatchlist(symbols);
        }

        // Step 6: Check status
        const status = getKiteStatus();
        console.log('Kite Status:', status);
      } else {
        // Fall back to mock data if initialization fails
        console.warn('Using mock data - Kite initialization failed');
      }

      // Redirect to dashboard
      res.redirect('/dashboard?kite_connected=true');

    } catch (error) {
      console.error('Authentication failed:', error);
      res.redirect('/login?error=auth_failed');
    }
  });

  */
}

/**
 * Token expiry handler example
 */
export async function tokenExpiryHandlerExample() {
  /*

  EXAMPLE: Handle token expiry in middleware

  // backend/src/middleware/kiteAuth.ts

  export async function ensureValidKiteToken(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user?.accessToken || !user?.tokenExpiry) {
        return res.status(401).json({
          success: false,
          error: 'KITE_TOKEN_MISSING',
          message: 'Please reconnect to Zerodha'
        });
      }

      // Check if token is expired
      if (new Date() > user.tokenExpiry) {
        // Clear expired token
        await prisma.user.update({
          where: { id: user.id },
          data: { accessToken: null, tokenExpiry: null }
        });

        // Disable real data mode (fall back to mock)
        disableRealDataMode();

        return res.status(401).json({
          success: false,
          error: 'KITE_TOKEN_EXPIRED',
          message: 'Your Zerodha session has expired. Please reconnect.'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  */
}

// Export all functions
export default {
  initializeKiteForUser,
  enableRealDataMode,
  disableRealDataMode,
  getKiteStatus,
  refreshKiteConnection,
  subscribeToWatchlist,
};
