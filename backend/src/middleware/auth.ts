import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request to include user data
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    userName: string;
    email: string;
    kiteAccessToken: string;
  };
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user data to request
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided'
        }
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'JWT configuration error'
        }
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      userName: decoded.userName,
      email: decoded.email,
      kiteAccessToken: decoded.kiteAccessToken
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        }
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error occurred'
      }
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user data if token is present, but doesn't fail if missing
 */
export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user data
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    req.user = {
      userId: decoded.userId,
      userName: decoded.userName,
      email: decoded.email,
      kiteAccessToken: decoded.kiteAccessToken
    };

    next();
  } catch (error) {
    // Token invalid, but we don't fail - just continue without user
    next();
  }
};

/**
 * Kite Token Expiry Middleware
 * Checks if the Kite access token is still valid (not expired)
 *
 * Kite access tokens expire after 24 hours. This middleware:
 * 1. Checks the database for token expiry time
 * 2. Returns error if expired (user must re-authenticate)
 * 3. Allows request to proceed if token is still valid
 *
 * Use this middleware AFTER authMiddleware on routes that need Kite API access
 *
 * @example
 * router.post('/orders', authMiddleware, ensureValidKiteToken, placeOrder);
 */
export const ensureValidKiteToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    // Get user from database with token expiry info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accessToken: true,
        tokenExpiry: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Check if Kite access token exists
    if (!user.accessToken || !user.tokenExpiry) {
      res.status(401).json({
        success: false,
        error: {
          code: 'KITE_TOKEN_MISSING',
          message: 'Please reconnect to Zerodha. No active Kite session found.'
        }
      });
      return;
    }

    // Check if token is expired
    const now = new Date();
    if (now > user.tokenExpiry) {
      // Clear expired token from database
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: null,
          tokenExpiry: null
        }
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'KITE_TOKEN_EXPIRED',
          message: 'Your Zerodha session has expired (tokens valid for 24 hours). Please reconnect to continue.'
        }
      });
      return;
    }

    // Token is valid - update req.user with fresh token from DB
    if (req.user) {
      req.user.kiteAccessToken = user.accessToken;
    }
    next();
  } catch (error: any) {
    console.error('Kite token validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_VALIDATION_ERROR',
        message: 'Failed to validate Kite token'
      }
    });
  }
};
