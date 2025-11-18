# AlgoGainz - Development Guide

## Project Overview

You are building **AlgoGainz** - a Progressive Web Application (PWA) for short-term stock trading that integrates with Zerodha's Kite Connect API. AlgoGainz is an intelligent trading assistant that helps traders make data-driven decisions using technical indicators, execute trades, track portfolios, and manage exit strategies.

**Key Principle**: AlgoGainz ONLY tracks transactions made through this application or manually recorded by the user. Direct Zerodha Kite trades are NOT automatically synchronized.

## Essential Documents

1. **PRD (Product Requirements Document)**: `AlgoGainz_PRD.md` - Contains complete functional requirements, user stories, and specifications (also available as .docx)
2. **This File (CLAUDE.md)**: Technical implementation guide and development workflow

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI (MUI) v5+ or Ant Design
- **PWA**: Workbox for service workers
- **Charts**: Recharts or Lightweight Charts by TradingView
- **Build Tool**: Vite or Create React App
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 18+ with Express.js OR Python 3.10+ with FastAPI
- **Database**: PostgreSQL 14+ (for production) or SQLite (for development)
- **ORM**: Prisma (Node.js) or SQLAlchemy (Python)
- **API**: RESTful with WebSocket support
- **Authentication**: JWT tokens

### Technical Analysis
- **Library**: technicalindicators (Node.js) or TA-Lib (Python)
- **Indicators**: RSI, MACD, Moving Averages, Bollinger Bands, Volume Analysis

### External APIs
- **Trading**: Zerodha Kite Connect API v3
- **Real-time Data**: Kite Connect WebSocket

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm/yarn (Frontend), npm/pip (Backend)
- **Environment Variables**: dotenv
- **Testing**: Jest + React Testing Library (Frontend), Pytest (Backend)

## Project Structure

```
algogainz/
├── frontend/
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── service-worker.js      # Service worker
│   │   └── icons/                 # App icons (various sizes)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── common/           # Buttons, inputs, modals
│   │   │   ├── watchlist/        # Watchlist components
│   │   │   ├── holdings/         # Holdings components
│   │   │   ├── transactions/     # Transaction components
│   │   │   ├── dashboard/        # Dashboard components
│   │   │   └── charts/           # Chart components
│   │   ├── pages/                # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Watchlist.tsx
│   │   │   ├── Holdings.tsx
│   │   │   ├── Transactions.tsx
│   │   │   └── Reports.tsx
│   │   ├── services/             # API services
│   │   │   ├── api.ts           # Axios/fetch setup
│   │   │   ├── kiteService.ts   # Kite API integration
│   │   │   ├── tradingService.ts
│   │   │   └── websocketService.ts
│   │   ├── store/                # Redux/Zustand store
│   │   │   ├── slices/          # Redux slices
│   │   │   └── index.ts
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Utility functions
│   │   │   ├── calculations.ts   # P&L, averages
│   │   │   ├── formatters.ts     # Date, currency formatting
│   │   │   └── validators.ts     # Input validation
│   │   ├── types/                # TypeScript types
│   │   ├── constants/            # Constants
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── routes/               # API routes
│   │   │   ├── auth.js          # Authentication routes
│   │   │   ├── watchlist.js
│   │   │   ├── trading.js       # Buy/sell orders
│   │   │   ├── transactions.js
│   │   │   ├── holdings.js
│   │   │   ├── analysis.js      # Technical analysis
│   │   │   └── reports.js
│   │   ├── controllers/          # Route controllers
│   │   ├── models/               # Database models
│   │   │   ├── User.js
│   │   │   ├── Watchlist.js
│   │   │   ├── Transaction.js
│   │   │   ├── Holding.js
│   │   │   └── ExitStrategy.js
│   │   ├── services/             # Business logic
│   │   │   ├── kiteService.js   # Kite API wrapper
│   │   │   ├── technicalAnalysis.js
│   │   │   ├── portfolioService.js
│   │   │   └── alertService.js
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── utils/
│   │   ├── config/               # Configuration
│   │   │   └── database.js
│   │   ├── websocket/            # WebSocket handlers
│   │   └── app.js
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── API.md                    # API documentation
│   ├── SETUP.md                  # Setup instructions
│   └── DEPLOYMENT.md             # Deployment guide
├── .gitignore
├── README.md
└── CLAUDE.md                     # This file
```

