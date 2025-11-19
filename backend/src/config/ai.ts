/**
 * AI Configuration for AlgoGainz
 * Supports OpenAI and OpenRouter APIs
 */

export interface AIConfig {
  provider: 'openai' | 'openrouter';
  apiKey: string;
  model: string;
  baseURL?: string;
  maxTokens: number;
  temperature: number;
}

// Environment variables
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * AI Provider Configuration
 */
export const aiConfig: AIConfig = {
  provider: (process.env.AI_PROVIDER as 'openai' | 'openrouter') || 'openai',
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
  model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
  baseURL: process.env.AI_BASE_URL,
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
};

/**
 * OpenRouter specific configuration
 */
export const openRouterConfig = {
  baseURL: 'https://openrouter.ai/api/v1',
  models: {
    'gpt-4-turbo': 'openai/gpt-4-turbo-preview',
    'gpt-3.5': 'openai/gpt-3.5-turbo',
    'claude-3': 'anthropic/claude-3-opus',
    'claude-3-sonnet': 'anthropic/claude-3-sonnet',
  },
  headers: {
    'HTTP-Referer': process.env.APP_URL || 'https://algogainz.com',
    'X-Title': 'AlgoGainz Trading Assistant',
  },
};

/**
 * Feature flags for AI capabilities
 */
export const aiFeatures = {
  conversationalAssistant: process.env.AI_FEATURE_ASSISTANT !== 'false',
  sentimentAnalysis: process.env.AI_FEATURE_SENTIMENT !== 'false',
  enhancedRecommendations: process.env.AI_FEATURE_RECOMMENDATIONS !== 'false',
  tradeJournalAnalysis: process.env.AI_FEATURE_JOURNAL !== 'false',
  automatedReports: process.env.AI_FEATURE_REPORTS !== 'false',
};

/**
 * AI prompts and system messages
 */
export const aiPrompts = {
  systemMessage: `You are an AI trading assistant for AlgoGainz, a stock trading application for the Indian stock market (NSE/BSE).

Your role:
- Provide data-driven trading insights based on technical analysis
- Help users understand their portfolio and trading patterns
- Answer questions about stocks, market trends, and trading strategies
- Analyze trading history and provide actionable feedback

Important guidelines:
- NEVER guarantee profits or specific outcomes
- Always mention that trading involves risk
- Base recommendations on technical indicators and data
- Encourage responsible trading practices
- Cite data sources when making claims
- Be concise and actionable in responses

You have access to:
- Real-time stock prices
- Technical indicators (RSI, MACD, Moving Averages, Bollinger Bands)
- User's trading history and portfolio
- Market news and sentiment

Current date: ${new Date().toISOString().split('T')[0]}
Market: Indian Stock Market (NSE/BSE)`,

  conversationalAssistant: {
    greeting: "Hello! I'm your AlgoGainz AI assistant. I can help you with stock analysis, trading insights, and portfolio reviews. What would you like to know?",

    stockAnalysis: (symbol: string, indicators: any) => `Analyze ${symbol} stock based on these technical indicators:
${JSON.stringify(indicators, null, 2)}

Provide:
1. Current signal (Strong Buy, Buy, Hold, Sell, Strong Sell)
2. Key technical levels (support/resistance)
3. Risk factors
4. Potential entry/exit points
Keep the response concise (under 200 words).`,

    portfolioReview: (holdings: any[], pnl: number) => `Review this trading portfolio:
Holdings: ${JSON.stringify(holdings, null, 2)}
Overall P&L: ₹${pnl.toFixed(2)}

Provide:
1. Portfolio health assessment
2. Diversification analysis
3. Risk exposure
4. Actionable recommendations
Keep the response under 250 words.`,

    tradeAdvice: (symbol: string, action: 'BUY' | 'SELL', context: any) => `User wants to ${action} ${symbol}. Here's the context:
${JSON.stringify(context, null, 2)}

Provide:
1. Is this a good decision based on technicals?
2. Timing considerations
3. Risk management suggestions
4. Position sizing recommendation
Be direct and actionable (under 150 words).`,
  },

  sentimentAnalysis: {
    analyzeNews: (symbol: string, newsArticles: string[]) => `Analyze sentiment for ${symbol} from these news headlines:
${newsArticles.map((article, i) => `${i + 1}. ${article}`).join('\n')}

Provide:
1. Overall sentiment: Positive, Neutral, or Negative
2. Sentiment score: -1.0 to 1.0
3. Key themes
4. Impact on stock (brief)

Respond in JSON format:
{
  "sentiment": "Positive|Neutral|Negative",
  "score": 0.0,
  "themes": ["theme1", "theme2"],
  "impact": "brief summary"
}`,
  },

  tradeJournalAnalysis: {
    analyzePatterns: (transactions: any[]) => `Analyze this trader's transaction history to find patterns:
${JSON.stringify(transactions.slice(0, 50), null, 2)}

Identify:
1. Trading patterns (frequency, timing, sectors)
2. Winning vs losing trade characteristics
3. Behavioral biases (if any)
4. Suggestions for improvement

Provide actionable insights in under 300 words.`,

    performanceReport: (metrics: any) => `Generate a performance analysis report:
${JSON.stringify(metrics, null, 2)}

Include:
1. Performance summary
2. Strengths in trading approach
3. Areas for improvement
4. Specific actionable recommendations
5. Risk management assessment

Format as a professional report (under 400 words).`,
  },
};

