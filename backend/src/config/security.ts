/**
 * Security Configuration for AlgoGainz API
 * Comprehensive security settings for production deployment
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Environment variables
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Helmet Security Configuration
 * Configures security headers for the application
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for MUI
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || '*'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Strict-Transport-Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },
  // X-Content-Type-Options
  noSniff: true,
  // X-XSS-Protection
  xssFilter: true,
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },
});

/**
 * CORS Configuration
 * Configures Cross-Origin Resource Sharing
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : isDevelopment
      ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
      : [];

    // In production, only allow specified origins
    if (isProduction && !allowedOrigins.includes(origin)) {
      return callback(new Error('CORS policy violation'), false);
    }

    // In development, allow all origins or check whitelist
    if (isDevelopment || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy violation'), false);
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

/**
 * Rate Limiting Configuration
 * Prevents abuse and DDoS attacks
 */

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
    },
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        retryAfter: 60, // seconds
      },
    });
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts from this IP',
        retryAfter: 900, // 15 minutes in seconds
      },
    });
  },
});

// Rate limiter for order placement
export const tradingLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 orders per second (Kite API limit)
  message: {
    success: false,
    error: {
      code: 'TRADING_RATE_LIMIT_EXCEEDED',
      message: 'Too many order requests, please slow down',
    },
  },
  skipFailedRequests: true,
});

// Rate limiter for reports generation
export const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 reports per minute
  message: {
    success: false,
    error: {
      code: 'REPORT_RATE_LIMIT_EXCEEDED',
      message: 'Too many report generation requests',
    },
  },
});

/**
 * Request Size Limits
 * Prevents large payload attacks
 */
export const requestSizeLimits = {
  json: '10kb', // JSON payload limit
  urlencoded: '10kb', // URL-encoded payload limit
};

/**
 * Trusted Proxy Configuration
 * For apps behind reverse proxies (Nginx, Cloudflare, etc.)
 */
export const trustProxy = isProduction ? 1 : false;

/**
 * Security Headers
 * Additional custom security headers
 */
export const securityHeaders = (req: any, res: any, next: any) => {
  // Remove X-Powered-By header (already done by helmet, but just in case)
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.id || Math.random().toString(36).substring(7));

  // Prevent MIME type sniffing
  res.setHeader('X-Download-Options', 'noopen');

  // Prevent clickjacking
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  next();
};

/**
 * Input Sanitization
 * Prevent XSS and injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * SQL Injection Prevention
 * Note: Prisma already protects against SQL injection, but this is an additional layer
 */
export const validateStockSymbol = (symbol: string): boolean => {
  // Only allow alphanumeric characters and hyphens (valid NSE symbols)
  const symbolRegex = /^[A-Z0-9-]+$/;
  return symbolRegex.test(symbol);
};

/**
 * Environment Variables Validation
 * Ensures critical environment variables are set in production
 */
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'KITE_API_KEY',
    'KITE_API_SECRET',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (isProduction && missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingVars.join(', ')}`
    );
  }

  if (isDevelopment && missingVars.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  Warning: JWT_SECRET should be at least 32 characters long');
  }
};

/**
 * Audit Logger
 * Log sensitive operations for security auditing
 */
export const auditLog = (
  userId: string,
  action: string,
  resource: string,
  details?: any
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action, // CREATE, READ, UPDATE, DELETE
    resource, // ORDER, TRANSACTION, HOLDING, etc.
    details: details || {},
    environment: process.env.NODE_ENV,
  };

  // In production, send to logging service (e.g., CloudWatch, Datadog)
  if (isProduction) {
    // TODO: Implement production logging service
    console.log('[AUDIT]', JSON.stringify(logEntry));
  } else {
    console.log('[AUDIT]', logEntry);
  }
};

/**
 * Error Response Sanitizer
 * Prevents sensitive information leakage in error messages
 */
export const sanitizeErrorResponse = (error: any) => {
  if (isDevelopment) {
    return {
      message: error.message,
      stack: error.stack,
      details: error,
    };
  }

  // In production, don't expose internal error details
  return {
    message: 'An error occurred',
    // Don't send stack traces or internal details
  };
};
