/**
 * AI Service - Frontend
 * Client-side service for AI features
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface AIStatus {
  available: boolean;
  features: {
    conversationalAssistant: boolean;
    sentimentAnalysis: boolean;
    enhancedRecommendations: boolean;
    tradeJournalAnalysis: boolean;
    automatedReports: boolean;
  };
}

export interface SentimentAnalysis {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  score: number;
  themes: string[];
  impact: string;
}

class AIService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/ai`;
  }

  /**
   * Check AI service status
   */
  async getStatus(): Promise<AIStatus> {
    try {
      const response = await axios.get(`${this.baseURL}/status`);
      return response.data.data;
    } catch (error) {
      console.error('[AI Service] Status check failed:', error);
      return {
        available: false,
        features: {
          conversationalAssistant: false,
          sentimentAnalysis: false,
          enhancedRecommendations: false,
          tradeJournalAnalysis: false,
          automatedReports: false,
        },
      };
    }
  }

  /**
   * Ask the AI assistant a question
   */
  async ask(question: string, context?: any): Promise<string> {
    const response = await axios.post(`${this.baseURL}/ask`, {
      question,
      context,
    });
    return response.data.data.answer;
  }

  /**
   * Get AI-powered stock analysis
   */
  async analyzeStock(symbol: string, indicators: any, marketData?: any): Promise<string> {
    const response = await axios.post(`${this.baseURL}/analyze-stock`, {
      symbol,
      indicators,
      marketData,
    });
    return response.data.data.analysis;
  }

  /**
   * Analyze news sentiment for a stock
   */
  async analyzeSentiment(symbol: string, newsArticles: string[]): Promise<SentimentAnalysis> {
    const response = await axios.post(`${this.baseURL}/sentiment`, {
      symbol,
      newsArticles,
    });
    return response.data.data.sentiment;
  }

  /**
   * Get AI portfolio review
   */
  async reviewPortfolio(holdings: any[], totalPnL: number, context?: any): Promise<string> {
    const response = await axios.post(`${this.baseURL}/portfolio-review`, {
      holdings,
      totalPnL,
      context,
    });
    return response.data.data.review;
  }

  /**
   * Get trade advice from AI
   */
  async getTradeAdvice(symbol: string, action: 'BUY' | 'SELL', context: any): Promise<string> {
    const response = await axios.post(`${this.baseURL}/trade-advice`, {
      symbol,
      action,
      context,
    });
    return response.data.data.advice;
  }

  /**
   * Analyze trade journal patterns
   */
  async analyzeTradeJournal(transactions: any[]): Promise<string> {
    const response = await axios.post(`${this.baseURL}/analyze-journal`, {
      transactions,
    });
    return response.data.data.analysis;
  }

  /**
   * Generate AI performance report
   */
  async generatePerformanceReport(metrics: any): Promise<string> {
    const response = await axios.post(`${this.baseURL}/performance-report`, {
      metrics,
    });
    return response.data.data.report;
  }
}

export const aiService = new AIService();
export default aiService;