/**
 * Token usage tracking
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Calculate estimated cost based on token usage
 */
export function calculateAICost(usage: TokenUsage, provider: 'openai' | 'openrouter'): number {
  // Costs per 1K tokens (approximate as of 2025)
  const costs = {
    openai: {
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    },
    openrouter: {
      'openai/gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'anthropic/claude-3-opus': { input: 0.015, output: 0.075 },
      'anthropic/claude-3-sonnet': { input: 0.003, output: 0.015 },
    },
  };

  const model = aiConfig.model;
  const pricing = provider === 'openai'
    ? costs.openai[model as keyof typeof costs.openai] || costs.openai['gpt-4-turbo-preview']
    : costs.openrouter[model as keyof typeof costs.openrouter] || costs.openrouter['openai/gpt-4-turbo-preview'];

  const inputCost = (usage.promptTokens / 1000) * pricing.input;
  const outputCost = (usage.completionTokens / 1000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(): void {
  if (!aiConfig.apiKey) {
    if (isDevelopment) {
      console.warn('⚠️  Warning: AI_API_KEY or OPENAI_API_KEY not set. AI features will be disabled.');
    } else {
      throw new Error('AI_API_KEY or OPENAI_API_KEY is required in production');
    }
  }

  if (aiConfig.provider === 'openrouter' && !aiConfig.baseURL) {
    aiConfig.baseURL = openRouterConfig.baseURL;
  }

  // Log AI configuration (without exposing API key)
  console.log('🤖 AI Configuration:');
  console.log(`   Provider: ${aiConfig.provider}`);
  console.log(`   Model: ${aiConfig.model}`);
  console.log(`   API Key: ${aiConfig.apiKey ? '✓ Set' : '✗ Not set'}`);
  console.log(`   Features: ${Object.entries(aiFeatures).filter(([_, enabled]) => enabled).map(([key]) => key).join(', ')}`);
}

/**
 * AI rate limiting configuration
 */
export const aiRateLimits = {
  requestsPerMinute: parseInt(process.env.AI_RATE_LIMIT_RPM || '20'),
  requestsPerDay: parseInt(process.env.AI_RATE_LIMIT_RPD || '1000'),
  tokensPerMinute: parseInt(process.env.AI_RATE_LIMIT_TPM || '100000'),
};
