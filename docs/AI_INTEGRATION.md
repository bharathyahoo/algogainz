## AlgoGainz - AI Integration Guide

**Complete guide for implementing and using AI-powered features**

---

## Table of Contents

1. [Overview](#overview)
2. [AI Features](#ai-features)
3. [Setup & Configuration](#setup--configuration)
4. [API Documentation](#api-documentation)
5. [Frontend Components](#frontend-components)
6. [Cost Estimation](#cost-estimation)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

AlgoGainz integrates advanced AI capabilities to provide intelligent trading insights, sentiment analysis, and personalized recommendations. The AI features are powered by OpenAI or OpenRouter APIs and are designed to enhance decision-making while maintaining transparency about AI limitations.

### Key Principles

- **Data-Driven**: All AI recommendations based on technical indicators and market data
- **Transparent**: Clear disclaimers that AI is not financial advice
- **Configurable**: Feature flags to enable/disable specific AI capabilities
- **Cost-Conscious**: Token usage tracking and rate limiting

---

## AI Features

### 1. 🤖 Conversational Trading Assistant

**Description**: Chat-based interface for asking trading-related questions

**Use Cases**:
- "Should I buy RELIANCE today?"
- "Explain RSI indicator in simple terms"
- "What are good entry points for TCS?"
- General trading education and strategy discussions

**Implementation**:
- Backend: `POST /api/ai/ask`
- Frontend: `AIAssistant` component
- Floating action button for easy access

---

### 2. 📰 News Sentiment Analysis

**Description**: AI-powered sentiment analysis from news headlines

**Use Cases**:
- Understand market sentiment for watchlist stocks
- Identify trending themes and topics
- Assess news impact on stock prices

**Implementation**:
- Backend: `POST /api/ai/sentiment`
- Frontend: `AIStockInsights` component (sentiment section)
- Returns sentiment (Positive/Neutral/Negative), score, themes, and impact

---

### 3. 🎯 Enhanced Stock Recommendations

**Description**: AI analysis combining technical indicators with contextual insights

**Use Cases**:
- Comprehensive stock analysis beyond basic indicators
- Identify support/resistance levels
- Get entry/exit point suggestions
- Risk assessment

**Implementation**:
- Backend: `POST /api/ai/analyze-stock`
- Frontend: `AIStockInsights` component
- Integrates with technical analysis service

---

### 4. 💼 Portfolio Review

**Description**: AI-powered portfolio health assessment

**Use Cases**:
- Diversification analysis
- Risk exposure evaluation
- Actionable portfolio recommendations
- Performance assessment

**Implementation**:
- Backend: `POST /api/ai/portfolio-review`
- Frontend: `AIPortfolioReview` component
- Dashboard integration

---

### 5. 📊 Trade Journal Analysis

**Description**: Pattern recognition and behavioral analysis from trading history

**Use Cases**:
- Identify winning vs losing trade patterns
- Detect behavioral biases
- Improve trading discipline
- Personalized suggestions for improvement

**Implementation**:
- Backend: `POST /api/ai/analyze-journal`
- Frontend: `AITradeJournalAnalysis` component
- Requires minimum 10 transactions for meaningful insights

---

### 6. 📝 Automated Performance Reports

**Description**: AI-generated monthly/quarterly performance reports

**Use Cases**:
- Comprehensive performance analysis
- Strengths and weaknesses identification
- Risk management assessment
- Actionable recommendations

**Implementation**:
- Backend: `POST /api/ai/performance-report`
- Frontend: Integration in Reports page
- Exportable as PDF/Excel with AI insights

---

## Setup & Configuration

### Prerequisites

1. **AI API Key**: Obtain from OpenAI or OpenRouter
   - OpenAI: https://platform.openai.com/api-keys
   - OpenRouter: https://openrouter.ai/keys

2. **Node.js Dependencies**: Already included in package.json
   ```bash
   cd backend
   npm install axios
   ```

### Environment Configuration

#### Backend `.env`

```bash
# AI Provider: openai or openrouter
AI_PROVIDER=openai

# API Key
OPENAI_API_KEY=sk-your-openai-api-key-here
# OR for OpenRouter
# AI_API_KEY=sk-or-v1-your-openrouter-key-here

# Model Selection
AI_MODEL=gpt-4-turbo-preview
# Options:
#   OpenAI: gpt-4-turbo-preview, gpt-3.5-turbo
#   OpenRouter: openai/gpt-4-turbo-preview, anthropic/claude-3-opus, anthropic/claude-3-sonnet

# AI Configuration
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Feature Flags (set to 'false' to disable)
AI_FEATURE_ASSISTANT=true
AI_FEATURE_SENTIMENT=true
AI_FEATURE_RECOMMENDATIONS=true
AI_FEATURE_JOURNAL=true
AI_FEATURE_REPORTS=true

# Rate Limiting
AI_RATE_LIMIT_RPM=20      # Requests per minute
AI_RATE_LIMIT_RPD=1000    # Requests per day
AI_RATE_LIMIT_TPM=100000  # Tokens per minute

# App URL (for OpenRouter)
APP_URL=https://algogainz.com
```

### Quick Start

1. **Add API Key to `.env`**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

2. **Start Backend**:
   ```bash
   npm run dev
   ```

3. **Verify AI Status**:
   ```bash
   curl http://localhost:3000/api/ai/status
   ```

4. **Test Conversational Assistant**:
   ```bash
   curl -X POST http://localhost:3000/api/ai/ask \
     -H "Content-Type: application/json" \
     -d '{"question":"What is RSI indicator?"}'
   ```

---

## API Documentation

### Base URL

```
http://localhost:3000/api/ai
```

### Endpoints

#### 1. Check AI Status

```http
GET /api/ai/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "features": {
      "conversationalAssistant": true,
      "sentimentAnalysis": true,
      "enhancedRecommendations": true,
      "tradeJournalAnalysis": true,
      "automatedReports": true
    }
  }
}
```

---

#### 2. Ask Assistant

```http
POST /api/ai/ask
```

**Request Body**:
```json
{
  "question": "Should I buy RELIANCE today?",
  "context": {
    "currentPrice": 2500,
    "userHoldings": []
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "question": "Should I buy RELIANCE today?",
    "answer": "Based on current technical indicators...",
    "timestamp": "2025-11-19T12:00:00Z"
  }
}
```

---

#### 3. Analyze Stock

```http
POST /api/ai/analyze-stock
```

**Request Body**:
```json
{
  "symbol": "RELIANCE",
  "indicators": {
    "rsi": 65.2,
    "macd": {
      "value": 12.5,
      "signal": 10.2
    },
    "movingAverages": {
      "sma50": 2450,
      "sma200": 2300
    }
  },
  "marketData": {
    "currentPrice": 2500,
    "dayChange": 1.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "symbol": "RELIANCE",
    "analysis": "RELIANCE shows bullish momentum with RSI at 65.2...",
    "timestamp": "2025-11-19T12:00:00Z"
  }
}
```

---

#### 4. Sentiment Analysis

```http
POST /api/ai/sentiment
```

**Request Body**:
```json
{
  "symbol": "TCS",
  "newsArticles": [
    "TCS announces strong Q3 results, beats estimates",
    "TCS wins major deal with Fortune 500 company",
    "Tech sector faces headwinds amid global slowdown"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "symbol": "TCS",
    "sentiment": {
      "sentiment": "Positive",
      "score": 0.75,
      "themes": ["Strong earnings", "New contracts", "Sector concerns"],
      "impact": "Overall positive sentiment despite broader tech sector concerns"
    },
    "timestamp": "2025-11-19T12:00:00Z"
  }
}
```

---

#### 5. Portfolio Review

```http
POST /api/ai/portfolio-review
```

**Request Body**:
```json
{
  "holdings": [
    {
      "symbol": "RELIANCE",
      "quantity": 10,
      "avgBuyPrice": 2400,
      "currentPrice": 2500
    },
    {
      "symbol": "TCS",
      "quantity": 5,
      "avgBuyPrice": 3500,
      "currentPrice": 3600
    }
  ],
  "totalPnL": 1500,
  "context": {
    "totalInvested": 41500,
    "currentValue": 43000
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "review": "Your portfolio shows healthy diversification...",
    "timestamp": "2025-11-19T12:00:00Z"
  }
}
```

---

#### 6. Trade Advice

```http
POST /api/ai/trade-advice
```

**Request Body**:
```json
{
  "symbol": "INFY",
  "action": "BUY",
  "context": {
    "currentPrice": 1500,
    "quantity": 10,
    "technicalIndicators": {
      "rsi": 45,
      "macd": "bullish crossover"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "symbol": "INFY",
    "action": "BUY",
    "advice": "Based on RSI of 45 and bullish MACD crossover...",
    "timestamp": "2025-11-19T12:00:00Z"
  }
}
```

---

#### 7. Analyze Trade Journal

```http
POST /api/ai/analyze-journal
```

**Request Body**:
```json
{
  "transactions": [
    {
      "symbol": "RELIANCE",
      "type": "BUY",
      "quantity": 10,
      "price": 2400,
      "timestamp": "2025-10-15T10:00:00Z"
    },
    // ... more transactions
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "analysis": "Your trading patterns show...",
    "transactionsAnalyzed": 25,
    "timestamp": "2025-11-19T12:00:00Z"
  }
}
```

---

#### 8. Performance Report

```http
POST /api/ai/performance-report
```

**Request Body**:
```json
{
  "metrics": {
    "totalTrades": 50,
    "winRate": 68,
    "avgProfit": 800,
    "totalPnL": 15000,
    "returnPercent": 12.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "report": "Performance Analysis Report...",
    "timestamp": "2025-11-19T12:00:00Z"
  }
}
```

---

## Frontend Components

### 1. AIAssistant

**Import**:
```typescript
import { AIAssistant, AIAssistantFAB } from '@/components/ai/AIAssistant';
```

**Usage**:
```tsx
// Floating Action Button (recommended)
<AIAssistantFAB />

// Or controlled drawer
const [open, setOpen] = useState(false);
<AIAssistant open={open} onClose={() => setOpen(false)} />
```

**Features**:
- Chat-style interface
- Suggested questions
- Message history
- Loading states
- Error handling

---

### 2. AIStockInsights

**Import**:
```typescript
import AIStockInsights from '@/components/ai/AIStockInsights';
```

**Usage**:
```tsx
<AIStockInsights
  symbol="RELIANCE"
  technicalIndicators={{
    rsi: 65.2,
    macd: { value: 12.5, signal: 10.2 },
  }}
  newsHeadlines={[
    "RELIANCE announces Q3 results",
    "Oil prices surge amid global tensions"
  ]}
  compact={false}
/>
```

**Props**:
- `symbol`: Stock symbol (required)
- `technicalIndicators`: Object with technical indicators (required)
- `newsHeadlines`: Array of news headlines (optional)
- `compact`: Collapsible mode (optional, default: false)

---

### 3. AIPortfolioReview

**Import**:
```typescript
import AIPortfolioReview from '@/components/ai/AIPortfolioReview';
```

**Usage**:
```tsx
<AIPortfolioReview
  holdings={userHoldings}
  totalPnL={15000}
  totalInvested={100000}
  currentValue={115000}
/>
```

---

### 4. AITradeJournalAnalysis

**Import**:
```typescript
import AITradeJournalAnalysis from '@/components/ai/AITradeJournalAnalysis';
```

**Usage**:
```tsx
<AITradeJournalAnalysis
  transactions={userTransactions}
/>
```

---

## Cost Estimation

### Token Usage

Average token usage per request:

| Feature | Input Tokens | Output Tokens | Total |
|---------|-------------|---------------|-------|
| Ask Assistant | 200-500 | 300-500 | 500-1000 |
| Stock Analysis | 300-600 | 300-400 | 600-1000 |
| Sentiment Analysis | 200-400 | 200-300 | 400-700 |
| Portfolio Review | 400-800 | 400-500 | 800-1300 |
| Trade Advice | 250-500 | 250-350 | 500-850 |
| Trade Journal | 500-1500 | 500-600 | 1000-2100 |
| Performance Report | 400-800 | 600-800 | 1000-1600 |

### Pricing (as of 2025)

**OpenAI GPT-4 Turbo**:
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens

**OpenAI GPT-3.5 Turbo** (cheaper alternative):
- Input: $0.0005 / 1K tokens
- Output: $0.0015 / 1K tokens

**OpenRouter Claude 3 Sonnet** (alternative):
- Input: $0.003 / 1K tokens
- Output: $0.015 / 1K tokens

### Monthly Cost Estimate

**Scenario: 100 Active Users**

Assumptions:
- 5 AI requests per user per day
- 500 tokens average per request
- Using GPT-4 Turbo

**Calculation**:
```
100 users × 5 requests/day × 30 days = 15,000 requests/month
15,000 requests × 500 tokens = 7,500,000 tokens/month
7,500,000 tokens ÷ 1,000 × $0.02 (avg) = $150/month
```

**Cost Range**: $150-$500/month for 100 active users

**Optimization Tips**:
1. Use GPT-3.5 for simple queries (10x cheaper)
2. Implement caching for repeated questions
3. Set shorter `max_tokens` limits
4. Use feature flags to disable less-used features
5. Implement user quotas (e.g., 20 AI requests/day per user)

---

## Best Practices

### 1. API Key Security

```bash
# ✅ Good: Use environment variables
OPENAI_API_KEY=sk-your-key

# ❌ Bad: Hardcode in source code
const apiKey = "sk-your-key";
```

### 2. Error Handling

```typescript
try {
  const answer = await aiService.ask(question);
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
    showNotification('AI service is busy. Please try again.');
  } else if (error.response?.status === 503) {
    // Service unavailable
    showNotification('AI features temporarily unavailable.');
  } else {
    showNotification('Failed to get AI response.');
  }
}
```

### 3. User Disclaimers

Always display clear disclaimers:

```tsx
<Typography variant="caption" color="text.secondary">
  AI-generated insights. Not financial advice. Trade at your own risk.
</Typography>
```

### 4. Token Usage Monitoring

Log token usage for monitoring:

```typescript
// Backend
console.log(`[AI] Usage - Tokens: ${usage.totalTokens}, Cost: $${usage.estimatedCost.toFixed(4)}`);

// Track monthly costs in database
await prisma.aiUsage.create({
  data: {
    userId,
    feature: 'stock_analysis',
    tokens: usage.totalTokens,
    cost: usage.estimatedCost,
  },
});
```

### 5. Rate Limiting

Implement user-level rate limiting:

```typescript
// Backend middleware
const aiUserRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI requests per hour per user
  keyGenerator: (req) => req.user.id,
});

app.use('/api/ai/', aiUserRateLimiter);
```

---

## Troubleshooting

### Problem: AI service returns 503

**Symptoms**: `AI service is not configured` error

**Solutions**:
- Check if `OPENAI_API_KEY` or `AI_API_KEY` is set in `.env`
- Verify API key is valid (test at https://platform.openai.com/)
- Restart backend server after adding API key

---

### Problem: Rate limit exceeded (429)

**Symptoms**: Too many requests error

**Solutions**:
- Check OpenAI dashboard for rate limits
- Implement request queuing
- Upgrade OpenAI plan for higher limits
- Switch to OpenRouter for distributed rate limits

---

### Problem: High costs

**Symptoms**: Unexpected high API costs

**Solutions**:
- Switch to GPT-3.5 Turbo (10x cheaper)
- Reduce `AI_MAX_TOKENS` from 2000 to 1000
- Implement response caching
- Set user quotas (max requests per day)
- Disable less-used AI features

---

### Problem: Slow response times

**Symptoms**: AI requests take >10 seconds

**Solutions**:
- Reduce `max_tokens` to 500-1000
- Use streaming responses (future enhancement)
- Implement timeout handling
- Show loading indicators

---

## Advanced Features (Future)

### Planned Enhancements

1. **Response Streaming**: Real-time AI responses using SSE
2. **Multi-Language Support**: AI responses in Hindi, Tamil, etc.
3. **Voice Assistant**: Speech-to-text for queries
4. **Custom Training**: Fine-tuned models on user's trading data
5. **Backtesting Integration**: AI-suggested strategies with backtest results

---

## Resources

- **OpenAI Documentation**: https://platform.openai.com/docs
- **OpenRouter Documentation**: https://openrouter.ai/docs
- **OpenAI Pricing**: https://openai.com/pricing
- **OpenRouter Pricing**: https://openrouter.ai/models

---

**Last Updated**: November 19, 2025
**AI Integration Version**: 1.0
**Estimated Development Time**: 2-3 weeks
**Recommended Budget**: $300-500/month for 100 users