## Development Workflow

### Phase 1: Project Setup and Infrastructure (Week 1)

**Step 1.1: Initialize Project**
```bash
# Create project directories
mkdir algogainz
cd algogainz
mkdir frontend backend docs

# Initialize frontend
cd frontend
npm create vite@latest . -- --template react-ts
npm install

# Initialize backend (Node.js example)
cd ../backend
npm init -y
```

**Step 1.2: Install Core Dependencies**

Frontend:
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @reduxjs/toolkit react-redux
npm install react-router-dom
npm install axios
npm install recharts
npm install date-fns
npm install workbox-webpack-plugin
```

Backend (Node.js):
```bash
npm install express cors dotenv
npm install prisma @prisma/client
npm install jsonwebtoken bcrypt
npm install ws socket.io
npm install axios
npm install technicalindicators
npm install exceljs
npm install express-rate-limit
```

**Step 1.3: Setup Database**
- Create database schema for:
  - Users (id, kite_user_id, access_token, api_key, etc.)
  - Watchlist (id, user_id, stock_symbol, categories, created_at)
  - Transactions (id, user_id, stock_symbol, type, quantity, price, charges, source, timestamp)
  - Holdings (id, user_id, stock_symbol, quantity, avg_buy_price, total_invested)
  - ExitStrategies (id, holding_id, profit_target_pct, stop_loss_pct, alert_enabled)

**Step 1.4: Setup PWA Basics**
- Create `manifest.json` with app metadata
- Generate app icons (192x192, 512x512)
- Setup basic service worker for caching

### Phase 2: Authentication and Kite Integration (Week 1-2)

**Step 2.1: Implement Zerodha OAuth Flow**
```typescript
// Backend: /routes/auth.js
// 1. GET /auth/login - Redirect to Kite login
// 2. GET /auth/callback - Handle callback, exchange request token
// 3. POST /auth/logout - Invalidate session

// Reference: https://kite.trade/docs/connect/v3/user/
```

**Step 2.2: Create Kite Service Wrapper**
- Wrap all Kite API calls with error handling
- Implement token refresh mechanism
- Add request rate limiting to respect API limits
- Create WebSocket connection manager for real-time data

**Step 2.3: Build Auth UI**
- Login page with "Connect to Zerodha" button
- Token storage in localStorage (frontend)
- Secure token storage in database (backend)
- Protected route wrapper component

### Phase 3: Watchlist Management (Week 2)

**Reference: PRD Section 6.1 (FR1)**

**Step 3.1: Database & API**
- Create Watchlist model
- Implement CRUD endpoints:
  - POST /api/watchlist - Add stock
  - GET /api/watchlist - Get all stocks
  - PUT /api/watchlist/:id - Update stock
  - DELETE /api/watchlist/:id - Remove stock
  - GET /api/watchlist/categories - Get all categories
  - POST /api/watchlist/categories - Create category

**Step 3.2: Frontend Components**
- WatchlistPage component
- StockSearchInput (with autocomplete using Kite instruments)
- CategoryManager component
- StockCard component (shows current price, change%)
- Drag-and-drop reordering functionality

**Step 3.3: Real-time Price Updates**
- Subscribe to WebSocket for watchlist stocks
- Update prices every second during market hours
- Show green/red indicators for price changes

### Phase 4: Technical Analysis & Recommendations (Week 2-3)

**Reference: PRD Section 6.2 (FR2)**

**Step 4.1: Technical Indicators Service**
```javascript
// Backend: /services/technicalAnalysis.js

