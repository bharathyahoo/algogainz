# AlgoGainz - AI Integration Guide
## OpenAI & OpenRouter Enhancement

This document outlines how to integrate AI models (OpenAI GPT-4, Claude via OpenRouter, etc.) into AlgoGainz to enhance user experience and provide intelligent insights.

---

## Table of Contents
1. [Why Add AI?](#why-add-ai)
2. [Technology Setup](#technology-setup)
3. [Feature Implementations](#feature-implementations)
4. [API Architecture](#api-architecture)
5. [Cost Optimization](#cost-optimization)
6. [Security Considerations](#security-considerations)

---

## Why Add AI?

Traditional technical indicators are rule-based and lack context. AI models can:
- ✅ Provide natural language explanations
- ✅ Analyze news sentiment
- ✅ Identify trading patterns across history
- ✅ Generate personalized insights
- ✅ Offer conversational interface
- ✅ Create comprehensive reports

---

## Technology Setup

### Required Dependencies

**Backend (Node.js)**
```bash
npm install openai
npm install axios  # For OpenRouter
npm install cheerio  # For web scraping news
npm install node-fetch
```

**Environment Variables**
```env
# OpenAI
OPENAI_API_KEY=sk-...

# OpenRouter (for Claude, Llama, etc.)
OPENROUTER_API_KEY=sk-or-v1-...

# Optional: For caching responses
REDIS_URL=redis://localhost:6379

# Feature flags
ENABLE_AI_ASSISTANT=true
ENABLE_NEWS_SENTIMENT=true
ENABLE_TRADE_JOURNAL=true
```

### Model Selection

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Conversational Assistant | GPT-4o-mini | Fast, cost-effective, good reasoning |
| News Sentiment | GPT-4o-mini | Efficient for classification tasks |
| Trade Analysis | GPT-4o or Claude 3.5 Sonnet | Deep analysis capabilities |
| Report Generation | GPT-4o or Claude 3.5 Sonnet | Long-form content |
| Voice Interface | Whisper (speech-to-text) | Specialized for audio |

**OpenRouter Advantages:**
- Access multiple models (GPT-4, Claude, Gemini, Llama)
- Fallback if one provider is down
- Cost comparison across models
- Single API for all providers

---

## Feature Implementations

### 1. Conversational Trading Assistant

**User Experience:**
```
User: "Should I buy Reliance right now?"

AI Response: "Based on current analysis of Reliance (NSE: RELIANCE):

📊 Technical Indicators:
• RSI: 45 (Neutral - not overbought or oversold)
• MACD: Bullish crossover detected 2 days ago
• Price: ₹2,450 (above 50-day MA of ₹2,380)
• Volume: 20% above average - strong buyer interest

📰 Recent News Sentiment: Positive
• Announced expansion plans in renewable energy
• Q3 results beat analyst estimates by 8%

💡 Recommendation: MODERATE BUY
The technical setup is favorable with bullish momentum. However, consider:
• Stock is near 52-week high - be cautious of profit-booking
• Market volatility is elevated today
• Consider entering with 60% position now, 40% on any dip

⚠️ This is not financial advice. Trade at your own risk."
```

**Implementation:**

```typescript
// Backend: /services/aiAssistantService.ts

import OpenAI from 'openai';
import { getTechnicalIndicators } from './technicalAnalysis';
import { getNewsSentiment } from './newsService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIAssistantService {
  async answerTradingQuery(userId: string, query: string) {
    // 1. Detect intent (buy advice, portfolio query, P&L question, etc.)
    const intent = await this.detectIntent(query);
    
    // 2. Gather relevant context
    const context = await this.gatherContext(userId, intent, query);
    
    // 3. Generate response
    const response = await this.generateResponse(query, context);
    
    return response;
  }
  
  private async detectIntent(query: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Classify the user's trading query into one of these intents:
          - BUY_ADVICE: Should I buy a stock?
          - SELL_ADVICE: Should I sell a stock?
          - PORTFOLIO_QUERY: Questions about their portfolio/holdings
          - PNL_QUERY: Questions about profit/loss
          - TECHNICAL_ANALYSIS: Explain technical indicators
          - GENERAL_MARKET: General market questions
          
          Respond with just the intent name.`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.3,
    });
    
    return response.choices[0].message.content;
  }
  
  private async gatherContext(userId: string, intent: string, query: string) {
    // Extract stock symbol from query if present
    const symbol = this.extractSymbol(query);
    
    const context: any = {};
    
    if (symbol && (intent === 'BUY_ADVICE' || intent === 'SELL_ADVICE')) {
      // Get technical indicators
      context.technicalAnalysis = await getTechnicalIndicators(symbol);
      
      // Get news sentiment
      context.newsSentiment = await getNewsSentiment(symbol);
      
      // Get current price
      context.currentPrice = await this.getCurrentPrice(symbol);
      
      // Check if user already holds this stock
      context.currentHolding = await this.getUserHolding(userId, symbol);
    }
    
    if (intent === 'PORTFOLIO_QUERY' || intent === 'PNL_QUERY') {
      // Get user's holdings and P&L
      context.holdings = await this.getUserHoldings(userId);
      context.pnlSummary = await this.getPnLSummary(userId);
      context.recentTrades = await this.getRecentTrades(userId, 10);
    }
    
    return context;
  }
  
  private async generateResponse(query: string, context: any) {
    const systemPrompt = `You are an intelligent trading assistant for a stock trading application. 

Your role:
- Provide data-driven insights based on technical indicators and news sentiment
- Explain complex trading concepts in simple terms
- Always include a disclaimer that this is not financial advice
- Be concise but comprehensive
- Use emojis sparingly for visual clarity
- Format responses with clear sections

Available context:
${JSON.stringify(context, null, 2)}

Guidelines:
- Never guarantee returns or outcomes
- Always mention risks
- If data is insufficient, say so
- Cite specific indicators when making suggestions
- Consider both bullish and bearish factors`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    
    return response.choices[0].message.content;
  }
}
```

**API Endpoint:**
```typescript
// /routes/ai.ts
import express from 'express';
import { AIAssistantService } from '../services/aiAssistantService';

const router = express.Router();
const aiService = new AIAssistantService();

router.post('/chat', async (req, res) => {
  const { query } = req.body;
  const userId = req.user.id;
  
  try {
    const response = await aiService.answerTradingQuery(userId, query);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

**Frontend Component:**
```typescript
// /components/AIAssistant.tsx
import React, { useState } from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';

export const AIAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        🤖 AI Trading Assistant
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        placeholder="Ask anything: 'Should I buy TCS?', 'What's my best trade?', 'Explain RSI'"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button 
        variant="contained" 
        onClick={handleAsk}
        disabled={loading || !query}
      >
        {loading ? 'Thinking...' : 'Ask AI'}
      </Button>
      
      {response && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {response}
          </Typography>
        </Paper>
      )}
    </Paper>
  );
};
```

---

### 2. News Sentiment Analysis

**User Experience:**
- Each watchlist stock shows a sentiment badge (🟢 Positive, 🟡 Neutral, 🔴 Negative)
- Click to see news summary with sentiment reasoning
- Alerts when sentiment turns negative for holdings

**Implementation:**

```typescript
// /services/newsService.ts

import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class NewsService {
  async getNewsSentiment(symbol: string) {
    // 1. Fetch recent news (from Google News, NewsAPI, etc.)
    const news = await this.fetchNews(symbol);
    
    // 2. Analyze sentiment using AI
    const sentiment = await this.analyzeSentiment(symbol, news);
    
    return sentiment;
  }
  
  private async fetchNews(symbol: string) {
    // Option 1: Use NewsAPI (paid, reliable)
    // const url = `https://newsapi.org/v2/everything?q=${symbol}&apiKey=${API_KEY}`;
    
    // Option 2: Scrape Google News (free, less reliable)
    const companyName = await this.getCompanyName(symbol);
    const searchQuery = `${companyName} stock news`;
    const url = `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const articles = [];
      $('article').slice(0, 5).each((i, elem) => {
        const title = $(elem).find('h3').text();
        const link = $(elem).find('a').attr('href');
        if (title) {
          articles.push({ title, link });
        }
      });
      
      return articles;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }
  
  private async analyzeSentiment(symbol: string, articles: any[]) {
    if (articles.length === 0) {
      return {
        sentiment: 'NEUTRAL',
        score: 0,
        summary: 'No recent news available',
        articles: []
      };
    }
    
    const newsText = articles.map(a => a.title).join('\n');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze news sentiment for stock trading purposes.
          
          Respond with JSON:
          {
            "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
            "score": -100 to +100 (negative to positive),
            "summary": "2-3 sentence summary of key news",
            "keyPoints": ["point1", "point2", "point3"],
            "tradingImpact": "How this might affect stock price"
          }`
        },
        {
          role: "user",
          content: `Stock: ${symbol}\n\nRecent News Headlines:\n${newsText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      ...analysis,
      articles: articles.slice(0, 3), // Include top 3 articles
      timestamp: new Date(),
    };
  }
}
```

**Caching Strategy:**
```typescript
// Cache sentiment for 30 minutes to reduce API costs
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedSentiment(symbol: string) {
  const cached = await redis.get(`sentiment:${symbol}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const sentiment = await newsService.getNewsSentiment(symbol);
  await redis.setex(`sentiment:${symbol}`, 1800, JSON.stringify(sentiment)); // 30 min cache
  
  return sentiment;
}
```

---

### 3. Intelligent Trade Journal with Pattern Recognition

**User Experience:**
```
Trade completed: Bought 10 shares of TCS @ ₹3,500

User adds note: "Strong Q3 results, RSI was at 35, seemed like a good entry"

[1 month later, after selling]

AI Analysis:
"Pattern Detected: You have a 75% win rate when buying on RSI < 40.
Your average holding period for profitable tech stocks is 18 days.
Suggestion: Consider similar setups in INFY and WIPRO."
```

**Implementation:**

```typescript
// /services/tradeJournalService.ts

export class TradeJournalService {
  async analyzeTradePatterns(userId: string) {
    // Get all closed positions with notes
    const trades = await this.getClosedTradesWithNotes(userId);
    
    if (trades.length < 10) {
      return { message: "Need at least 10 completed trades for pattern analysis" };
    }
    
    // Prepare data for AI
    const tradesData = trades.map(t => ({
      symbol: t.symbol,
      sector: t.sector,
      entryPrice: t.buyPrice,
      exitPrice: t.sellPrice,
      pnl: t.pnl,
      pnlPercent: t.pnlPercent,
      holdingDays: t.holdingDays,
      entryNote: t.entryNote,
      exitNote: t.exitNote,
      entryIndicators: t.technicalIndicatorsAtEntry,
    }));
    
    const prompt = `Analyze this trader's pattern and provide actionable insights:

Trading History (${trades.length} trades):
${JSON.stringify(tradesData, null, 2)}

Provide analysis in this structure:
1. Win Rate: X% (profitable trades / total trades)
2. Best Performing Sectors: List top 3
3. Successful Entry Patterns: What conditions led to profitable trades?
4. Losing Trade Patterns: What conditions led to losses?
5. Behavioral Insights: Any emotional trading detected?
6. Specific Recommendations: 3 actionable suggestions to improve

Be specific with numbers and patterns.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional trading coach analyzing a trader's history to identify patterns and provide constructive feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });
    
    return {
      analysis: response.choices[0].message.content,
      trades: trades.length,
      analyzedAt: new Date(),
    };
  }
  
  async generateMonthlyReport(userId: string, month: string) {
    const trades = await this.getTradesForMonth(userId, month);
    const holdings = await this.getHoldingsSnapshot(userId);
    const pnlData = await this.getPnLForMonth(userId, month);
    
    const prompt = `Generate a comprehensive monthly trading report:

Month: ${month}
Total Trades: ${trades.length}
Realized P&L: ₹${pnlData.realized}
Unrealized P&L: ₹${pnlData.unrealized}
Win Rate: ${pnlData.winRate}%

Top Trades:
${JSON.stringify(trades.slice(0, 5), null, 2)}

Current Holdings:
${JSON.stringify(holdings, null, 2)}

Generate a report with:
1. Executive Summary (2-3 sentences)
2. Performance Highlights
3. Key Wins and Losses
4. Risk Assessment
5. Strategy Effectiveness
6. Recommendations for next month

Use clear formatting with sections and bullet points.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a trading performance analyst creating monthly reports for traders." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });
    
    return response.choices[0].message.content;
  }
}
```

---

### 4. Smart Recommendation Enhancer

Enhance your existing technical analysis recommendations with AI context:

```typescript
// Modify your existing recommendation service

async function getEnhancedRecommendation(symbol: string) {
  // 1. Get technical indicators (existing logic)
  const technicals = await calculateIndicators(symbol);
  
  // 2. Get news sentiment
  const sentiment = await newsService.getNewsSentiment(symbol);
  
  // 3. Get AI-enhanced recommendation
  const prompt = `Given these factors for ${symbol}:

Technical Indicators:
- RSI: ${technicals.rsi}
- MACD: ${technicals.macd.histogram > 0 ? 'Bullish' : 'Bearish'}
- Price vs 50-day MA: ${technicals.price > technicals.ma50 ? 'Above' : 'Below'}
- Volume: ${technicals.volumeVsAvg}% vs average

News Sentiment: ${sentiment.sentiment} (${sentiment.score}/100)
Key News: ${sentiment.summary}

Provide:
1. Clear BUY/SELL/HOLD recommendation
2. Confidence level (0-100)
3. Key reasons (3-4 bullet points)
4. Risk factors to consider
5. Suggested entry price range

Be concise and actionable.`;

  const aiRecommendation = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a stock trading advisor combining technical and sentiment analysis." },
      { role: "user", content: prompt }
    ],
    temperature: 0.4,
  });
  
  return {
    symbol,
    technicals,
    sentiment,
    aiRecommendation: aiRecommendation.choices[0].message.content,
    timestamp: new Date(),
  };
}
```

---

### 5. Voice Trading Interface (Advanced)

```typescript
// /services/voiceService.ts

import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class VoiceService {
  async transcribeAndExecute(audioBuffer: Buffer) {
    // 1. Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1",
    });
    
    const command = transcription.text;
    
    // 2. Parse command using GPT
    const intent = await this.parseVoiceCommand(command);
    
    // 3. Execute action
    const result = await this.executeCommand(intent);
    
    return { command, intent, result };
  }
  
  private async parseVoiceCommand(command: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Parse voice trading commands into structured actions.
          
          Supported commands:
          - "Add [company] to watchlist"
          - "Buy [number] shares of [company]"
          - "Sell [number] shares of [company]"
          - "What's the price of [company]"
          - "Show my portfolio"
          - "What's my profit and loss"
          
          Respond with JSON:
          {
            "action": "ADD_TO_WATCHLIST" | "BUY" | "SELL" | "GET_QUOTE" | "SHOW_PORTFOLIO" | "GET_PNL",
            "symbol": "RELIANCE" or null,
            "quantity": 10 or null,
            "confidence": 0.95
          }`
        },
        { role: "user", content: command }
      ],
      response_format: { type: "json_object" },
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}
```

---

## Using OpenRouter for Multiple Models

**Why OpenRouter?**
- Access GPT-4, Claude, Gemini, Llama with one API
- Automatic fallback if primary model fails
- Cost comparison
- Model-specific routing

**Setup:**
```typescript
// /services/openRouterService.ts

import axios from 'axios';

export class OpenRouterService {
  private apiKey = process.env.OPENROUTER_API_KEY;
  private baseURL = 'https://openrouter.ai/api/v1';
  
  async chat(messages: any[], model: string = 'anthropic/claude-3.5-sonnet') {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model,
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://algogainz.app',
          'X-Title': 'AlgoGainz - Smart Trading Assistant',
        }
      }
    );
    
    return response.data.choices[0].message.content;
  }
}

// Usage
const openRouter = new OpenRouterService();

// For quick responses
const quickResponse = await openRouter.chat(messages, 'openai/gpt-4o-mini');

// For deep analysis
const deepAnalysis = await openRouter.chat(messages, 'anthropic/claude-3.5-sonnet');

// For cost-effective bulk operations
const bulkAnalysis = await openRouter.chat(messages, 'meta-llama/llama-3.1-70b');
```

**Model Selection Guide:**

| Task | Best Model | Cost/1M tokens |
|------|-----------|----------------|
| Chat responses | GPT-4o-mini | $0.15 - $0.60 |
| Deep analysis | Claude 3.5 Sonnet | $3.00 - $15.00 |
| Sentiment analysis | GPT-4o-mini | $0.15 - $0.60 |
| Report generation | Claude 3.5 Sonnet | $3.00 - $15.00 |
| Bulk operations | Llama 3.1 70B | $0.80 - $1.20 |

---

## API Architecture

### Recommended Backend Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── ai/
│   │   │   ├── openaiService.ts       # OpenAI wrapper
│   │   │   ├── openRouterService.ts   # OpenRouter wrapper
│   │   │   ├── assistantService.ts    # Conversational AI
│   │   │   ├── newsService.ts         # News + sentiment
│   │   │   ├── journalService.ts      # Trade journal analysis
│   │   │   └── voiceService.ts        # Voice commands
│   │   ├── trading/
│   │   │   └── ... (existing)
│   ├── routes/
│   │   ├── ai.ts                      # AI endpoints
│   │   └── ... (existing)
│   ├── middleware/
│   │   ├── aiRateLimiter.ts          # Specific rate limits for AI
│   │   └── ... (existing)
│   └── utils/
│       ├── promptTemplates.ts         # Reusable prompts
│       └── aiCache.ts                 # Response caching
```

### Key Endpoints

```typescript
// AI Assistant
POST /api/ai/chat
Body: { query: string }
Response: { response: string, context: object }

// News Sentiment
GET /api/ai/sentiment/:symbol
Response: { sentiment: string, score: number, summary: string, articles: [] }

// Trade Journal
POST /api/ai/journal/analyze
Response: { analysis: string, patterns: [] }

GET /api/ai/journal/monthly-report/:month
Response: { report: string, metrics: {} }

// Enhanced Recommendations
GET /api/ai/recommend/:symbol
Response: { recommendation: string, confidence: number, reasoning: [] }

// Voice Commands
POST /api/ai/voice
Body: { audio: base64 }
Response: { command: string, result: object }
```

---

## Cost Optimization Strategies

### 1. Aggressive Caching
```typescript
// Cache AI responses to reduce API calls
const CACHE_DURATIONS = {
  sentiment: 30 * 60,      // 30 minutes
  recommendation: 15 * 60,  // 15 minutes
  tradeAnalysis: 24 * 60 * 60, // 24 hours (static)
  monthlyReport: 7 * 24 * 60 * 60, // 7 days
};

async function getCachedAIResponse(key: string, generator: () => Promise<any>, duration: number) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const response = await generator();
  await redis.setex(key, duration, JSON.stringify(response));
  
  return response;
}
```

### 2. Model Tiering
```typescript
// Use cheaper models for simple tasks
const MODEL_TIERS = {
  FAST: 'gpt-4o-mini',        // $0.15/1M tokens
  STANDARD: 'gpt-4o',         // $2.50/1M tokens
  PREMIUM: 'claude-3.5-sonnet', // $3.00/1M tokens
};

