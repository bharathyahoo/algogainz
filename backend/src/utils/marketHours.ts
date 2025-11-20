/**
 * Market Hours Utilities
 * Check NSE/BSE market status and trading hours
 */

export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET';

export interface MarketHours {
  status: MarketStatus;
  nextChange: Date;
  message: string;
}

/**
 * NSE/BSE Market Hours (IST)
 * Pre-market: 9:00 AM - 9:15 AM
 * Regular: 9:15 AM - 3:30 PM
 * Post-market: 3:40 PM - 4:00 PM
 */
const MARKET_HOURS = {
  PRE_MARKET_START: { hour: 9, minute: 0 },
  MARKET_OPEN: { hour: 9, minute: 15 },
  MARKET_CLOSE: { hour: 15, minute: 30 },
  POST_MARKET_START: { hour: 15, minute: 40 },
  POST_MARKET_END: { hour: 16, minute: 0 },
};

/**
 * Check if given date is a weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if given date is a market holiday
 * TODO: Implement actual holiday calendar
 */
function isMarketHoliday(date: Date): boolean {
  // TODO: Fetch from Kite API or maintain holiday calendar
  // For now, return false
  return false;
}

/**
 * Get current market status
 */
export function getCurrentMarketStatus(): MarketHours {
  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() + istOffset);

  const currentHour = istTime.getUTCHours();
  const currentMinute = istTime.getUTCMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Check if weekend or holiday
  if (isWeekend(istTime)) {
    const nextMonday = getNextMonday(istTime);
    return {
      status: 'CLOSED',
      nextChange: nextMonday,
      message: 'Market closed for the weekend',
    };
  }

  if (isMarketHoliday(istTime)) {
    const nextTradingDay = getNextTradingDay(istTime);
    return {
      status: 'CLOSED',
      nextChange: nextTradingDay,
      message: 'Market closed for holiday',
    };
  }

  // Calculate time markers in minutes
  const preMarketStart = MARKET_HOURS.PRE_MARKET_START.hour * 60 + MARKET_HOURS.PRE_MARKET_START.minute;
  const marketOpen = MARKET_HOURS.MARKET_OPEN.hour * 60 + MARKET_HOURS.MARKET_OPEN.minute;
  const marketClose = MARKET_HOURS.MARKET_CLOSE.hour * 60 + MARKET_HOURS.MARKET_CLOSE.minute;
  const postMarketStart = MARKET_HOURS.POST_MARKET_START.hour * 60 + MARKET_HOURS.POST_MARKET_START.minute;
  const postMarketEnd = MARKET_HOURS.POST_MARKET_END.hour * 60 + MARKET_HOURS.POST_MARKET_END.minute;

  // Determine status based on current time
  if (currentTimeInMinutes < preMarketStart) {
    // Before pre-market
    return {
      status: 'CLOSED',
      nextChange: getTodayAt(MARKET_HOURS.PRE_MARKET_START.hour, MARKET_HOURS.PRE_MARKET_START.minute),
      message: 'Market closed - Opens at 9:00 AM',
    };
  } else if (currentTimeInMinutes < marketOpen) {
    // Pre-market session
    return {
      status: 'PRE_MARKET',
      nextChange: getTodayAt(MARKET_HOURS.MARKET_OPEN.hour, MARKET_HOURS.MARKET_OPEN.minute),
      message: 'Pre-market session - Opens at 9:15 AM',
    };
  } else if (currentTimeInMinutes < marketClose) {
    // Regular trading hours
    return {
      status: 'OPEN',
      nextChange: getTodayAt(MARKET_HOURS.MARKET_CLOSE.hour, MARKET_HOURS.MARKET_CLOSE.minute),
      message: 'Market is open',
    };
  } else if (currentTimeInMinutes < postMarketStart) {
    // Between regular close and post-market
    return {
      status: 'CLOSED',
      nextChange: getTodayAt(MARKET_HOURS.POST_MARKET_START.hour, MARKET_HOURS.POST_MARKET_START.minute),
      message: 'Market closed - Post-market at 3:40 PM',
    };
  } else if (currentTimeInMinutes < postMarketEnd) {
    // Post-market session
    return {
      status: 'POST_MARKET',
      nextChange: getTodayAt(MARKET_HOURS.POST_MARKET_END.hour, MARKET_HOURS.POST_MARKET_END.minute),
      message: 'Post-market session - Closes at 4:00 PM',
    };
  } else {
    // After post-market
    const nextDay = getNextTradingDay(istTime);
    return {
      status: 'CLOSED',
      nextChange: nextDay,
      message: 'Market closed - Opens tomorrow at 9:15 AM',
    };
  }
}

/**
 * Check if market is currently open for trading
 */
export function isMarketOpen(): boolean {
  const status = getCurrentMarketStatus();
  return status.status === 'OPEN';
}

/**
 * Get time until market opens
 */
export function getTimeUntilMarketOpen(): number {
  const status = getCurrentMarketStatus();
  if (status.status === 'OPEN') return 0;

  return status.nextChange.getTime() - Date.now();
}

/**
 * Helper: Get date for today at specific hour and minute (IST)
 */
function getTodayAt(hour: number, minute: number): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  istTime.setUTCHours(hour, minute, 0, 0);
  return new Date(istTime.getTime() - istOffset); // Convert back to local time
}

/**
 * Helper: Get next Monday
 */
function getNextMonday(date: Date): Date {
  const result = new Date(date);
  const daysUntilMonday = (8 - result.getDay()) % 7 || 7;
  result.setDate(result.getDate() + daysUntilMonday);
  result.setHours(9, 15, 0, 0); // Market opens at 9:15 AM
  return result;
}

/**
 * Helper: Get next trading day
 */
function getNextTradingDay(date: Date): Date {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(9, 15, 0, 0);

  // Skip weekends and holidays
  while (isWeekend(nextDay) || isMarketHoliday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * Schedule callback to run when market status changes
 */
export function scheduleMarketStatusCheck(callback: (status: MarketStatus) => void): NodeJS.Timeout {
  let lastStatus = getCurrentMarketStatus().status;

  const interval = setInterval(() => {
    const currentStatus = getCurrentMarketStatus().status;
    if (currentStatus !== lastStatus) {
      lastStatus = currentStatus;
      callback(currentStatus);
    }
  }, 60000); // Check every minute

  return interval;
}