class TechnicalAnalysisService {
  async calculateIndicators(symbol, interval = 'day') {
    // Fetch historical data from Kite API
    // Calculate: RSI, MACD, Moving Averages, Bollinger Bands
    // Return all indicators
  }
  
  async getRecommendation(symbol) {
    // Get all indicators
    // Apply trading strategy rules
    // Return: { signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL', 
    //           score: 85, reasons: [...], indicators: {...} }
  }
}
```

**Step 4.2: Recommendation Engine**
- Implement scoring algorithm:
  - RSI: Oversold (<30) = Bullish, Overbought (>70) = Bearish
  - MACD: Crossover above signal = Bullish
  - Moving Averages: Price > MA = Bullish
  - Volume: Above average = Strong signal
  - Bollinger Bands: Near lower band = Bullish

**Step 4.3: UI Components**
- RecommendationCard showing signal with color coding
- TechnicalIndicatorsPanel with all indicator values
- SignalBadge component (Strong Buy, Buy, Hold, etc.)
- Auto-refresh recommendations every 15 minutes

### Phase 5: Order Execution (Week 3)

**Reference: PRD Section 6.3 (FR3)**

**Step 5.1: Order Placement API**
```javascript
// Backend: /routes/trading.js
// POST /api/orders/place
{
  symbol: 'RELIANCE',
  quantity: 10,
  orderType: 'MARKET' | 'LIMIT',
  limitPrice?: 2500.00,
  transactionType: 'BUY' | 'SELL'
}
```

**Step 5.2: Order Flow**
1. Validate user has sufficient margin (GET /margins from Kite)
2. Show order confirmation dialog with all charges
3. Place order via Kite API
4. Store transaction in database
5. Update holdings if order is executed
6. Show success/error notification

**Step 5.3: UI Components**
- OrderDialog component with stepper:
  - Step 1: Review stock details
  - Step 2: Enter quantity and order type
  - Step 3: Review charges and total
  - Step 4: Confirm order
- Real-time order status updates

### Phase 6: Manual Transaction Recording (Week 3-4)

**Reference: PRD Section 6.6 (FR6) - Manual Recording**

**Step 6.1: Manual Entry API**
```javascript
// POST /api/transactions/manual
{
  transactionType: 'BUY' | 'SELL',
  symbol: 'TCS',
  companyName: 'Tata Consultancy Services',
  quantity: 5,
  pricePerShare: 3500.00,
  date: '2025-11-15T10:30:00Z',
  charges: {
    brokerage: 20.00,
    exchangeCharges: 5.00,
    gst: 4.50,
    sebiCharges: 0.10,
    stampDuty: 5.00
  },
  orderIdRef?: 'OPTIONAL_KITE_ORDER_ID'
}
```

**Step 6.2: UI Components**
- Floating Action Button (FAB) on all pages
- ManualTransactionDialog with form:
  - Transaction type selector (Buy/Sell)
  - Stock symbol autocomplete
  - Date-time picker
  - Quantity input
  - Price per share input
  - Expandable charges section
  - Auto-calculate total
- Transaction source badge (App-Executed / Manually Recorded)

**Step 6.3: Data Flow**
- On manual buy: Create transaction → Update holdings
- On manual sell: Create transaction → Reduce holdings → Calculate P&L
- Validate: Can't sell more than available quantity
- FIFO matching for P&L calculation

### Phase 7: Exit Strategy & Alerts (Week 4)

**Reference: PRD Section 6.4 (FR4) & 6.5 (FR5)**

**Step 7.1: Exit Strategy Management**
```javascript
// POST /api/holdings/:id/exit-strategy
{
  profitTargetPercent: 10,  // 10% profit target
  stopLossPercent: 3         // 3% stop loss
}
```

**Step 7.2: Alert Monitoring Service**
```javascript
// Backend: Background service
class AlertMonitorService {
  async checkAlerts() {
    // Every 30 seconds during market hours:
    // 1. Fetch all holdings with exit strategies
    // 2. Get current prices via WebSocket
    // 3. Check if profit target or stop loss hit
    // 4. Trigger notification if condition met
  }
}
```

**Step 7.3: Notification System**
- Browser Push Notifications (Web Push API)
- In-app notification center
- Alert types: Profit Target Reached, Stop Loss Hit
- Sound + visual alert

**Step 7.4: Sell Order Flow**
- Quick sell button from alert notification
- Pre-filled sell order dialog
- Show projected P&L before confirmation

### Phase 8: Transaction Tracking & P&L (Week 4-5)

**Reference: PRD Section 6.6 (FR6)**

**Step 8.1: P&L Calculation Logic**
```javascript
// FIFO Matching Algorithm
function calculatePnL(stockSymbol, userId) {
  // 1. Get all buy transactions (sorted by date)
  // 2. Get all sell transactions (sorted by date)
  // 3. Match sells with buys using FIFO
  // 4. Calculate P&L for each matched pair:
  //    P&L = (SellPrice * Qty - SellCharges) - (BuyPrice * Qty + BuyCharges)
  // 5. Return total P&L and trade details
}
```

**Step 8.2: Transaction List API**
```javascript
// GET /api/transactions?
//   startDate=2025-01-01&
//   endDate=2025-11-17&
//   type=BUY|SELL|ALL&
//   symbol=RELIANCE&
//   source=APP_EXECUTED|MANUAL|ALL
```

**Step 8.3: UI Components**
- TransactionsList with filters
- Stock-wise P&L summary cards
- Trade detail expansion panel
- Color-coded profit/loss indicators

### Phase 9: Dashboard & Portfolio Analytics (Week 5)

**Reference: PRD Section 6.7 (FR7)**

**Step 9.1: Dashboard Metrics API**
```javascript
// GET /api/dashboard/metrics
{
  totalInvested: 500000,
  currentPortfolioValue: 520000,
  realizedPnL: 15000,
  unrealizedPnL: 5000,
  totalPnL: 20000,
  returnPercent: 4.0,
  totalTrades: 25,
  winRate: 68.0,
  avgProfitPerTrade: 800,
  largestGain: 5000,
  largestLoss: -1200,
  topPerformers: [...],
  worstPerformers: [...]
}
```

**Step 9.2: Chart Components**
- P&L Trend Line Chart (Recharts)
- Sector Allocation Pie Chart
- Win/Loss Ratio Bar Chart
- Portfolio Value Over Time

**Step 9.3: Real-time Updates**
- WebSocket updates for live portfolio value
- Auto-refresh every minute during market hours
- Animated counters for metrics

### Phase 10: Holdings Management (Week 5-6)

**Reference: PRD Section 6.8 (FR8)**

**Step 10.1: Holdings Calculation**
```javascript
// Calculate holdings from transactions
function calculateHoldings(userId) {
  // 1. Get all buy transactions
  // 2. Get all sell transactions
  // 3. Group by stock symbol
  // 4. Calculate: quantity = totalBuys - totalSells
  // 5. Calculate: avgBuyPrice = totalInvested / quantity
  // 6. Get current price
  // 7. Calculate unrealized P&L
}
```

**Step 10.2: Holdings Page**
- Info banner: "Holdings shown here include only trades made through this app or manually recorded..."
- Holdings table/cards with:
  - Stock name + symbol
  - Quantity held
  - Avg buy price vs Current price
  - Unrealized P&L (₹ and %)
  - Day's change
  - Exit strategy indicators
  - Quick action buttons (Sell, Edit Exit Strategy)

**Step 10.3: Drill-down View**
- Click holding → Show all related transactions
- Complete buy-sell history
- Transaction source indicators

### Phase 11: Reports & Export (Week 6)

**Reference: PRD Section 6.9 (FR9)**

**Step 11.1: Excel Export Service**
```javascript
// Backend: /services/reportService.js
const ExcelJS = require('exceljs');

