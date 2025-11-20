/**
 * AI Service for AlgoGainz
 * Handles communication with OpenAI/OpenRouter APIs
 */

import axios, { AxiosInstance } from 'axios';
import {
  aiConfig,
  aiPrompts,
  aiFeatures,
  openRouterConfig,
  TokenUsage,
  calculateAICost,
} from '../config/ai';

export interface AIRequest {
  prompt: string;
  systemMessage?: string;
  maxTokens?: number;
  temperature?: number;
  userId?: string;
}

export interface AIResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  provider: string;
}

class AIService {
  private client!: AxiosInstance;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!aiConfig.apiKey;

    if (!this.isConfigured) {
      console.warn('⚠️  AI Service not configured (missing API key)');
      return;
    }

    // Initialize API client
    const baseURL = aiConfig.provider === 'openrouter'
      ? openRouterConfig.baseURL
      : aiConfig.baseURL || 'https://api.openai.com/v1';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        ...(aiConfig.provider === 'openrouter' ? openRouterConfig.headers : {}),
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Generate completion using AI
   */
  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured) {
      throw new Error('AI service is not configured');
    }

    const messages = [
      {
        role: 'system',
        content: request.systemMessage || aiPrompts.systemMessage,
      },
      {
        role: 'user',
        content: request.prompt,
      },
    ];

    const model = aiConfig.provider === 'openrouter' && aiConfig.model.includes('/')
      ? aiConfig.model
      : aiConfig.model;

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        max_tokens: request.maxTokens || aiConfig.maxTokens,
        temperature: request.temperature || aiConfig.temperature,
      });

      const { data } = response;
      const content = data.choices[0].message.content;
      const usage: TokenUsage = {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        estimatedCost: calculateAICost(
          {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
            estimatedCost: 0,
          },
          aiConfig.provider
        ),
      };

      // Log usage for monitoring
      console.log(`[AI] Usage - Tokens: ${usage.totalTokens}, Cost: $${usage.estimatedCost.toFixed(4)}`);

      return {
        content,
        usage,
        model: data.model,
        provider: aiConfig.provider,
      };
    } catch (error: any) {
      console.error('[AI Service Error]', error.response?.data || error.message);

      if (error.response?.status === 429) {
        throw new Error('AI API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('AI API authentication failed. Please check API key.');
      } else {
        throw new Error('AI service temporarily unavailable. Please try again.');
      }
    }
  }

  /**
   * Conversational Assistant - Answer user questions
   */
  async askAssistant(question: string, context?: any): Promise<string> {
    if (!aiFeatures.conversationalAssistant) {
      throw new Error('Conversational assistant feature is disabled');
    }

    const contextInfo = context
      ? `\n\nAdditional Context:\n${JSON.stringify(context, null, 2)}`
      : '';

    const prompt = `${question}${contextInfo}`;

    const response = await this.generateCompletion({
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    return response.content;
  }

  /**
   * Analyze stock with AI insights
   */
  async analyzeStock(symbol: string, indicators: any, marketData?: any): Promise<string> {
    if (!aiFeatures.enhancedRecommendations) {
      throw new Error('Enhanced recommendations feature is disabled');
    }

    const prompt = aiPrompts.conversationalAssistant.stockAnalysis(symbol, indicators);

    const response = await this.generateCompletion({
      prompt,
      maxTokens: 400,
      temperature: 0.6,
    });

    return response.content;
  }

  /**
   * Sentiment analysis from news headlines
   */
  async analyzeSentiment(symbol: string, newsArticles: string[]): Promise<{
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    score: number;
    themes: string[];
    impact: string;
  }> {
    if (!aiFeatures.sentimentAnalysis) {
      throw new Error('Sentiment analysis feature is disabled');
    }

    const prompt = aiPrompts.sentimentAnalysis.analyzeNews(symbol, newsArticles);

    const response = await this.generateCompletion({
      prompt,
      maxTokens: 300,
      temperature: 0.3, // Lower temperature for more consistent JSON
    });

    try {
      // Extract JSON from response (handle markdown code blocks)
      const content = response.content.trim();
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[AI] Failed to parse sentiment JSON:', response.content);
      // Return default neutral sentiment
      return {
        sentiment: 'Neutral',
        score: 0,
        themes: [],
        impact: 'Unable to analyze sentiment',
      };
    }
  }

  /**
   * Review user's portfolio
   */
  async reviewPortfolio(holdings: any[], totalPnL: number, context?: any): Promise<string> {
    if (!aiFeatures.enhancedRecommendations) {
      throw new Error('Portfolio review feature is disabled');
    }

    const prompt = aiPrompts.conversationalAssistant.portfolioReview(holdings, totalPnL);

    const response = await this.generateCompletion({
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    return response.content;
  }

  /**
   * Get trade advice
   */
  async getTradeAdvice(
    symbol: string,
    action: 'BUY' | 'SELL',
    context: any
  ): Promise<string> {
    if (!aiFeatures.enhancedRecommendations) {
      throw new Error('Trade advice feature is disabled');
    }

    const prompt = aiPrompts.conversationalAssistant.tradeAdvice(symbol, action, context);

    const response = await this.generateCompletion({
      prompt,
      maxTokens: 350,
      temperature: 0.6,
    });

    return response.content;
  }

  /**
   * Analyze trading patterns from transaction history
   */
  async analyzeTradeJournal(transactions: any[]): Promise<string> {
    if (!aiFeatures.tradeJournalAnalysis) {
      throw new Error('Trade journal analysis feature is disabled');
    }

    const prompt = aiPrompts.tradeJournalAnalysis.analyzePatterns(transactions);

    const response = await this.generateCompletion({
      prompt,
      maxTokens: 600,
      temperature: 0.7,
    });

    return response.content;
  }

  /**
   * Generate automated performance report
   */
  async generatePerformanceReport(metrics: any): Promise<string> {
    if (!aiFeatures.automatedReports) {
      throw new Error('Automated reports feature is disabled');
    }

    const prompt = aiPrompts.tradeJournalAnalysis.performanceReport(metrics);

    const response = await this.generateCompletion({
      prompt,
      maxTokens: 800,
      temperature: 0.7,
    });

    return response.content;
  }

  /**
   * Stream response for conversational interface (future enhancement)
   */
  async streamCompletion(request: AIRequest): Promise<ReadableStream> {
    // Placeholder for streaming implementation
    // This would use Server-Sent Events (SSE) for real-time streaming
    throw new Error('Streaming not yet implemented');
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for testing
export default AIService;
