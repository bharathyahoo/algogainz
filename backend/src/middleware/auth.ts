import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
