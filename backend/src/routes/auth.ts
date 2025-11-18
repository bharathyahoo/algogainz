import express, { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Step 1: Initiate Kite Login
 * Redirects user to Zerodha Kite login page
 * GET /api/auth/login
 */
router.get('/login', (req: Request, res: Response) => {
  const apiKey = process.env.KITE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Kite API key not configured'
      }
    });
  }

  // Redirect to Kite login URL
  const kiteLoginUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`;
  res.redirect(kiteLoginUrl);
});

/**
 * Step 2: Handle Kite Callback
 * Receives request_token from Kite after successful login
 * Exchanges it for access_token and creates JWT
 * GET /api/auth/callback?request_token=xxx&status=success
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { request_token, status } = req.query;

    // Check if login was successful
    if (status !== 'success' || !request_token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Kite login failed or was cancelled'
        }
      });
    }

    const apiKey = process.env.KITE_API_KEY;
    const apiSecret = process.env.KITE_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Kite API credentials not configured'
        }
      });
    }

    // Generate checksum for session
    const crypto = require('crypto');
    const checksum = crypto
      .createHash('sha256')
      .update(`${apiKey}${request_token}${apiSecret}`)
      .digest('hex');

    // Exchange request_token for access_token
    const sessionResponse = await axios.post(
      'https://api.kite.trade/session/token',
      new URLSearchParams({
        api_key: apiKey,
        request_token: request_token as string,
        checksum: checksum
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Kite-Version': '3'
        }
      }
    );

    const { access_token, user_id, user_name, email } = sessionResponse.data.data;

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: {
        kiteUserId: user_id
      },
      update: {
        accessToken: access_token,
        email: email || undefined
      },
      create: {
        kiteUserId: user_id,
        accessToken: access_token,
        apiKey: apiKey,
        apiSecret: apiSecret,
        email: email || undefined
      }
    });

    // Create JWT token for our application
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      userId: user.id, // Use database user ID, not Kite user ID
      userName: user_name,
      email: email,
      kiteAccessToken: access_token
    };

    // JWT expiresIn can be a string (like '7d') or number (seconds)
    // Using type assertion to bypass strict type checking
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    });

    // Redirect to frontend with token
    // In production, use a more secure method (httpOnly cookie)
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/success?token=${token}`);

  } catch (error: any) {
    console.error('Kite auth callback error:', error.response?.data || error.message);

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Step 3: Logout
 * Invalidates the session
 * POST /api/auth/logout
 */
router.post('/logout', (req: Request, res: Response) => {
  // In a production app, you would:
  // 1. Invalidate the JWT (add to blacklist)
  // 2. Clear the session from database
  // 3. Optionally invalidate Kite session

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // This route will be protected by auth middleware
    // For now, returning placeholder
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided'
        }
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'JWT configuration error'
        }
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    res.json({
      success: true,
      data: {
        userId: decoded.userId,
        userName: decoded.userName,
        email: decoded.email
      }
    });

  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
});

export default router;
