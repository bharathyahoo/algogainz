import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import security configuration
import {
  helmetConfig,
  corsOptions,
  apiLimiter,
  authLimiter,
  tradingLimiter,
  reportLimiter,
  requestSizeLimits,
  trustProxy,
  securityHeaders,
  validateEnvironment,
  sanitizeErrorResponse,
} from './config/security';

// Validate environment variables
validateEnvironment();

// Import AI configuration
import { validateAIConfig } from './config/ai';

// Validate AI configuration
validateAIConfig();

// Import WebSocket server
import { wsServer } from './websocket/server';
import { getCurrentMarketStatus, scheduleMarketStatusCheck } from './utils/marketHours';

// Import routes
import authRoutes from './routes/auth';
import watchlistRoutes from './routes/watchlist';
import instrumentsRoutes from './routes/instruments';
import analysisRoutes from './routes/analysis';
import tradingRoutes from './routes/trading';
import transactionsRoutes from './routes/transactions';
import holdingsRoutes from './routes/holdings';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import aiRoutes from './routes/ai';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for WebSocket support
const httpServer = createServer(app);

// Trust proxy (for apps behind reverse proxies like Nginx, Cloudflare)
app.set('trust proxy', trustProxy);

// Security Middleware
app.use(helmetConfig); // Security headers (CSP, HSTS, etc.)
app.use(cors(corsOptions)); // CORS with whitelist
app.use(compression()); // Compress responses
app.use(securityHeaders); // Custom security headers

// Body parsing middleware with size limits
app.use(express.json({ limit: requestSizeLimits.json }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimits.urlencoded }));

// General API rate limiting
app.use('/api/', apiLimiter);

// Health check endpoint (no auth required)
app.get('/health', (req: Request, res: Response) => {
  const marketStatus = getCurrentMarketStatus();
  const wsStats = wsServer.getStats();

  res.status(200).json({
    status: 'OK',
    message: 'AlgoGainz API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    marketStatus: {
      status: marketStatus.status,
      message: marketStatus.message,
    },
    websocket: {
      enabled: true,
      connectedClients: wsStats.connectedClients,
      subscribedSymbols: wsStats.subscribedSymbols,
    },
  });
});

// API routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes); // Strict rate limit for auth
app.use('/api/trading', tradingLimiter, tradingRoutes); // Trading-specific rate limit
app.use('/api/reports', reportLimiter, reportsRoutes); // Report generation rate limit
app.use('/api/ai', aiRoutes); // AI-powered features
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/instruments', instrumentsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/holdings', holdingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.path,
    },
  });
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error for debugging
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send sanitized error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        details: sanitizeErrorResponse(err),
      }),
    },
  });
});

// Initialize WebSocket server
if (process.env.NODE_ENV !== 'test') {
  wsServer.initialize(httpServer);

  // Schedule market status monitoring
  scheduleMarketStatusCheck((status) => {
    console.log(`📊 Market status changed to: ${status}`);
    wsServer.broadcastMarketStatus(status);
  });

  // Broadcast initial market status
  const initialMarketStatus = getCurrentMarketStatus();
  wsServer.broadcastMarketStatus(initialMarketStatus.status);
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    const marketStatus = getCurrentMarketStatus();

    console.log('🚀 AlgoGainz API Server Started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Port: ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔒 Security: Helmet, CORS, Rate Limiting ✓`);
    console.log(`📦 Compression: Enabled ✓`);
    console.log(`⚡ WebSocket: Enabled ✓`);
    console.log(`📈 Market Status: ${marketStatus.status} - ${marketStatus.message}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}

export default app;
