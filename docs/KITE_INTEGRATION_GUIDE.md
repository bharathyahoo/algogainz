# Kite Connect API Integration Guide

This guide explains how to enable real-time market data from Zerodha Kite Connect in AlgoGainz.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Server Initialization](#server-initialization)
4. [Testing Real Data](#testing-real-data)
5. [Troubleshooting](#troubleshooting)
6. [API Rate Limits](#api-rate-limits)

---

## Prerequisites

### 1. Kite Connect Developer Account

You need a Kite Connect developer account to access the API:

1. Go to [https://developers.kite.trade/](https://developers.kite.trade/)
2. Sign in with your Zerodha account
3. Create a new app to get your API credentials
4. Note down your **API Key** and **API Secret**

### 2. Get Access Token

Kite Connect uses OAuth 2.0 for authentication. You need to:

1. Implement the OAuth flow in your application (already done in AlgoGainz)
2. Users will log in through Zerodha and grant permissions
3. Exchange the request token for an access token
4. Store the access token securely (valid for 24 hours)

**Important**: Access tokens expire after 24 hours. You'll need to implement token refresh logic or ask users to re-authenticate daily.

---

## Environment Setup

### Backend Environment Variables

Add these to your `backend/.env` file:

```env
# Kite Connect Credentials
KITE_API_KEY=your_api_key_here
KITE_API_SECRET=your_api_secret_here
KITE_REDIRECT_URL=http://localhost:3000/auth/callback

# For production, use your domain:
# KITE_REDIRECT_URL=https://yourdomain.com/auth/callback
```

### Frontend Environment Variables

Add to your `frontend/.env`:

```env
VITE_KITE_API_KEY=your_api_key_here
```

---

## Server Initialization

### Step 1: Initialize Instrument Mapping

After a user successfully authenticates with Kite, initialize the instrument service:

```typescript
// In your authentication callback handler
// backend/src/routes/auth.ts

import { wsServer } from '../websocket/server';
import { instrumentService } from '../services/instrumentService';

router.get('/callback', async (req, res) => {
  try {
    const { request_token } = req.query;

    // Exchange request token for access token
    const { access_token, user_id } = await kiteConnect.generateSession(request_token);

    // Store access token in database for this user
    await User.update({
      where: { kiteUserId: user_id },
      data: {
        accessToken: access_token,
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // Initialize Kite WebSocket with real data
    await initializeKiteRealData(process.env.KITE_API_KEY!, access_token);

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Authentication failed:', error);
    res.redirect('/login?error=auth_failed');
  }
});

async function initializeKiteRealData(apiKey: string, accessToken: string) {
  try {
    // Fetch and cache instrument mappings (takes ~5-10 seconds)
    console.log('📥 Fetching instruments from Kite...');
    await instrumentService.fetchInstruments(apiKey);

    // Initialize Kite WebSocket connection
    console.log('🔌 Connecting to Kite WebSocket...');
    await wsServer.initializeKiteData(apiKey, accessToken);

    // Enable real data mode
    wsServer.setUseRealData(true);

    console.log('✅ Kite real-time data enabled');
  } catch (error) {
    console.error('❌ Failed to initialize Kite data:', error);
    // Fall back to mock data
    wsServer.setUseRealData(false);
  }
}
```

### Step 2: Subscribe to User's Watchlist

When a user adds stocks to their watchlist, subscribe to Kite WebSocket:

```typescript
// backend/src/routes/watchlist.ts

router.post('/watchlist', async (req, res) => {
  const { symbol, exchange = 'NSE', category } = req.body;
  const userId = req.user.id;

  try {
    // Add to database
    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId,
        stockSymbol: symbol,
        exchange,
        category,
      }
    });

    // Subscribe to real-time updates (if real data mode is enabled)
    await wsServer.subscribeToKite([symbol]);

    res.json({ success: true, data: watchlistItem });
  } catch (error) {
    console.error('Failed to add to watchlist:', error);
    res.status(500).json({ success: false, error: 'Failed to add stock' });
  }
});
```

### Step 3: Handle Token Expiry

Access tokens expire after 24 hours. Implement automatic re-authentication:

```typescript
// backend/src/middleware/kiteAuth.ts

export async function ensureValidKiteToken(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findUnique({ where: { id: req.user.id } });

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
      await User.update({
        where: { id: user.id },
        data: { accessToken: null, tokenExpiry: null }
      });

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
```

---

## Testing Real Data

### Step 1: Enable Mock Data First

Before testing with real Kite data, ensure mock data works:

```typescript
// This is the default mode
wsServer.setUseRealData(false);
```

### Step 2: Test During Market Hours

Kite API only provides real-time data during market hours:

- **NSE/BSE Trading Hours**: 9:15 AM - 3:30 PM IST (Monday-Friday)
- **Pre-market**: 9:00 AM - 9:15 AM IST
- **Post-market**: 3:40 PM - 4:00 PM IST

Outside these hours, you'll receive the last traded price.

### Step 3: Verify Instrument Mapping

Check if instruments are being fetched correctly:

```typescript
import { instrumentService } from './services/instrumentService';

// Get instrument token for a symbol
const token = instrumentService.getInstrumentToken('RELIANCE', 'NSE');
console.log('RELIANCE token:', token); // Should print a number like 738561

// Get all stats
const stats = instrumentService.getStats();
console.log('Instrument cache stats:', stats);
// Output: { cachedInstruments: 50000+, lastFetchTime: Date, cacheValid: true }
```

### Step 4: Monitor WebSocket Connection

Check WebSocket connectivity in the browser console:

```typescript
// Frontend: Add this to HoldingsPage or WatchlistPage useEffect

useEffect(() => {
  const handleConnect = () => {
    console.log('✅ Connected to WebSocket server');
  };

  const handleDisconnect = () => {
    console.warn('🔌 Disconnected from WebSocket server');
  };

  websocketService.on('connect', handleConnect);
  websocketService.on('disconnect', handleDisconnect);

  return () => {
    websocketService.off('connect', handleConnect);
    websocketService.off('disconnect', handleDisconnect);
  };
}, []);
```

### Step 5: Verify Price Updates

Subscribe to a stock and check if prices update:

```typescript
// Frontend: Subscribe to price updates
useEffect(() => {
  const handlePriceUpdate = (data: any) => {
    console.log('📊 Price update received:', data);
    // Should show: { symbol, price, change, changePercent, volume, timestamp }
  };

  websocketService.subscribeToSymbol('RELIANCE');
  websocketService.on('priceUpdate', handlePriceUpdate);

  return () => {
    websocketService.unsubscribeFromSymbol('RELIANCE');
    websocketService.off('priceUpdate', handlePriceUpdate);
  };
}, []);
```

---

## Troubleshooting

### Issue 1: "Instrument token not found for NSE:SYMBOL"

**Cause**: Symbol doesn't exist or instruments haven't been fetched

**Solution**:
1. Verify the symbol is correct (use Kite's instrument search)
2. Check if instruments are cached: `instrumentService.isCached()`
3. Manually fetch instruments: `await instrumentService.fetchInstruments(apiKey)`

### Issue 2: "Failed to connect to Kite WebSocket"

**Possible Causes**:
- Invalid API key or access token
- Token expired (valid for 24 hours only)
- Network connectivity issues
- Kite API is down (check [https://kite.trade/status](https://kite.trade/status))

**Solution**:
1. Verify credentials in `.env`
2. Check token expiry in database
3. Re-authenticate user
4. Check Kite API status

### Issue 3: Prices Not Updating

**Possible Causes**:
- Market is closed
- Not subscribed to the symbol
- WebSocket disconnected
- Still in mock data mode

**Solution**:
1. Check market hours (9:15 AM - 3:30 PM IST)
2. Verify subscription: `wsServer.getKiteWebSocketClient()?.getSubscribedTokens()`
3. Check WebSocket status in browser DevTools > Network > WS
4. Verify real data mode is enabled: `wsServer.setUseRealData(true)`

### Issue 4: "Too Many Requests" Error

**Cause**: Exceeded Kite API rate limits

**Solution**:
- See [API Rate Limits](#api-rate-limits) section below
- Implement request throttling
- Use WebSocket for real-time data instead of polling

### Issue 5: Binary Data Parsing Errors

**Cause**: Unexpected packet format from Kite

**Solution**:
1. Check Kite API documentation for updates
2. Enable debug logging in `kiteBinaryParser.ts`:
```typescript
console.log('Packet length:', length);
console.log('Buffer:', packet.toString('hex'));
```
3. Verify packet lengths match spec (8, 44, or 184 bytes)

---

## API Rate Limits

Kite Connect enforces strict rate limits:

### Quote & Order APIs
- **10 requests per second** per API key
- Burst limit: 1 request per 100ms

### Historical Data API
- **3 requests per second** per API key
- Burst limit: 1 request per 333ms

### WebSocket
- **Unlimited** real-time tick updates
- **3000 instruments** max per connection

### Best Practices

1. **Use WebSocket for Real-time Data**
   - Don't poll quote API every second
   - Subscribe to instruments via WebSocket
   - Kite sends updates automatically

2. **Batch Requests**
   - Fetch quotes for multiple symbols in one request
   - Example: `/quote?i=NSE:RELIANCE&i=NSE:TCS&i=NSE:INFY`

3. **Cache Aggressively**
   - Cache instrument list for 24 hours (already implemented)
   - Cache historical data
   - Use stale-while-revalidate strategy

4. **Implement Exponential Backoff**
   ```typescript
   async function fetchWithRetry(fn: () => Promise<any>, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error: any) {
         if (error.statusCode === 429) { // Too many requests
           const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
           await new Promise(resolve => setTimeout(resolve, delay));
         } else {
           throw error;
         }
       }
     }
   }
   ```

5. **Monitor API Usage**
   ```typescript
   let requestCount = 0;
   const REQUEST_LIMIT = 10;
   const WINDOW_MS = 1000;

   setInterval(() => {
     requestCount = 0;
   }, WINDOW_MS);

   async function makeKiteRequest() {
     if (requestCount >= REQUEST_LIMIT) {
       throw new Error('Rate limit exceeded. Please wait.');
     }
     requestCount++;
     // Make request...
   }
   ```

---

## Production Deployment Checklist

- [ ] Environment variables set in production
- [ ] HTTPS enabled (required for WebSocket over SSL)
- [ ] Token refresh logic implemented
- [ ] Error handling for expired tokens
- [ ] Rate limiting middleware configured
- [ ] Instrument cache persistence (consider Redis)
- [ ] WebSocket reconnection logic tested
- [ ] Fallback to mock data on Kite API failure
- [ ] Monitoring and alerting for API errors
- [ ] User notification for token expiry

---

## Additional Resources

- **Kite Connect Documentation**: [https://kite.trade/docs/connect/v3/](https://kite.trade/docs/connect/v3/)
- **WebSocket Documentation**: [https://kite.trade/docs/connect/v3/websocket/](https://kite.trade/docs/connect/v3/websocket/)
- **Kite API Status**: [https://kite.trade/status](https://kite.trade/status)
- **Developer Forum**: [https://kite.trade/forum/](https://kite.trade/forum/)

---

## Summary

To enable real Kite data in AlgoGainz:

1. **Get API credentials** from Kite Connect developer portal
2. **Add to environment variables** (backend and frontend .env files)
3. **Initialize on authentication**: Call `wsServer.initializeKiteData()` after user logs in
4. **Enable real data mode**: Call `wsServer.setUseRealData(true)`
5. **Subscribe to symbols**: Automatically done when users add to watchlist
6. **Test during market hours**: Verify prices update every second
7. **Handle token expiry**: Re-authenticate users every 24 hours

The system will automatically:
- Fetch and cache 50,000+ instrument mappings
- Connect to Kite WebSocket
- Parse binary tick data
- Update prices in real-time
- Fall back to mock data on errors

**Next Steps**: See `backend/src/index.ts` for the complete initialization example.
