import axios from 'axios';
import {
  RSI,
  MACD,
  SMA,
  EMA,
  BollingerBands,
  ATR,
  Stochastic,
} from 'technicalindicators';

interface KiteHistoricalCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema20: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
  stochastic: {
    k: number;
    d: number;
  };
  volume: {
    current: number;
    average: number;
  };
}

interface TradingSignal {
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  score: number; // 0-100
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  indicators: TechnicalIndicators;
  price: number;
  timestamp: Date;
}

export class TechnicalAnalysisService {
  private kiteBaseUrl = 'https://api.kite.trade';

  /**
   * Fetch historical data from Kite API
   */
  async getHistoricalData(
    accessToken: string,
    instrumentToken: string,
    interval: string = 'day',
    days: number = 100
  ): Promise<KiteHistoricalCandle[]> {
    try {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const apiKey = process.env.KITE_API_KEY;
      if (!apiKey) {
        throw new Error('KITE_API_KEY not configured');
      }

      const response = await axios.get(
        `${this.kiteBaseUrl}/instruments/historical/${instrumentToken}/${interval}`,
        {
          headers: {
            'X-Kite-Version': '3',
            Authorization: `token ${apiKey}:${accessToken}`,
          },
          params: {
            from: fromDate.toISOString().split('T')[0],
            to: toDate.toISOString().split('T')[0],
          },
        }
      );

      return response.data.data.candles.map((candle: any) => ({
        date: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      }));
    } catch (error: any) {
      console.error('Failed to fetch historical data:', error.response?.data || error.message);
      throw new Error('Failed to fetch historical data');
    }
  }

  /**
   * Calculate all technical indicators
   */
  calculateIndicators(candles: KiteHistoricalCandle[]): TechnicalIndicators {
    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);

    // RSI (14-period)
    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    const rsi = rsiValues[rsiValues.length - 1] || 50;

    // MACD (12, 26, 9)
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const macdLast = macdValues[macdValues.length - 1] || { MACD: 0, signal: 0, histogram: 0 };

    // Moving Averages
    const sma20Values = SMA.calculate({ period: 20, values: closes });
    const sma50Values = SMA.calculate({ period: 50, values: closes });
    const sma200Values = SMA.calculate({ period: 200, values: closes });
    const ema20Values = EMA.calculate({ period: 20, values: closes });