async function generateTransactionReport(filters) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');
  
  // Add headers, data, formatting
  // Include: Date, Symbol, Type, Quantity, Price, Charges, P&L, Source
  // Add summary sheet with aggregated stats
  
  return workbook.xlsx.writeBuffer();
}
```

**Step 11.2: Report Generation UI**
- ReportsPage with filter form
- Date range picker
- Transaction type selector
- Stock symbol filter
- Category filter
- Generate button → Download Excel

**Step 11.3: Report Structure**
- Sheet 1: Detailed Transactions
- Sheet 2: Summary Statistics
- Sheet 3: Stock-wise P&L
- Proper formatting, borders, colors

### Phase 12: PWA Features & Optimization (Week 6-7)

**Step 12.1: Service Worker Implementation**
```javascript
// Cache strategies:
// - Cache First: Static assets (JS, CSS, images)
// - Network First: API calls (with fallback to cache)
// - Stale While Revalidate: Stock data
```

**Step 12.2: Offline Functionality**
- Cache last known prices
- Show "Offline Mode" banner
- Queue transactions for when online
- Background sync for pending actions

**Step 12.3: Performance Optimization**
- Code splitting by route
- Lazy loading components
- Image optimization
- Bundle size optimization
- Lighthouse score > 90

**Step 12.4: Responsive Design**
- Mobile-first approach
- Breakpoints: 320px, 768px, 1024px, 1440px
- Touch-friendly buttons (min 44px)
- Bottom navigation for mobile
- Sidebar navigation for desktop

### Phase 13: Testing & Quality Assurance (Week 7)

**Step 13.1: Unit Tests**
- Test utility functions (P&L calculations, formatters)
- Test Redux/Zustand store actions
- Test API service methods

**Step 13.2: Integration Tests**
- Test complete user flows
- Test order placement flow
- Test manual transaction entry
- Test P&L calculations with various scenarios

**Step 13.3: E2E Testing**
- Use Playwright or Cypress
- Test critical user journeys
- Test PWA installation
- Test offline functionality

### Phase 14: Security & Deployment (Week 7-8)

**Step 14.1: Security Hardening**
- Implement rate limiting
- Add request validation (express-validator)
- Sanitize user inputs
- CORS configuration
- Helmet.js for security headers
- Environment variable protection

**Step 14.2: Deployment Preparation**
- Create production build
- Setup environment variables
- Database migration scripts
- SSL/TLS certificates
- HTTPS enforcement

**Step 14.3: Deployment Options**
- Frontend: Vercel, Netlify, or Cloudflare Pages
- Backend: Railway, Render, or DigitalOcean
- Database: PostgreSQL on cloud provider

## Critical Implementation Notes

### 1. Transaction Source Tracking
Every transaction must have a `source` field:
- `APP_EXECUTED`: Order placed through Kite API via this app
- `MANUALLY_RECORDED`: User manually entered this transaction

### 2. P&L Calculation Rules
- Use FIFO (First In First Out) for matching buy-sell pairs
- Include ALL charges in calculations:
  ```
  Buy Cost = (Price × Quantity) + Brokerage + Exchange + GST + SEBI + Stamp Duty
  Sell Proceeds = (Price × Quantity) - Brokerage - Exchange - GST - SEBI - Stamp Duty
  P&L = Sell Proceeds - Buy Cost
  ```

### 3. Holding Calculation
```javascript
// For each stock:
Quantity = Sum(BuyQuantities) - Sum(SellQuantities)
AvgBuyPrice = TotalBuyValue / TotalBuyQuantity
UnrealizedPnL = (CurrentPrice × Quantity) - (AvgBuyPrice × Quantity)
```

### 4. Market Hours
- NSE/BSE Trading Hours: 9:15 AM - 3:30 PM IST
- Pre-market: 9:00 AM - 9:15 AM
- Post-market: 3:40 PM - 4:00 PM
- Only update live prices during these hours

### 5. Rate Limiting
Kite Connect API has strict rate limits:
- Order placement: 10 requests per second
- Quote fetch: 10 requests per second
- Historical data: 3 requests per second
- Implement exponential backoff for failures

### 6. WebSocket Management
```javascript
// Subscribe to live prices
kiteWebSocket.subscribe([
  { exchange: 'NSE', token: 738561 }  // RELIANCE
]);

