/**
 * Kite Binary Data Parser
 * Parses binary tick data from Kite WebSocket
 * Based on: https://kite.trade/docs/connect/v3/websocket/
 */

export interface KiteTick {
  mode: 'ltp' | 'quote' | 'full';
  instrument_token: number;
  is_tradable: boolean;

  // LTP mode (8 bytes)
  last_price?: number;

  // Quote mode (44 bytes) - includes LTP
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  change?: number;

  // Full mode (184 bytes) - includes Quote
  last_traded_quantity?: number;
  average_traded_price?: number;
  volume_traded?: number;
  total_buy_quantity?: number;
  total_sell_quantity?: number;

  timestamp?: Date;
}

/**
 * Parse binary tick data from Kite WebSocket
 */
export function parseBinary(buffer: Buffer): KiteTick[] {
  const ticks: KiteTick[] = [];

  // Check if buffer is empty
  if (!buffer || buffer.length === 0) {
    return ticks;
  }

  try {
    // First 2 bytes indicate number of packets
    const numberOfPackets = buffer.readUInt16BE(0);
    let offset = 2;

    for (let i = 0; i < numberOfPackets; i++) {
      // Next 2 bytes indicate length of packet
      const packetLength = buffer.readUInt16BE(offset);
      offset += 2;

      if (offset + packetLength > buffer.length) {
        console.error('Invalid packet length, buffer overflow');
        break;
      }

      // Parse the packet based on its length
      const packet = buffer.slice(offset, offset + packetLength);
      const tick = parsePacket(packet, packetLength);

      if (tick) {
        ticks.push(tick);
      }

      offset += packetLength;
    }
  } catch (error) {
    console.error('Error parsing binary data:', error);
  }

  return ticks;
}

/**
 * Parse individual packet based on packet length
 */
function parsePacket(packet: Buffer, length: number): KiteTick | null {
  try {
    // Instrument token (first 4 bytes, always present)
    const instrumentToken = packet.readUInt32BE(0);

    // Determine mode based on packet length
    // LTP: 8 bytes, Quote: 44 bytes, Full: 184 bytes
    if (length === 8) {
      return parseLTP(packet, instrumentToken);
    } else if (length === 44) {
      return parseQuote(packet, instrumentToken);
    } else if (length === 184) {
      return parseFull(packet, instrumentToken);
    } else {
      console.warn(`Unknown packet length: ${length}`);
      return null;
    }
  } catch (error) {
    console.error('Error parsing packet:', error);
    return null;
  }
}

/**
 * Parse LTP mode (8 bytes)
 * Contains: instrument_token, last_price
 */
function parseLTP(packet: Buffer, instrumentToken: number): KiteTick {
  const lastPrice = packet.readUInt32BE(4) / 100; // Price is in paise, divide by 100

  return {
    mode: 'ltp',
    instrument_token: instrumentToken,
    is_tradable: true,
    last_price: lastPrice,
  };
}

/**
 * Parse Quote mode (44 bytes)
 * Contains: LTP + OHLC + change
 */
function parseQuote(packet: Buffer, instrumentToken: number): KiteTick {
  const lastPrice = packet.readUInt32BE(4) / 100;
  const ohlc = {
    open: packet.readUInt32BE(8) / 100,
    high: packet.readUInt32BE(12) / 100,
    low: packet.readUInt32BE(16) / 100,
    close: packet.readUInt32BE(20) / 100,
  };
  const change = packet.readUInt32BE(24);

  return {
    mode: 'quote',
    instrument_token: instrumentToken,
    is_tradable: true,
    last_price: lastPrice,
    ohlc,
    change,
  };
}

/**
 * Parse Full mode (184 bytes)
 * Contains: Quote + volume + quantities + more
 */
function parseFull(packet: Buffer, instrumentToken: number): KiteTick {
  const lastPrice = packet.readUInt32BE(4) / 100;
  const lastTradedQuantity = packet.readUInt32BE(8);
  const averageTradedPrice = packet.readUInt32BE(12) / 100;
  const volumeTraded = packet.readUInt32BE(16);
  const totalBuyQuantity = packet.readUInt32BE(20);
  const totalSellQuantity = packet.readUInt32BE(24);

  const ohlc = {
    open: packet.readUInt32BE(28) / 100,
    high: packet.readUInt32BE(32) / 100,
    low: packet.readUInt32BE(36) / 100,
    close: packet.readUInt32BE(40) / 100,
  };

  const change = packet.readInt32BE(44);

  // Timestamp (8 bytes at offset 60-67)
  const timestampSeconds = packet.readUInt32BE(60);
  const timestamp = new Date(timestampSeconds * 1000);

  return {
    mode: 'full',
    instrument_token: instrumentToken,
    is_tradable: true,
    last_price: lastPrice,
    last_traded_quantity: lastTradedQuantity,
    average_traded_price: averageTradedPrice,
    volume_traded: volumeTraded,
    total_buy_quantity: totalBuyQuantity,
    total_sell_quantity: totalSellQuantity,
    ohlc,
    change,
    timestamp,
  };
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(tick: KiteTick): number {
  if (!tick.last_price || !tick.ohlc?.close || tick.ohlc.close === 0) {
    return 0;
  }

  return ((tick.last_price - tick.ohlc.close) / tick.ohlc.close) * 100;
}
