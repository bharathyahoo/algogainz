# Toggling Between Real and Mock Data

AlgoGainz supports two data modes for flexibility during development and production:

## 🎯 Quick Toggle

Simply change one environment variable in `backend/.env`:

```env
# Use real market data from Zerodha Kite API
USE_KITE_REAL_DATA=true

# OR

# Use simulated/mock data for testing
USE_KITE_REAL_DATA=false
```

**No code changes required!** Just restart your server after changing the value.

---

## 📊 Data Modes Explained

### Mock Data Mode (`USE_KITE_REAL_DATA=false`)

**Best for:**
- ✅ Development and testing
- ✅ Working outside market hours
- ✅ Avoiding Kite API rate limits
- ✅ Testing without real API credentials

**Behavior:**
- Generates simulated price movements (-1% to +1% per update)
- Updates every second like real data
- No Kite API connection needed
- Works 24/7

**Console Output:**
```
📊 USE_KITE_REAL_DATA=false - Using mock data mode
⚠️  Mock data mode enabled - Using simulated prices
```

### Real Data Mode (`USE_KITE_REAL_DATA=true`)

**Best for:**
- ✅ Production deployment
- ✅ Testing during market hours
- ✅ Actual trading operations

**Behavior:**
- Connects to Zerodha Kite WebSocket
- Fetches real-time market data
- Requires valid Kite API credentials
- Only works during market hours (9:15 AM - 3:30 PM IST)

**Console Output:**
```
🔧 Initializing Kite API (USE_KITE_REAL_DATA=true)...
📥 Fetching instruments from Kite API...
✅ Cached 50000+ instruments
🔌 Connecting to Kite WebSocket...
✅ Connected to Kite WebSocket
✅ Real data mode enabled
```

---

## 🔧 How It Works

The `initializeKiteForUser()` function automatically checks the environment variable:

```typescript
// In backend/src/utils/kiteInitializer.ts

export async function initializeKiteForUser(apiKey, accessToken) {
  const useRealData = process.env.USE_KITE_REAL_DATA === 'true';

  if (!useRealData) {
    // Use mock data - skip Kite initialization
    wsServer.setUseRealData(false);
    return true;
  }

  // Use real data - initialize Kite API
  // ... fetch instruments, connect WebSocket, etc.
}
```

No need to call `enableRealDataMode()` or `disableRealDataMode()` manually!

---

## ✅ Verify Current Mode

### Option 1: Check Server Logs

Look for these messages when your server starts:
- Mock mode: `📊 USE_KITE_REAL_DATA=false - Using mock data mode`
- Real mode: `🔧 Initializing Kite API (USE_KITE_REAL_DATA=true)...`

### Option 2: Health Check Endpoint

Visit `http://localhost:3000/health` or call:

```bash
curl http://localhost:3000/health
```

Response will include:
```json
{
  "kiteApi": {
    "envUseRealData": false,
    "activeMode": "Mock Data"
  },
  "websocket": {
    "dataMode": "mock",
    "dataSource": "Simulated"
  }
}
```

### Option 3: Browser DevTools

In your frontend, check WebSocket messages in DevTools > Network > WS tab.
- Mock data: Prices change randomly
- Real data: Prices match actual market data

### Option 4: Code Check

```typescript
import { getKiteStatus } from '../utils/kiteInitializer';

const status = getKiteStatus();
console.log('Data Source:', status.dataSource);
// Output: "Kite API (Real)" or "Mock Data (Simulated)"
```

---

## 🚀 Development Workflow

### Typical Setup

**Local Development** (`backend/.env`):
```env
USE_KITE_REAL_DATA=false  # Use mock data
```

**Production** (`backend/.env` or hosting platform env vars):
```env
USE_KITE_REAL_DATA=true   # Use real Kite API
```

### Switching Modes

```bash
# Edit backend/.env
nano backend/.env

# Change the value
USE_KITE_REAL_DATA=true

# Restart server
cd backend
npm run dev
```

**Important**: You must restart the server for changes to take effect!

---

## ⚠️ Troubleshooting

### "Still seeing mock data even with USE_KITE_REAL_DATA=true"

**Check:**
1. ✅ `.env` file is in `backend/` directory
2. ✅ Variable is spelled correctly: `USE_KITE_REAL_DATA`
3. ✅ Value is exactly `true` (lowercase, no quotes)
4. ✅ Server was restarted after changing the value
5. ✅ Valid Kite API credentials are set
6. ✅ Testing during market hours (9:15 AM - 3:30 PM IST)

### "Error connecting to Kite even with credentials"

**Solutions:**
1. Verify `KITE_API_KEY` and `KITE_API_SECRET` in `.env`
2. Check if access token is valid (expires in 24 hours)
3. Ensure you're authenticated with Zerodha
4. Check Kite API status: https://kite.trade/status

### "Want to force a mode at runtime"

You can still manually override if needed:

```typescript
import { enableRealDataMode, disableRealDataMode } from '../utils/kiteInitializer';

// Force real data (will show warning if env var is false)
enableRealDataMode();

// Force mock data
disableRealDataMode();
```

But **prefer using the environment variable** for cleaner configuration!

---

## 📚 Related Documentation

- **Quick Start**: [KITE_QUICKSTART.md](./KITE_QUICKSTART.md) - 5-minute setup guide
- **Complete Guide**: [KITE_INTEGRATION_GUIDE.md](./KITE_INTEGRATION_GUIDE.md) - Full documentation
- **Code Examples**: [backend/src/utils/kiteInitializer.ts](../backend/src/utils/kiteInitializer.ts) - Helper functions

---

## 💡 Best Practices

1. **Default to mock in development**
   ```env
   USE_KITE_REAL_DATA=false
   ```

2. **Only enable real data when needed**
   - Testing real API integration
   - Production deployment
   - During market hours for actual data

3. **Check the mode in logs**
   - Always verify which mode is active on server start
   - Use health check endpoint to confirm

4. **Document your .env setup**
   - Add comments in `.env` file
   - Keep `.env.example` updated
   - Share setup instructions with your team

5. **Use environment-specific configs**
   - `.env.development` → `USE_KITE_REAL_DATA=false`
   - `.env.production` → `USE_KITE_REAL_DATA=true`

---

**Summary**: Change `USE_KITE_REAL_DATA` in `.env`, restart server, done! 🎉