// Handle ticks
kiteWebSocket.on('ticks', (ticks) => {
  // Update store with new prices
  // Trigger alert checks
});
```

### 7. Error Handling
Always handle these scenarios:
- Kite API down / timeout
- Invalid token (redirect to login)
- Insufficient margin
- Market closed
- Network errors
- Invalid user input

### 8. Data Validation
Before saving transactions:
- ✅ Valid stock symbol (check against Kite instruments)
- ✅ Quantity > 0
- ✅ Price > 0
- ✅ Date not in future
- ✅ All charges >= 0
- ✅ For sells: quantity <= available holding quantity

## Coding Standards

### TypeScript
```typescript
// Use strict type checking
// Define interfaces for all data structures
interface Transaction {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerShare: number;
  charges: TransactionCharges;
  totalValue: number;
  source: 'APP_EXECUTED' | 'MANUALLY_RECORDED';
  timestamp: Date;
  orderIdRef?: string;
}
```

### Naming Conventions
- Components: PascalCase (e.g., `WatchlistPage.tsx`)
- Files: camelCase (e.g., `tradingService.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Functions: camelCase (e.g., `calculatePnL()`)

### Component Structure
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component definition
// 4. Styled components (if using styled-components)
// 5. Export

import React, { useState, useEffect } from 'react';

