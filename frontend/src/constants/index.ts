/**
 * Application-wide constants for AlgoGainz
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Market Hours (IST)
export const MARKET_HOURS = {
  PRE_MARKET_START: { hour: 9, minute: 0 },
  PRE_MARKET_END: { hour: 9, minute: 15 },
  MARKET_OPEN: { hour: 9, minute: 15 },
  MARKET_CLOSE: { hour: 15, minute: 30 },
  POST_MARKET_START: { hour: 15, minute: 40 },
  POST_MARKET_END: { hour: 16, minute: 0 },
} as const;

// Trading Configuration
export const TRADING_CONFIG = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 10000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 1000000,
  PRICE_TICK_SIZE: 0.05, // Minimum price movement
  LOT_SIZE: 1, // Default lot size
} as const;

// Order Types
export const ORDER_TYPES = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

// Transaction Sources
export const TRANSACTION_SOURCES = {
  APP_EXECUTED: 'APP_EXECUTED',
  MANUALLY_RECORDED: 'MANUALLY_RECORDED',
} as const;

// Product Types
export const PRODUCT_TYPES = {
  CNC: 'CNC', // Cash and Carry (delivery)
  MIS: 'MIS', // Margin Intraday Square-off
  NRML: 'NRML', // Normal (F&O)
} as const;

// Exchanges
export const EXCHANGES = {
  NSE: 'NSE',
  BSE: 'BSE',
} as const;

// Signal Types
export const SIGNAL_TYPES = {
  STRONG_BUY: 'STRONG_BUY',
  BUY: 'BUY',
  HOLD: 'HOLD',
  SELL: 'SELL',
  STRONG_SELL: 'STRONG_SELL',
} as const;

// Signal Colors
export const SIGNAL_COLORS = {
  STRONG_BUY: '#1B5E20', // Dark green
  BUY: '#4CAF50', // Green
  HOLD: '#FFC107', // Amber
  SELL: '#F44336', // Red
  STRONG_SELL: '#B71C1C', // Dark red
} as const;

// Alert Types
export const ALERT_TYPES = {
  PROFIT_TARGET: 'PROFIT_TARGET',
  STOP_LOSS: 'STOP_LOSS',
} as const;

// Chart Time Periods
export const CHART_PERIODS = {
  ONE_WEEK: '1W',
  ONE_MONTH: '1M',
  THREE_MONTHS: '3M',
  SIX_MONTHS: '6M',
  ONE_YEAR: '1Y',
  ALL: 'ALL',
} as const;

// Chart Period Labels
export const CHART_PERIOD_LABELS = {
  '1W': '1 Week',
  '1M': '1 Month',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year',
  ALL: 'All Time',
} as const;

// Candlestick Intervals
export const CANDLE_INTERVALS = {
  MINUTE: 'minute',
  MINUTE_3: '3minute',
  MINUTE_5: '5minute',
  MINUTE_10: '10minute',
  MINUTE_15: '15minute',
  MINUTE_30: '30minute',
  HOUR: '60minute',
  DAY: 'day',
} as const;

// Technical Indicator Defaults
export const INDICATOR_DEFAULTS = {
  RSI_PERIOD: 14,
  RSI_OVERSOLD: 30,
  RSI_OVERBOUGHT: 70,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  SMA_PERIOD: 50,
  EMA_PERIOD: 20,
  BB_PERIOD: 20,
  BB_STD_DEV: 2,
} as const;

// Default Charges (in %)
export const DEFAULT_CHARGES = {
  BROKERAGE_PCT: 0.03, // 0.03% or ₹20 per order (whichever is lower)
  MAX_BROKERAGE: 20, // ₹20 maximum
  EXCHANGE_CHARGES_PCT: 0.00325, // NSE: 0.00325%
  GST_PCT: 18, // 18% on brokerage + exchange charges
  SEBI_CHARGES_PCT: 0.0001, // ₹10 per crore
  STAMP_DUTY_BUY_PCT: 0.015, // 0.015% on buy side
  STAMP_DUTY_SELL_PCT: 0.00025, // 0.00025% on sell side
} as const;

// Exit Strategy Defaults
export const EXIT_STRATEGY_DEFAULTS = {
  MIN_PROFIT_TARGET_PCT: 0.1,
  MAX_PROFIT_TARGET_PCT: 1000,
  DEFAULT_PROFIT_TARGET_PCT: 10,
  MIN_STOP_LOSS_PCT: 0.1,
  MAX_STOP_LOSS_PCT: 100,
  DEFAULT_STOP_LOSS_PCT: 5,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PRICE_UPDATE: 'priceUpdate',
  ALERT: 'alert',
  MARKET_STATUS: 'marketStatus',
  ERROR: 'error',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'algogainz_auth_token',
  USER_DATA: 'algogainz_user_data',
  THEME_MODE: 'algogainz_theme_mode',
  NOTIFICATION_PERMISSION: 'algogainz_notification_permission',
  DISMISSED_ALERTS: 'algogainz_dismissed_alerts',
  SOUND_ENABLED: 'algogainz_sound_enabled',
  CHART_PERIOD: 'algogainz_chart_period',
  WATCHLIST_VIEW: 'algogainz_watchlist_view',
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'DD-MM-YYYY',
  LONG: 'DD MMMM YYYY',
  TIME: 'HH:MM AM/PM',
  DATETIME: 'DD-MM-YYYY HH:MM AM/PM',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
} as const;

// Currency Format
export const CURRENCY_FORMAT = {
  SYMBOL: '₹',
  LOCALE: 'en-IN',
  DECIMALS: 2,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/jpg'],
} as const;

// Notification Settings
export const NOTIFICATION_SETTINGS = {
  DURATION: 5000, // 5 seconds
  MAX_STACK: 3,
  SOUND_FILE: '/sounds/notification.mp3',
} as const;

// Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  PRICE_UPDATE: 1000, // 1 second (during market hours)
  TECHNICAL_ANALYSIS: 15 * 60 * 1000, // 15 minutes
  DASHBOARD_METRICS: 60 * 1000, // 1 minute
  HOLDINGS: 60 * 1000, // 1 minute
  ALERT_CHECK: 30 * 1000, // 30 seconds
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  API_CALLS_PER_MINUTE: 60,
  KITE_ORDERS_PER_SECOND: 10,
  KITE_QUOTES_PER_SECOND: 10,
  KITE_HISTORICAL_PER_SECOND: 3,
} as const;

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#1976d2',
  SUCCESS: '#4caf50',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  INFO: '#2196f3',
  PROFIT: '#4caf50',
  LOSS: '#f44336',
  GRID: '#e0e0e0',
  AXIS: '#757575',
} as const;

// Breakpoints (MUI default)
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
} as const;

// App Info
export const APP_INFO = {
  NAME: 'AlgoGainz',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart Trading Assistant for Zerodha Kite',
  AUTHOR: 'AlgoGainz Team',
  SUPPORT_EMAIL: 'support@algogainz.com',
} as const;

// External Links
export const EXTERNAL_LINKS = {
  KITE_LOGIN: 'https://kite.zerodha.com/connect/login',
  KITE_DOCS: 'https://kite.trade/docs/connect/v3/',
  ZERODHA_SUPPORT: 'https://support.zerodha.com/',
  GITHUB: 'https://github.com/yourusername/algogainz',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  SESSION_EXPIRED: 'Session expired. Please login again.',
  INVALID_INPUT: 'Invalid input. Please check your data.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',
  PERMISSION_DENIED: 'Permission denied.',
  MARKET_CLOSED: 'Market is closed. Trading is not available.',
  INSUFFICIENT_MARGIN: 'Insufficient funds to place order.',
  INVALID_QUANTITY: 'Invalid quantity. Please check your input.',
  INVALID_PRICE: 'Invalid price. Please check your input.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Order placed successfully!',
  ORDER_CANCELLED: 'Order cancelled successfully!',
  TRANSACTION_RECORDED: 'Transaction recorded successfully!',
  EXIT_STRATEGY_SAVED: 'Exit strategy saved successfully!',
  WATCHLIST_UPDATED: 'Watchlist updated successfully!',
  REPORT_GENERATED: 'Report generated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  STOCK_SYMBOL: /^[A-Z0-9&-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  INDIAN_PHONE: /^(\+91)?[6-9]\d{9}$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
} as const;

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  AI_ASSISTANT: true,
  BACKTESTING: false, // Coming soon!
  SOCIAL_TRADING: false,
  OPTIONS_TRADING: false,
  ALGO_TRADING: false,
} as const;
