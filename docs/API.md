# AlgoGainz API Documentation

Base URL: `http://localhost:3000/api`

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-11-18T12:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "timestamp": "2025-11-18T12:00:00Z"
}
```

## Authentication

### 1. Initiate Kite Login

**Endpoint**: `GET /auth/login`

**Description**: Redirects user to Zerodha Kite login page

**Response**: Redirect to Kite login URL

---

### 2. Handle Kite Callback

**Endpoint**: `GET /auth/callback`

**Description**: Handles callback from Kite after successful login

**Query Parameters**:
- `request_token` (string, required) - Token from Kite
- `status` (string) - Login status

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "user": {
      "id": "user_id",
      "kiteUserId": "XX1234"
    }
  }
}
```

---

### 3. Logout

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Watchlist Management

### 1. Get Watchlist

**Endpoint**: `GET /watchlist`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `category` (string, optional) - Filter by category

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "stockSymbol": "RELIANCE",
      "companyName": "Reliance Industries Ltd",
      "exchange": "NSE",
      "instrumentToken": "738561",
      "categories": ["Technology", "Large Cap"],
      "currentPrice": 2450.50,
      "dayChange": 25.30,
      "dayChangePct": 1.04,
      "createdAt": "2025-11-18T10:00:00Z"
    }
  ]
}
```

---

### 2. Add Stock to Watchlist

**Endpoint**: `POST /watchlist`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "stockSymbol": "RELIANCE",
  "companyName": "Reliance Industries Ltd",
  "exchange": "NSE",
  "instrumentToken": "738561",
  "categories": ["Large Cap"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "stockSymbol": "RELIANCE",
    "message": "Stock added to watchlist"
  }
}
```

---

### 3. Remove Stock from Watchlist

**Endpoint**: `DELETE /watchlist/:id`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Stock removed from watchlist"
}
```

---

### 4. Update Stock Categories

**Endpoint**: `PUT /watchlist/:id`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "categories": ["Technology", "High Momentum"]
}
```

---

## Technical Analysis

### 1. Get Stock Recommendation

**Endpoint**: `GET /analysis/recommendation/:symbol`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "symbol": "RELIANCE",
    "signal": "STRONG_BUY",
    "score": 85,
    "indicators": {
      "rsi": {
        "value": 45.5,
        "signal": "NEUTRAL",
        "description": "RSI at 45.5 indicates neutral momentum"
      },
      "macd": {
        "value": 12.3,
        "signal": "BULLISH",
        "description": "MACD crossed above signal line"
      },
      "movingAverages": {
        "sma50": 2400.0,
        "sma200": 2350.0,
        "signal": "BULLISH"
      }
    },
    "reasons": [
      "Price above 50-day SMA",
      "MACD shows bullish crossover",
      "Volume above average"
    ]
  }
}
```

---

### 2. Get Technical Indicators

**Endpoint**: `GET /analysis/indicators/:symbol`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `interval` (string, optional) - day, minute, 5minute, etc. Default: day

**Response**: Returns all calculated technical indicators

---

## Trading / Orders

### 1. Place Order

**Endpoint**: `POST /trading/orders`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "transactionType": "BUY",
  "quantity": 10,
  "orderType": "MARKET",
  "limitPrice": null,
  "product": "CNC"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "kite_order_id",
    "status": "COMPLETE",
    "transactionId": "uuid",
    "message": "Order placed successfully"
  }
}
```

---

### 2. Get Order Status

**Endpoint**: `GET /trading/orders/:orderId`

**Headers**: `Authorization: Bearer <token>`

**Response**: Order details from Kite API

---

## Transactions

### 1. Get All Transactions

**Endpoint**: `GET /transactions`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `startDate` (ISO date, optional)
- `endDate` (ISO date, optional)
- `type` (string, optional) - BUY, SELL, or ALL
- `symbol` (string, optional)
- `source` (string, optional) - APP_EXECUTED, MANUALLY_RECORDED, or ALL

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "stockSymbol": "RELIANCE",
      "companyName": "Reliance Industries Ltd",
      "type": "BUY",
      "quantity": 10,
      "pricePerShare": 2450.00,
      "grossAmount": 24500.00,
      "brokerage": 20.00,
      "exchangeCharges": 5.00,
      "gst": 4.50,
      "sebiCharges": 0.10,
      "stampDuty": 5.00,
      "totalCharges": 34.60,
      "netAmount": 24534.60,
      "source": "APP_EXECUTED",
      "timestamp": "2025-11-18T10:30:00Z"
    }
  ]
}
```

---

### 2. Record Manual Transaction

**Endpoint**: `POST /transactions/manual`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "transactionType": "BUY",
  "symbol": "TCS",
  "companyName": "Tata Consultancy Services",
  "quantity": 5,
  "pricePerShare": 3500.00,
  "date": "2025-11-15T10:30:00Z",
  "charges": {
    "brokerage": 20.00,
    "exchangeCharges": 5.00,
    "gst": 4.50,
    "sebiCharges": 0.10,
    "stampDuty": 5.00
  },
  "orderIdRef": "optional_kite_order_id"
}
```