interface Props {
  symbol: string;
  onBuy: (quantity: number) => void;
}

export const StockCard: React.FC<Props> = ({ symbol, onBuy }) => {
  // Component logic
  return (
    // JSX
  );
};
```

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Transaction recorded successfully",
  "timestamp": "2025-11-17T12:00:00Z"
}

// Error response
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_MARGIN",
    "message": "Insufficient funds to place order",
    "details": { ... }
  }
}
```

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_KITE_API_KEY=your_kite_api_key
```

### Backend (.env)
```
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/trading_db

# Kite Connect
KITE_API_KEY=your_api_key
KITE_API_SECRET=your_api_secret
KITE_REDIRECT_URL=http://localhost:3000/auth/callback

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing Approach

### Test Data
Create test scenarios with:
1. Multiple buy transactions at different prices
2. Partial sells
3. Complete position closure
4. Manual transactions
5. Different stocks in watchlist
6. Various technical indicator scenarios

### Test Cases Priority
1. ✅ Authentication flow
2. ✅ Order placement (buy/sell)
3. ✅ Manual transaction recording
4. ✅ P&L calculation accuracy
5. ✅ Holdings calculation
6. ✅ Exit strategy alerts
7. ✅ Real-time price updates
8. ✅ Report generation

## Common Pitfalls to Avoid

1. **DON'T** fetch all Kite holdings - only show app-tracked holdings
2. **DON'T** forget to include all charges in P&L calculations
3. **DON'T** allow selling more quantity than available
4. **DON'T** poll Kite API continuously - use WebSocket
5. **DON'T** store Kite API secret on frontend
6. **DON'T** forget to show "app-only tracking" warnings
7. **DON'T** make API calls during non-market hours unnecessarily
8. **DON'T** forget to implement token refresh

## Development Tips

1. **Start with MVP**: Build core features first (auth, watchlist, basic orders)
2. **Use Mock Data**: Create mock Kite API responses for development
3. **Incremental Development**: Test each feature thoroughly before moving to next
4. **Mobile First**: Design for mobile, then scale up
5. **Performance**: Monitor bundle size and API call frequency
6. **User Feedback**: Show loading states, error messages, success confirmations

