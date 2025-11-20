/**
 * Utility functions for input validation in AlgoGainz
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate stock symbol format
 * @param symbol - Stock symbol to validate
 * @returns Validation result
 */
export const validateStockSymbol = (symbol: string): ValidationResult => {
  if (!symbol || symbol.trim().length === 0) {
    return { isValid: false, error: 'Stock symbol is required' };
  }

  // Stock symbols are typically uppercase alphanumeric with optional hyphens
  const symbolRegex = /^[A-Z0-9&-]+$/;
  if (!symbolRegex.test(symbol)) {
    return {
      isValid: false,
      error: 'Stock symbol must contain only uppercase letters, numbers, and hyphens',
    };
  }

  if (symbol.length > 20) {
    return { isValid: false, error: 'Stock symbol cannot exceed 20 characters' };
  }

  return { isValid: true };
};

/**
 * Validate quantity
 * @param quantity - Quantity value
 * @param min - Minimum allowed quantity (default: 1)
 * @param max - Maximum allowed quantity (optional)
 * @returns Validation result
 */
export const validateQuantity = (
  quantity: number | string,
  min: number = 1,
  max?: number
): ValidationResult => {
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;

  if (isNaN(qty)) {
    return { isValid: false, error: 'Quantity must be a valid number' };
  }

  if (qty < min) {
    return { isValid: false, error: `Quantity must be at least ${min}` };
  }

  if (max !== undefined && qty > max) {
    return { isValid: false, error: `Quantity cannot exceed ${max}` };
  }

  // Ensure it's a whole number for share quantities
  if (!Number.isInteger(qty)) {
    return { isValid: false, error: 'Quantity must be a whole number' };
  }

  return { isValid: true };
};

/**
 * Validate price
 * @param price - Price value
 * @param min - Minimum allowed price (default: 0.01)
 * @param max - Maximum allowed price (optional)
 * @returns Validation result
 */
export const validatePrice = (
  price: number | string,
  min: number = 0.01,
  max?: number
): ValidationResult => {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(priceNum)) {
    return { isValid: false, error: 'Price must be a valid number' };
  }

  if (priceNum < min) {
    return { isValid: false, error: `Price must be at least ₹${min}` };
  }

  if (max !== undefined && priceNum > max) {
    return { isValid: false, error: `Price cannot exceed ₹${max}` };
  }

  // Ensure max 2 decimal places
  if (!isValidDecimalPlaces(priceNum, 2)) {
    return { isValid: false, error: 'Price can have maximum 2 decimal places' };
  }

  return { isValid: true };
};

/**
 * Validate percentage
 * @param percent - Percentage value
 * @param min - Minimum percentage (default: 0)
 * @param max - Maximum percentage (default: 100)
 * @returns Validation result
 */
export const validatePercentage = (
  percent: number | string,
  min: number = 0,
  max: number = 100
): ValidationResult => {
  const pct = typeof percent === 'string' ? parseFloat(percent) : percent;

  if (isNaN(pct)) {
    return { isValid: false, error: 'Percentage must be a valid number' };
  }

  if (pct < min) {
    return { isValid: false, error: `Percentage must be at least ${min}%` };
  }

  if (pct > max) {
    return { isValid: false, error: `Percentage cannot exceed ${max}%` };
  }

  return { isValid: true };
};

/**
 * Validate date
 * @param date - Date value (string or Date object)
 * @param allowFuture - Whether to allow future dates (default: false)
 * @returns Validation result
 */
export const validateDate = (
  date: string | Date,
  allowFuture: boolean = false
): ValidationResult => {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (!allowFuture && dateObj > new Date()) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }

  // Don't allow dates too far in the past (e.g., before 1990)
  const minDate = new Date('1990-01-01');
  if (dateObj < minDate) {
    return { isValid: false, error: 'Date is too far in the past' };
  }

  return { isValid: true };
};

/**
 * Validate email address
 * @param email - Email address
 * @returns Validation result
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
};

/**
 * Validate phone number (Indian format)
 * @param phone - Phone number
 * @returns Validation result
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Indian phone numbers: 10 digits, optionally starting with +91
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Invalid Indian phone number format' };
  }

  return { isValid: true };
};

/**
 * Validate required field
 * @param value - Field value
 * @param fieldName - Name of the field
 * @returns Validation result
 */
export const validateRequired = (value: any, fieldName: string = 'Field'): ValidationResult => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  return { isValid: true };
};

