# AI Features - Quick Start Guide

**Get AI-powered features running in 5 minutes**

---

## Step 1: Get API Key

### Option A: OpenAI (Recommended)
1. Visit https://platform.openai.com/api-keys
2. Create new API key
3. Copy the key (starts with `sk-...`)

### Option B: OpenRouter (Alternative)
1. Visit https://openrouter.ai/keys
2. Create account and API key
3. Copy the key (starts with `sk-or-v1-...`)

---

## Step 2: Configure Backend

```bash
cd backend

# Add to .env file
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# OR for OpenRouter
echo "AI_PROVIDER=openrouter" >> .env
echo "AI_API_KEY=sk-or-v1-your-key-here" >> .env
```

---

## Step 3: Start Services

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

---

## Step 4: Test AI Features

### Test from Command Line

```bash
# Check AI status
curl http://localhost:3000/api/ai/status

# Ask a question
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is RSI indicator?"}'
```

### Test from Frontend

1. Open browser: http://localhost:5173
2. Look for AI assistant button (bottom-right corner)
3. Click to open chat interface
4. Ask: "Should I buy RELIANCE today?"

---

## Available AI Features

| Feature | Endpoint | Frontend Component |
|---------|----------|-------------------|
| 🤖 Conversational Assistant | `/api/ai/ask` | `AIAssistantFAB` |
| 📰 Sentiment Analysis | `/api/ai/sentiment` | `AIStockInsights` |
| 🎯 Stock Analysis | `/api/ai/analyze-stock` | `AIStockInsights` |
| 💼 Portfolio Review | `/api/ai/portfolio-review` | `AIPortfolioReview` |
| 📈 Trade Advice | `/api/ai/trade-advice` | - |
| 📊 Trade Journal | `/api/ai/analyze-journal` | `AITradeJournalAnalysis` |
| 📝 Performance Report | `/api/ai/performance-report` | - |

---

## Quick Configuration

### Minimal Configuration (.env)

```bash
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional (defaults shown)
AI_MODEL=gpt-4-turbo-preview
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

### Use Cheaper Model (GPT-3.5)

```bash
AI_MODEL=gpt-3.5-turbo  # 10x cheaper!
```

### Disable Specific Features

```bash
# Disable expensive features
AI_FEATURE_SENTIMENT=false
AI_FEATURE_JOURNAL=false
AI_FEATURE_REPORTS=false

# Keep only conversational assistant
AI_FEATURE_ASSISTANT=true
AI_FEATURE_RECOMMENDATIONS=true
```

---

## Cost Control

### Set Rate Limits

```bash
# Limit to 10 requests per minute
AI_RATE_LIMIT_RPM=10

# Limit to 500 requests per day
AI_RATE_LIMIT_RPD=500
```

### Monitor Usage

```bash
# Backend logs show token usage
[AI] Usage - Tokens: 850, Cost: $0.0204

# Check your OpenAI dashboard for detailed usage:
# https://platform.openai.com/usage
```

---

## Troubleshooting

### ❌ "AI service is not configured"

**Solution**: Add `OPENAI_API_KEY` to `.env` and restart backend

```bash
# Add key
echo "OPENAI_API_KEY=sk-..." >> backend/.env

# Restart
cd backend && npm run dev
```

---

### ❌ "Invalid API key"

**Solution**: Verify API key is correct

```bash
# Test API key manually
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key-here"
```

---

### ❌ "Rate limit exceeded"

**Solution**: Wait or upgrade OpenAI plan

- Free tier: 3 RPM (requests per minute)
- Tier 1: 500 RPM
- Tier 2: 5000 RPM

Upgrade at: https://platform.openai.com/account/billing

---

### ❌ High costs

**Solution**: Switch to GPT-3.5

```bash
# In .env
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=1000
```

**Expected savings**: 90% cost reduction

---

## Integration Examples

### Add to Dashboard

```tsx
import { AIPortfolioReview } from '@/components/ai/AIPortfolioReview';

function Dashboard() {
  return (
    <div>
      {/* ... other dashboard content ... */}

      <AIPortfolioReview
        holdings={userHoldings}
        totalPnL={totalPnL}
        totalInvested={totalInvested}
        currentValue={currentValue}
      />
    </div>
  );
}
```

### Add to Watchlist

```tsx
import AIStockInsights from '@/components/ai/AIStockInsights';

function WatchlistItem({ stock }) {
  return (
    <div>
      {/* ... stock card ... */}

      <AIStockInsights
        symbol={stock.symbol}
        technicalIndicators={stock.indicators}
        newsHeadlines={stock.news}
      />
    </div>
  );
}
```

### Add to App Layout

```tsx
import { AIAssistantFAB } from '@/components/ai/AIAssistant';

function App() {
  return (
    <div>
      {/* ... app content ... */}

      {/* AI Assistant floating button */}
      <AIAssistantFAB />
    </div>
  );
}
```

---

## Cost Estimates

### Conservative Usage (20 requests/user/month)

| Model | Cost per User/Month | 100 Users |
|-------|-------------------|-----------|
| GPT-4 Turbo | $0.50 | $50/month |
| GPT-3.5 Turbo | $0.05 | $5/month |

### Heavy Usage (100 requests/user/month)

| Model | Cost per User/Month | 100 Users |
|-------|-------------------|-----------|
| GPT-4 Turbo | $2.50 | $250/month |
| GPT-3.5 Turbo | $0.25 | $25/month |

**Recommendation**: Start with GPT-3.5, upgrade to GPT-4 selectively

---

## Next Steps

1. ✅ Get AI working (you are here!)
2. Test all AI features in the UI
3. Monitor usage and costs
4. Tune configuration based on usage patterns
5. Read full documentation: `docs/AI_INTEGRATION.md`

---

**Need Help?**
- Full documentation: [AI_INTEGRATION.md](./AI_INTEGRATION.md)
- OpenAI docs: https://platform.openai.com/docs
- OpenRouter docs: https://openrouter.ai/docs

---

**Last Updated**: November 19, 2025
