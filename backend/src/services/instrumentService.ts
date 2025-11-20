/**
 * Instrument Service
 * Maps stock symbols to Kite instrument tokens
 */

import axios from 'axios';

export interface Instrument {
  instrument_token: number;
  exchange_token: number;
  tradingsymbol: string;
  name: string;
  last_price: number;
  expiry: string;
  strike: number;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
  segment: string;
  exchange: string;
}

interface SymbolMapping {
  symbol: string;
  instrumentToken: number;
  exchange: string;
  name: string;
}

class InstrumentService {
  private instrumentsCache: Map<string, Instrument> = new Map();
  private symbolToTokenMap: Map<string, number> = new Map();
  private tokenToSymbolMap: Map<number, SymbolMapping> = new Map();
  private lastFetchTime: Date | null = null;
  private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch instruments from Kite API
   * Instruments are cached for 24 hours
   */
  async fetchInstruments(apiKey: string): Promise<void> {
    try {
      // Check if cache is still valid
      if (this.lastFetchTime &&
          (Date.now() - this.lastFetchTime.getTime()) < this.cacheDuration) {
        console.log('✅ Using cached instruments');
        return;
      }

      console.log('📥 Fetching instruments from Kite API...');

      // Fetch instruments CSV from Kite
      const response = await axios.get(
        `https://api.kite.trade/instruments`,
        {
          headers: {
            'X-Kite-Version': '3',
          },
          timeout: 30000,
        }
      );

      // Parse CSV data
      const lines = response.data.split('\n');
      const headers = lines[0].split(',');

      // Clear existing caches
      this.instrumentsCache.clear();
      this.symbolToTokenMap.clear();
      this.tokenToSymbolMap.clear();

      // Parse each instrument
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',');
        if (values.length < headers.length) continue;

        const instrument: any = {};
        headers.forEach((header: string, index: number) => {
          instrument[header.trim()] = values[index]?.trim() || '';
        });

        // Convert types
        const instrumentToken = parseInt(instrument.instrument_token);
        if (isNaN(instrumentToken)) continue;

        const instrumentData: Instrument = {
          instrument_token: instrumentToken,
          exchange_token: parseInt(instrument.exchange_token) || 0,
          tradingsymbol: instrument.tradingsymbol,
          name: instrument.name || instrument.tradingsymbol,
          last_price: parseFloat(instrument.last_price) || 0,
          expiry: instrument.expiry || '',
          strike: parseFloat(instrument.strike) || 0,
          tick_size: parseFloat(instrument.tick_size) || 0.05,
          lot_size: parseInt(instrument.lot_size) || 1,
          instrument_type: instrument.instrument_type || 'EQ',
          segment: instrument.segment || '',
          exchange: instrument.exchange || 'NSE',
        };

        // Cache instrument
        const key = `${instrumentData.exchange}:${instrumentData.tradingsymbol}`;
        this.instrumentsCache.set(key, instrumentData);

        // Map symbol to token
        this.symbolToTokenMap.set(key, instrumentToken);

        // Map token to symbol
        this.tokenToSymbolMap.set(instrumentToken, {
          symbol: instrumentData.tradingsymbol,
          instrumentToken,
          exchange: instrumentData.exchange,
          name: instrumentData.name,
        });
      }

      this.lastFetchTime = new Date();
      console.log(`✅ Cached ${this.instrumentsCache.size} instruments`);
    } catch (error) {
      console.error('❌ Error fetching instruments:', error);
      throw error;
    }
  }

  /**
   * Get instrument token for a symbol
   */
  getInstrumentToken(symbol: string, exchange: string = 'NSE'): number | null {
    const key = `${exchange}:${symbol}`;
    return this.symbolToTokenMap.get(key) || null;
  }

  /**
   * Get symbol for instrument token
   */
  getSymbolFromToken(token: number): SymbolMapping | null {
    return this.tokenToSymbolMap.get(token) || null;
  }

  /**
   * Get instrument details
   */
  getInstrument(symbol: string, exchange: string = 'NSE'): Instrument | null {
    const key = `${exchange}:${symbol}`;
    return this.instrumentsCache.get(key) || null;
  }

  /**
   * Get multiple instrument tokens
   */
  getInstrumentTokens(symbols: string[], exchange: string = 'NSE'): SymbolMapping[] {
    const mappings: SymbolMapping[] = [];

    for (const symbol of symbols) {
      const token = this.getInstrumentToken(symbol, exchange);
      if (token) {
        mappings.push({
          symbol,
          instrumentToken: token,
          exchange,
          name: this.getInstrument(symbol, exchange)?.name || symbol,
        });
      } else {
        console.warn(`⚠️  Instrument token not found for ${exchange}:${symbol}`);
      }
    }

    return mappings;
  }

  /**
   * Search instruments by keyword
   */
  searchInstruments(keyword: string, limit: number = 10): Instrument[] {
    const results: Instrument[] = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const instrument of this.instrumentsCache.values()) {
      if (
        instrument.tradingsymbol.toLowerCase().includes(lowerKeyword) ||
        instrument.name.toLowerCase().includes(lowerKeyword)
      ) {
        results.push(instrument);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Check if instruments are cached
   */
  isCached(): boolean {
    return this.instrumentsCache.size > 0;
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      cachedInstruments: this.instrumentsCache.size,
      lastFetchTime: this.lastFetchTime,
      cacheValid: this.lastFetchTime &&
        (Date.now() - this.lastFetchTime.getTime()) < this.cacheDuration,
    };
  }
}

// Export singleton instance
export const instrumentService = new InstrumentService();