    // Bollinger Bands (20-period, 2 std dev)
    const bbValues = BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2,
    });
    const bbLast = bbValues[bbValues.length - 1] || { upper: 0, middle: 0, lower: 0 };

    // ATR (Average True Range - 14 period)
    const atrValues = ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });
    const atr = atrValues[atrValues.length - 1] || 0;

    // Stochastic Oscillator (14, 3, 3)
    const stochValues = Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
      signalPeriod: 3,
    });
    const stochLast = stochValues[stochValues.length - 1] || { k: 50, d: 50 };

    // Volume analysis
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];

    return {
      rsi,
      macd: {
        macd: macdLast.MACD || 0,
        signal: macdLast.signal || 0,
        histogram: macdLast.histogram || 0,
      },
      movingAverages: {
        sma20: sma20Values[sma20Values.length - 1] || closes[closes.length - 1],
        sma50: sma50Values[sma50Values.length - 1] || closes[closes.length - 1],
        sma200: sma200Values[sma200Values.length - 1] || closes[closes.length - 1],
        ema20: ema20Values[ema20Values.length - 1] || closes[closes.length - 1],
      },
      bollingerBands: {
        upper: bbLast.upper,
        middle: bbLast.middle,
        lower: bbLast.lower,
      },
      atr,
      stochastic: {
        k: stochLast.k,
        d: stochLast.d,
      },
      volume: {
        current: currentVolume,
        average: avgVolume,
      },
    };
  }

  /**
   * Generate trading recommendation based on technical indicators
   */
  getRecommendation(
    indicators: TechnicalIndicators,
    currentPrice: number
  ): TradingSignal {
    let score = 50; // Start neutral
    const reasons: string[] = [];

    // RSI Analysis (Weight: 15 points)
    if (indicators.rsi < 30) {
      score += 15;
      reasons.push(`RSI (${indicators.rsi.toFixed(1)}) indicates oversold conditions - bullish signal`);
    } else if (indicators.rsi < 40) {
      score += 8;
      reasons.push(`RSI (${indicators.rsi.toFixed(1)}) is approaching oversold - moderately bullish`);
    } else if (indicators.rsi > 70) {
      score -= 15;
      reasons.push(`RSI (${indicators.rsi.toFixed(1)}) indicates overbought conditions - bearish signal`);
    } else if (indicators.rsi > 60) {
      score -= 8;
      reasons.push(`RSI (${indicators.rsi.toFixed(1)}) is approaching overbought - moderately bearish`);
    } else {
      reasons.push(`RSI (${indicators.rsi.toFixed(1)}) is neutral`);
    }

    // MACD Analysis (Weight: 15 points)
    if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
      score += 15;
      reasons.push('MACD is above signal line with positive histogram - strong bullish momentum');
    } else if (indicators.macd.histogram > 0) {
      score += 8;
      reasons.push('MACD histogram is positive - bullish momentum building');
    } else if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
      score -= 15;
      reasons.push('MACD is below signal line with negative histogram - strong bearish momentum');
    } else if (indicators.macd.histogram < 0) {
      score -= 8;
      reasons.push('MACD histogram is negative - bearish momentum building');
    }

    // Moving Averages Analysis (Weight: 20 points)
    const ma = indicators.movingAverages;
    if (currentPrice > ma.sma20 && currentPrice > ma.sma50 && currentPrice > ma.sma200) {
      score += 20;
      reasons.push('Price is above all major moving averages - strong uptrend');
    } else if (currentPrice > ma.sma20 && currentPrice > ma.sma50) {
      score += 12;
      reasons.push('Price is above short and medium-term moving averages - uptrend');
    } else if (currentPrice > ma.sma20) {
      score += 5;
      reasons.push('Price is above 20-day SMA - short-term uptrend');
    } else if (currentPrice < ma.sma20 && currentPrice < ma.sma50 && currentPrice < ma.sma200) {
      score -= 20;
      reasons.push('Price is below all major moving averages - strong downtrend');
    } else if (currentPrice < ma.sma20 && currentPrice < ma.sma50) {
      score -= 12;
      reasons.push('Price is below short and medium-term moving averages - downtrend');
    } else if (currentPrice < ma.sma20) {
      score -= 5;
      reasons.push('Price is below 20-day SMA - short-term downtrend');
    }

    // Bollinger Bands Analysis (Weight: 15 points)
    const bb = indicators.bollingerBands;
    const bbPosition = ((currentPrice - bb.lower) / (bb.upper - bb.lower)) * 100;
    if (bbPosition < 20) {
      score += 15;
      reasons.push('Price near lower Bollinger Band - potentially oversold, bullish reversal expected');
    } else if (bbPosition > 80) {
      score -= 15;
      reasons.push('Price near upper Bollinger Band - potentially overbought, bearish reversal expected');
    } else if (bbPosition >= 40 && bbPosition <= 60) {
      reasons.push('Price in middle of Bollinger Bands - neutral');
    }

    // Stochastic Analysis (Weight: 10 points)
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
      score += 10;
      reasons.push(`Stochastic (${indicators.stochastic.k.toFixed(1)}) indicates oversold - bullish`);
    } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
      score -= 10;
      reasons.push(`Stochastic (${indicators.stochastic.k.toFixed(1)}) indicates overbought - bearish`);
    }

    // Volume Analysis (Weight: 10 points)
    const volumeRatio = indicators.volume.current / indicators.volume.average;
    if (volumeRatio > 1.5) {
      // High volume confirms the trend
      if (score > 50) {
        score += 10;
        reasons.push(`Volume ${(volumeRatio * 100).toFixed(0)}% above average - confirms bullish trend`);
      } else if (score < 50) {
        score -= 10;
        reasons.push(`Volume ${(volumeRatio * 100).toFixed(0)}% above average - confirms bearish trend`);
      }
    } else if (volumeRatio < 0.7) {
      reasons.push('Below average volume - weak conviction in current price movement');
    }

    // Determine signal based on score
    let signal: TradingSignal['signal'];
    let confidence: TradingSignal['confidence'];

    if (score >= 75) {
      signal = 'STRONG_BUY';
      confidence = 'HIGH';
    } else if (score >= 60) {
      signal = 'BUY';
      confidence = score >= 65 ? 'MEDIUM' : 'LOW';
    } else if (score >= 45 && score <= 55) {
      signal = 'HOLD';
      confidence = 'MEDIUM';
    } else if (score >= 30) {
      signal = 'SELL';
      confidence = score <= 35 ? 'MEDIUM' : 'LOW';
    } else {
      signal = 'STRONG_SELL';
      confidence = 'HIGH';
    }

    return {
      signal,
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons,
      indicators,
      price: currentPrice,
      timestamp: new Date(),
    };
  }

  /**
   * Get complete analysis for a stock
   */
  async analyzeStock(
    accessToken: string,
    instrumentToken: string,
    currentPrice: number,
    interval: string = 'day'
  ): Promise<TradingSignal> {
    // Fetch historical data
    const candles = await this.getHistoricalData(accessToken, instrumentToken, interval, 100);

    // Calculate indicators
    const indicators = this.calculateIndicators(candles);

    // Generate recommendation
    return this.getRecommendation(indicators, currentPrice);
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService();