function selectModel(taskComplexity: 'simple' | 'moderate' | 'complex') {
  switch (taskComplexity) {
    case 'simple': return MODEL_TIERS.FAST;
    case 'moderate': return MODEL_TIERS.STANDARD;
    case 'complex': return MODEL_TIERS.PREMIUM;
  }
}
```

### 3. Batch Processing
```typescript
// Analyze multiple stocks in one API call
async function batchSentimentAnalysis(symbols: string[]) {
  const newsForAll = await Promise.all(symbols.map(s => fetchNews(s)));
  
  const prompt = `Analyze sentiment for these stocks in one response:
  ${symbols.map((s, i) => `${s}: ${newsForAll[i].join(', ')}`).join('\n')}
  
  Respond with JSON array of {symbol, sentiment, score, summary}`;
  
  // One API call instead of N calls
  const response = await openai.chat.completions.create({ ... });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### 4. User-based Rate Limiting
```typescript
// Limit AI features per user to control costs
const AI_LIMITS = {
  FREE_TIER: {
    chatQueries: 10,     // per day
    sentimentChecks: 20, // per day
    reports: 1,          // per month
  },
  PREMIUM_TIER: {
    chatQueries: 100,
    sentimentChecks: 200,
    reports: 10,
  }
};
```

### 5. Prompt Optimization
```typescript
// Shorter prompts = lower costs
// BAD: Include entire trade history (10,000 tokens)
// GOOD: Summarize key metrics (500 tokens)

function optimizeTradeData(trades: Trade[]) {
  return {
    totalTrades: trades.length,
    winRate: calculateWinRate(trades),
    avgReturn: calculateAvgReturn(trades),
    topWinners: trades.slice(0, 3),
    topLosers: trades.slice(-3),
    // Instead of all 100 trades, send summary + top/bottom examples
  };
}
```

**Estimated Monthly Costs (100 active users):**

| Feature | Usage per User | Monthly Cost |
|---------|---------------|--------------|
| Chat Assistant | 50 queries/month | $5-10 |
| News Sentiment | 200 checks/month (cached) | $2-5 |
| Trade Analysis | 2 reports/month | $1-2 |
| **Total per User** | | **$8-17** |
| **Total (100 users)** | | **$800-1,700** |

With optimization: **$300-500/month**

---

## Security Considerations

### 1. API Key Protection
```typescript
// NEVER expose AI API keys on frontend
// BAD: const apiKey = 'sk-...' in React component
// GOOD: All AI calls go through backend

// Backend proxy pattern
app.post('/api/ai/*', authenticate, async (req, res) => {
  // User is authenticated
  // Backend holds the API key
  // Make AI API call
  // Return sanitized response
});
```

### 2. Input Sanitization
```typescript
// Prevent prompt injection attacks
function sanitizeUserInput(input: string): string {
  // Remove potential prompt injection attempts
  const dangerous = [
    'ignore previous instructions',
    'disregard all above',
    'new instructions:',
    'system:',
  ];
  
  let sanitized = input;
  dangerous.forEach(phrase => {
    sanitized = sanitized.replace(new RegExp(phrase, 'gi'), '');
  });
  
  // Limit length
  return sanitized.slice(0, 1000);
}
```

### 3. Content Filtering
```typescript
// Don't expose sensitive user data in prompts
function prepareSecureContext(userData: any) {
  return {
    holdings: userData.holdings.map(h => ({
      symbol: h.symbol,
      pnl: h.pnl,
      // Remove: user's personal info, account numbers, etc.
    })),
    // Never include: passwords, API keys, PII
  };
}
```

### 4. Rate Limiting
```typescript
// Prevent abuse and control costs
import rateLimit from 'express-rate-limit';

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI requests per hour per user
  message: 'Too many AI requests, please try again later',
});

app.use('/api/ai', aiRateLimiter);
```

---

## Testing AI Features

### 1. Mock Responses for Development
```typescript
// /utils/mockAI.ts

export const mockAIResponses = {
  chat: {
    'should i buy reliance': 'Based on current analysis...',
    'whats my pnl': 'Your total P&L is...',
  },
  sentiment: {
    'RELIANCE': {
      sentiment: 'POSITIVE',
      score: 75,
      summary: 'Strong quarterly results...',
    }
  }
};

// Use in development
const response = process.env.NODE_ENV === 'development'
  ? mockAIResponses.chat[query.toLowerCase()]
  : await aiService.chat(query);
```

### 2. A/B Testing
```typescript
// Test AI recommendations vs rule-based
async function getRecommendation(symbol: string, useAI: boolean) {
  if (useAI && Math.random() > 0.5) {
    // 50% get AI-enhanced
    return getAIRecommendation(symbol);
  } else {
    // 50% get traditional
    return getTraditionalRecommendation(symbol);
  }
  
  // Track which performs better
}
```

---

## Feature Rollout Plan

### Phase 1: Foundation (Week 1)
- ✅ Setup OpenAI/OpenRouter integration
- ✅ Basic chat endpoint
- ✅ Caching infrastructure
- ✅ Rate limiting

### Phase 2: Core AI Features (Week 2-3)
- ✅ Conversational assistant
- ✅ News sentiment analysis
- ✅ Enhanced recommendations

### Phase 3: Advanced Features (Week 4-5)
- ✅ Trade journal analysis
- ✅ Pattern recognition
- ✅ Monthly reports

### Phase 4: Premium Features (Week 6+)
- ✅ Voice interface
- ✅ Real-time market context
- ✅ Advanced portfolio analysis

---

## Integration with Existing Codebase

### Update CLAUDE.md Development Phases

Add new phase after Phase 12:

**Phase 12.5: AI Features Integration (Week 7)**

1. Install AI dependencies
2. Setup OpenAI/OpenRouter services
3. Implement conversational assistant
4. Add news sentiment to watchlist
5. Enhance recommendation engine
6. Build trade journal analytics
7. Add AI chat widget to dashboard

### Update PRD

Add new functional requirement:

**FR10: AI-Powered Insights**
- Conversational trading assistant
- News sentiment analysis for watchlist stocks
- AI-enhanced buy/sell recommendations
- Trade pattern recognition and coaching
- Automated monthly performance reports

---

## Monitoring and Analytics

Track AI feature usage:

```typescript
// Log AI interactions for analysis
await logAIUsage({
  userId,
  feature: 'chat_assistant',
  query,
  response,
  model: 'gpt-4o-mini',
  tokensUsed: 250,
  cost: 0.0001,
  userSatisfaction: feedback, // optional
  timestamp: new Date(),
});

// Dashboard metrics
GET /api/admin/ai-metrics
{
  totalQueries: 1250,
  uniqueUsers: 87,
  avgQueriesPerUser: 14.4,
  totalCost: '$25.50',
  mostPopularFeature: 'chat_assistant',
  avgResponseTime: '2.3s',
  userSatisfaction: 4.2
}
```

---

## Troubleshooting

### Common Issues

1. **High API costs**
   - Solution: Implement aggressive caching, use cheaper models for simple tasks

2. **Slow response times**
   - Solution: Use streaming responses, set max_tokens limits

3. **Inconsistent recommendations**
   - Solution: Lower temperature (0.3-0.5), add more specific instructions

4. **Prompt injection attempts**
   - Solution: Sanitize inputs, use system messages to reinforce boundaries

5. **Rate limit exceeded**
   - Solution: Implement user-based rate limiting, queue requests

---

## Summary

**Recommended AI Features (Priority Order):**

1. ⭐ **Conversational Trading Assistant** - High value, moderate cost
2. ⭐ **News Sentiment Analysis** - High value, low cost (with caching)
3. ⭐ **Enhanced Recommendations** - High value, low cost
4. 🔸 **Trade Journal Analysis** - Medium value, low cost
5. 🔸 **Monthly Reports** - Medium value, low cost
6. 🔹 **Voice Interface** - Low value (nice-to-have), high complexity

**Start with #1-3, add #4-5 after validation, consider #6 for v2.**

**Total Development Time:** 2-3 weeks for phases 1-3, additional 1-2 weeks for phases 4-5.

**Monthly Operating Cost:** $300-500 for 100 active users (with optimization).

---

## Next Steps

1. Get OpenAI API key: https://platform.openai.com/api-keys
2. Or get OpenRouter key: https://openrouter.ai/keys
3. Add to your `.env` file
4. Start with Phase 1 (foundation)
5. Build conversational assistant first (highest value)
6. Iterate based on user feedback

**Questions?** Refer to official documentation:
- OpenAI: https://platform.openai.com/docs
- OpenRouter: https://openrouter.ai/docs

---

*This guide complements the main CLAUDE.md. Implement AI features after core trading functionality is stable.*