/**
 * Validate string length
 * @param value - String value
 * @param min - Minimum length
 * @param max - Maximum length
 * @param fieldName - Name of the field
 * @returns Validation result
 */
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): ValidationResult => {
  if (value.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (value.length > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }

  return { isValid: true };
};

/**
 * Validate order type
 * @param orderType - Order type
 * @returns Validation result
 */
export const validateOrderType = (orderType: string): ValidationResult => {
  const validTypes = ['MARKET', 'LIMIT'];

  if (!validTypes.includes(orderType)) {
    return { isValid: false, error: 'Order type must be either MARKET or LIMIT' };
  }

  return { isValid: true };
};

/**
 * Validate transaction type
 * @param type - Transaction type
 * @returns Validation result
 */
export const validateTransactionType = (type: string): ValidationResult => {
  const validTypes = ['BUY', 'SELL'];

  if (!validTypes.includes(type)) {
    return { isValid: false, error: 'Transaction type must be either BUY or SELL' };
  }

  return { isValid: true };
};

/**
 * Validate exchange
 * @param exchange - Exchange name
 * @returns Validation result
 */
export const validateExchange = (exchange: string): ValidationResult => {
  const validExchanges = ['NSE', 'BSE'];

  if (!validExchanges.includes(exchange)) {
    return { isValid: false, error: 'Exchange must be either NSE or BSE' };
  }

  return { isValid: true };
};

/**
 * Validate limit price for limit orders
 * @param orderType - Order type
 * @param limitPrice - Limit price (if limit order)
 * @param currentPrice - Current market price (optional, for range validation)
 * @returns Validation result
 */
export const validateLimitPrice = (
  orderType: string,
  limitPrice: number | undefined,
  currentPrice?: number
): ValidationResult => {
  if (orderType === 'LIMIT') {
    if (!limitPrice || limitPrice <= 0) {
      return { isValid: false, error: 'Limit price is required for limit orders' };
    }

    const priceValidation = validatePrice(limitPrice);
    if (!priceValidation.isValid) {
      return priceValidation;
    }

    // Optional: Warn if limit price is too far from current price
    if (currentPrice) {
      const diff = Math.abs(limitPrice - currentPrice);
      const diffPercent = (diff / currentPrice) * 100;

      if (diffPercent > 10) {
        return {
          isValid: false,
          error: 'Limit price is more than 10% away from current market price',
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Validate charges object
 * @param charges - Transaction charges
 * @returns Validation result
 */
export const validateCharges = (charges: {
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
}): ValidationResult => {
  const requiredFields = ['brokerage', 'exchangeCharges', 'gst', 'sebiCharges', 'stampDuty'];

  for (const field of requiredFields) {
    const value = charges[field as keyof typeof charges];

    if (value === undefined || value === null) {
      return { isValid: false, error: `${field} is required` };
    }

    if (typeof value !== 'number' || value < 0) {
      return { isValid: false, error: `${field} must be a non-negative number` };
    }
  }

  return { isValid: true };
};

/**
 * Validate exit strategy
 * @param profitTargetPct - Profit target percentage
 * @param stopLossPct - Stop loss percentage
 * @returns Validation result
 */
export const validateExitStrategy = (
  profitTargetPct?: number,
  stopLossPct?: number
): ValidationResult => {
  // At least one must be provided
  if (!profitTargetPct && !stopLossPct) {
    return {
      isValid: false,
      error: 'At least one of profit target or stop loss must be provided',
    };
  }

  if (profitTargetPct !== undefined) {
    const profitValidation = validatePercentage(profitTargetPct, 0.1, 1000);
    if (!profitValidation.isValid) {
      return { isValid: false, error: `Profit target: ${profitValidation.error}` };
    }
  }

  if (stopLossPct !== undefined) {
    const stopLossValidation = validatePercentage(stopLossPct, 0.1, 100);
    if (!stopLossValidation.isValid) {
      return { isValid: false, error: `Stop loss: ${stopLossValidation.error}` };
    }
  }

  return { isValid: true };
};

/**
 * Check if value has valid decimal places
 * @param value - Number to check
 * @param maxDecimals - Maximum decimal places allowed
 * @returns True if valid
 */
const isValidDecimalPlaces = (value: number, maxDecimals: number): boolean => {
  const decimalPart = value.toString().split('.')[1];
  return !decimalPart || decimalPart.length <= maxDecimals;
};

/**
 * Sanitize input string (remove potentially harmful characters)
 * @param input - Input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/script/gi, '') // Remove 'script' (case-insensitive)
    .slice(0, 1000); // Limit length
};

/**
 * Validate positive number
 * @param value - Number to validate
 * @param fieldName - Field name for error message
 * @returns Validation result
 */
export const validatePositiveNumber = (
  value: number | string,
  fieldName: string = 'Value'
): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (num <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than 0` };
  }

  return { isValid: true };
};

/**
 * Batch validation - validate multiple fields at once
 * @param validations - Array of validation functions
 * @returns First error encountered, or null if all valid
 */
export const validateBatch = (
  validations: Array<() => ValidationResult>
): ValidationResult | null => {
  for (const validate of validations) {
    const result = validate();
    if (!result.isValid) {
      return result;
    }
  }
  return null;
};