---

### 3. Get Stock-wise P&L

**Endpoint**: `GET /transactions/pnl/:symbol`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "symbol": "RELIANCE",
    "totalBought": 20,
    "totalSold": 10,
    "remaining": 10,
    "totalInvested": 49000.00,
    "totalRealized": 25000.00,
    "realizedPnL": 500.00,
    "unrealizedPnL": 200.00,
    "totalPnL": 700.00
  }
}
```

---

## Holdings

### 1. Get All Holdings

**Endpoint**: `GET /holdings`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "stockSymbol": "RELIANCE",
      "companyName": "Reliance Industries Ltd",
      "quantity": 10,
      "avgBuyPrice": 2450.00,
      "totalInvested": 24500.00,
      "currentPrice": 2475.00,
      "currentValue": 24750.00,
      "unrealizedPnL": 250.00,
      "unrealizedPnLPct": 1.02,
      "dayChange": 25.00,
      "dayChangePct": 1.02,
      "exitStrategy": {
        "profitTargetPct": 10.0,
        "stopLossPct": 3.0,
        "alertEnabled": true
      }
    }
  ]
}
```

---

### 2. Set Exit Strategy

**Endpoint**: `POST /holdings/:id/exit-strategy`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "profitTargetPct": 10.0,
  "stopLossPct": 3.0,
  "alertEnabled": true
}
```

---

## Dashboard

### 1. Get Dashboard Metrics

**Endpoint**: `GET /dashboard/metrics`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalInvested": 500000.00,
    "currentPortfolioValue": 520000.00,
    "realizedPnL": 15000.00,
    "unrealizedPnL": 5000.00,
    "totalPnL": 20000.00,
    "returnPercent": 4.0,
    "totalTrades": 25,
    "winRate": 68.0,
    "avgProfitPerTrade": 800.00,
    "largestGain": 5000.00,
    "largestLoss": -1200.00,
    "topPerformers": [...],
    "worstPerformers": [...]
  }
}
```

---

## Reports

### 1. Generate Transaction Report

**Endpoint**: `POST /reports/transactions`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-11-18",
  "type": "ALL",
  "symbol": null,
  "category": null
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/downloads/report_20251118_123456.xlsx",
    "filename": "algogainz_transactions_20251118.xlsx"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token |
| `INVALID_TOKEN` | JWT token is invalid or expired |
| `INSUFFICIENT_MARGIN` | Not enough funds to place order |
| `MARKET_CLOSED` | Trading outside market hours |
| `INVALID_SYMBOL` | Stock symbol not found |
| `DUPLICATE_ENTRY` | Stock already in watchlist |
| `KITE_API_ERROR` | Error from Zerodha Kite API |
| `VALIDATION_ERROR` | Request body validation failed |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## Rate Limits

- **General APIs**: 100 requests per minute
- **Order Placement**: 10 requests per second
- **Quote/Price APIs**: 10 requests per second

---

## WebSocket Events

Connect to: `ws://localhost:3001`

### Client → Server Events

**Subscribe to prices**:
```json
{
  "event": "subscribe",
  "symbols": ["RELIANCE", "TCS", "INFY"]
}
```

### Server → Client Events

**Price update**:
```json
{
  "event": "price_update",
  "data": {
    "symbol": "RELIANCE",
    "price": 2450.50,
    "change": 25.30,
    "changePct": 1.04,
    "timestamp": "2025-11-18T12:00:00Z"
  }
}
```

**Alert triggered**:
```json
{
  "event": "alert",
  "data": {
    "type": "PROFIT_TARGET",
    "symbol": "RELIANCE",
    "currentPrice": 2695.00,
    "targetPrice": 2695.00,
    "message": "Profit target reached for RELIANCE"
  }
}
```

---

For implementation examples, see [CLAUDE.md](../CLAUDE.md)