## Kite Connect API Quick Reference

```javascript
// Authentication
GET https://kite.zerodha.com/connect/login?api_key={api_key}

// Get user profile
GET /user/profile

// Get instruments list
GET /instruments

// Get quote
GET /quote?i={instrument1}&i={instrument2}

// Historical data
GET /instruments/historical/{instrument_token}/{interval}
// interval: minute, day, 3minute, 5minute, 10minute, 15minute, 30minute, 60minute

// Place order
POST /orders/regular
{
  "tradingsymbol": "INFY",
  "exchange": "NSE",
  "transaction_type": "BUY",
  "quantity": 1,
  "order_type": "MARKET",
  "product": "CNC",
  "validity": "DAY"
}

// Get orders
GET /orders

// Get positions
GET /positions

// Get margins
GET /margins/{segment}
// segment: equity, commodity
```

## Debugging Tips

1. **Kite API Issues**: Check API status at https://kite.trade/status
2. **WebSocket**: Monitor WebSocket messages in browser DevTools
3. **P&L Calculation**: Log intermediate values to verify FIFO logic
4. **Rate Limits**: Implement request logging to track API usage
5. **State Management**: Use Redux DevTools for debugging state

## Resources

- **Kite Connect Docs**: https://kite.trade/docs/connect/v3/
- **Technical Indicators**: https://github.com/anandanand84/technicalindicators
- **React PWA**: https://create-react-app.dev/docs/making-a-progressive-web-app/
- **Material-UI**: https://mui.com/
- **Redux Toolkit**: https://redux-toolkit.js.org/

## Support & Questions

If you encounter issues or need clarification:
1. Refer to the PRD for functional requirements
2. Check Kite Connect API documentation
3. Review this CLAUDE.md for implementation guidance
4. Test with small datasets first
5. Ask specific questions with context

---

## Getting Started Checklist

- [ ] Read the complete PRD document
- [ ] Set up Kite Connect API credentials
- [ ] Initialize project structure (frontend + backend)
- [ ] Install dependencies
- [ ] Create database schema
- [ ] Implement authentication flow
- [ ] Test Kite API connection
- [ ] Build Phase 1: Watchlist
- [ ] Build Phase 2: Technical Analysis
- [ ] Build Phase 3: Order Execution
- [ ] Build Phase 4: Manual Recording
- [ ] Build Phase 5: Holdings & P&L
- [ ] Build Phase 6: Dashboard
- [ ] Build Phase 7: Reports
- [ ] Implement PWA features
- [ ] Testing and optimization
- [ ] Deployment

**Remember**: Build incrementally, test thoroughly, and refer back to the PRD for complete functional specifications. Good luck!

---

## Optional: AI Features Enhancement

This application can be significantly enhanced with AI capabilities using OpenAI or OpenRouter APIs. See **AI_INTEGRATION_GUIDE.md** for complete implementation details.

### Recommended AI Features:

1. **🤖 Conversational Trading Assistant** - Natural language queries like "Should I buy Reliance?"
2. **📰 News Sentiment Analysis** - AI-powered sentiment for watchlist stocks
3. **🎯 Enhanced Recommendations** - Combine technical indicators with AI context
4. **📊 Trade Journal Analysis** - Pattern recognition in your trading history
5. **📝 Automated Reports** - AI-generated monthly performance reports

### Quick Start with AI:

```bash
# Install AI dependencies
npm install openai axios

# Add to .env
OPENAI_API_KEY=sk-...
# OR
OPENROUTER_API_KEY=sk-or-v1-...

# See AI_INTEGRATION_GUIDE.md for complete implementation
```

**Cost**: ~$300-500/month for 100 active users (with optimization)

**Development Time**: Additional 2-3 weeks after core features

**Priority**: Implement after core trading functionality is stable (Phase 13+)

---
