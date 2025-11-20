# Kite API Quick Start Guide

Get real-time market data from Zerodha Kite in 5 minutes!

## Step 1: Get Kite API Credentials

1. Go to [https://developers.kite.trade/](https://developers.kite.trade/)
2. Create a new app
3. Copy your **API Key** and **API Secret**

## Step 2: Add Environment Variables

### Backend `.env`

```env
KITE_API_KEY=your_api_key_here
KITE_API_SECRET=your_api_secret_here
KITE_REDIRECT_URL=http://localhost:3000/auth/callback

# Toggle between real Kite data and mock data
# Set to 'true' for production, 'false' for testing (default: false)
USE_KITE_REAL_DATA=false
```

**Important**: Set `USE_KITE_REAL_DATA=true` to use real market data, or `false` to use mock data for testing.

### Frontend `.env`

```env
VITE_KITE_API_KEY=your_api_key_here
```

## Step 3: Add Initialization Code

In your **authentication callback handler** (`backend/src/routes/auth.ts`):

```typescript
import {
  initializeKiteForUser,
  subscribeToWatchlist
} from '../utils/kiteInitializer';

router.get('/callback', async (req, res) => {
  try {
    const { request_token } = req.query;

    // Exchange request token for access token
    const kiteConnect = new KiteConnect({
      api_key: process.env.KITE_API_KEY!
    });

    const session = await kiteConnect.generateSession(request_token as string);
    const { access_token, user_id } = session;

    // Store in database
    await prisma.user.update({
      where: { kiteUserId: user_id },
      data: {
        accessToken: access_token,
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    // 🚀 Initialize Kite (automatically uses USE_KITE_REAL_DATA env var)
    await initializeKiteForUser(
      process.env.KITE_API_KEY!,
      access_token
    );

    // Subscribe to user's watchlist
      const watchlist = await prisma.watchlist.findMany({
        where: { userId: user_id }
      });

      if (watchlist.length > 0) {
        const symbols = watchlist.map(w => w.stockSymbol);
        await subscribeToWatchlist(symbols);
      }
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Auth failed:', error);
    res.redirect('/login?error=auth_failed');
  }
});
```

## Step 4: Subscribe When Adding to Watchlist

In **watchlist routes** (`backend/src/routes/watchlist.ts`):

```typescript
import { subscribeToWatchlist } from '../utils/kiteInitializer';

router.post('/watchlist', async (req, res) => {
  const { symbol } = req.body;

  // Add to database
  const item = await prisma.watchlist.create({
    data: { userId: req.user.id, stockSymbol: symbol }
  });

  // 🚀 Subscribe to real-time updates
  await subscribeToWatchlist([symbol]);

  res.json({ success: true, data: item });
});
```

## Step 5: Test It!

1. **Choose your data mode** in `.env`:
   ```env
   # For testing with mock data:
   USE_KITE_REAL_DATA=false

   # For production with real Kite data:
   USE_KITE_REAL_DATA=true
   ```

2. **Start your server**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Login** through Zerodha (triggers Kite initialization)

4. **Add a stock** to watchlist during market hours (9:15 AM - 3:30 PM IST)

5. **Watch live prices update** every second! 🎉

**Tip**: Use `USE_KITE_REAL_DATA=false` during development to avoid rate limits and test without market hours restrictions.

## Verify It's Working

### If `USE_KITE_REAL_DATA=true`, check the console for:

```
🔧 Initializing Kite API (USE_KITE_REAL_DATA=true)...
📥 Fetching instruments from Kite API...
✅ Cached 50000+ instruments
🔌 Connecting to Kite WebSocket...
✅ Connected to Kite WebSocket
✅ Real data mode enabled
📊 Subscribed to 5 symbols: RELIANCE, TCS, INFY, HDFC, ICICIBANK
```

### If `USE_KITE_REAL_DATA=false`, check the console for:

```
📊 USE_KITE_REAL_DATA=false - Using mock data mode
⚠️  Mock data mode enabled - Using simulated prices
```

In the browser console, you should see:

```javascript
📊 Price update received: {
  symbol: 'RELIANCE',
  price: 2534.50,
  change: 12.30,
  changePercent: 0.49,
  volume: 1245000,
  timestamp: '2025-11-20T10:30:15.000Z'
}
```

## Troubleshooting

### "Instrument token not found"

**Problem**: Symbol not in Kite's instrument list

**Solution**: Verify symbol name at [https://kite.zerodha.com/](https://kite.zerodha.com/)

### "Failed to connect to Kite WebSocket"

**Problem**: Invalid credentials or token expired

**Solution**:
1. Check `.env` file has correct `KITE_API_KEY`
2. Re-login (tokens expire after 24 hours)
3. Check Kite API status: [https://kite.trade/status](https://kite.trade/status)

### "Prices not updating"

**Problem**: Market is closed or not subscribed

**Solution**:
1. Test during market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
2. Check if subscribed: `getKiteStatus().subscribedInstruments`
3. Verify WebSocket connection in browser DevTools > Network > WS

### Still using mock data

**Problem**: Real data mode not enabled

**Solution**:
1. Check your `.env` file has `USE_KITE_REAL_DATA=true`
2. Restart your server after changing the environment variable
3. Verify initialization logs show "Initializing Kite API (USE_KITE_REAL_DATA=true)"

```env
# In backend/.env
USE_KITE_REAL_DATA=true
```

## Next Steps

✅ **Working?** Great! Now read the complete guide:
- **Full Documentation**: [KITE_INTEGRATION_GUIDE.md](./KITE_INTEGRATION_GUIDE.md)
- **Handle token expiry** (tokens expire in 24 hours)
- **Implement rate limiting** (10 req/sec max)
- **Setup production deployment**

## Quick Reference

### Environment Variable

```env
# Toggle between real and mock data (in backend/.env)
USE_KITE_REAL_DATA=true   # Use real Kite API (production)
USE_KITE_REAL_DATA=false  # Use mock data (development/testing)
```

### Initialization Functions

```typescript
// Initialize Kite API after login (respects USE_KITE_REAL_DATA env var)
await initializeKiteForUser(apiKey, accessToken);

// Subscribe to stocks
await subscribeToWatchlist(['RELIANCE', 'TCS']);

// Check status
const status = getKiteStatus();
console.log(status);
// {
//   envUseRealData: true,        // From .env file
//   useRealData: true,           // Currently active
//   connected: true,
//   subscribedInstruments: 5,
//   dataSource: 'Kite API (Real)' or 'Mock Data (Simulated)'
// }

// Manual override (rarely needed - prefer USE_KITE_REAL_DATA env var)
enableRealDataMode();   // Force enable real data
disableRealDataMode();  // Force enable mock data
```

### Market Hours (IST)

- **Trading**: 9:15 AM - 3:30 PM (Mon-Fri)
- **Pre-market**: 9:00 AM - 9:15 AM
- **Post-market**: 3:40 PM - 4:00 PM

### Rate Limits

- **Quote API**: 10 requests/second
- **Historical**: 3 requests/second
- **WebSocket**: Unlimited (use this for real-time!)

---

**Need Help?** See [KITE_INTEGRATION_GUIDE.md](./KITE_INTEGRATION_GUIDE.md) for detailed troubleshooting and examples.
