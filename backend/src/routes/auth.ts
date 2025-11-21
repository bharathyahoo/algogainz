import express, { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient, AuthProvider } from '@prisma/client';
import { initializeKiteForUser, subscribeToWatchlist } from '../utils/kiteInitializer';

const router = express.Router();
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

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

    // Check if this is a link operation (user ID stored in cookie)
    const linkUserId = req.cookies?.link_user_id;

    // Clear the link cookie
    if (linkUserId) {
      res.clearCookie('link_user_id');
    }

    // Create or update user in database
    // Priority: 1) Link user ID from cookie, 2) existing kiteUserId, 3) email match
    let user = linkUserId
      ? await prisma.user.findUnique({ where: { id: linkUserId } })
      : await prisma.user.findFirst({
          where: {
            OR: [
              { kiteUserId: user_id },
              { email: email }
            ]
          }
        });

    if (user) {
      // Update existing user with Kite credentials
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          kiteUserId: user_id,
          accessToken: access_token,
          apiKey: apiKey,
          apiSecret: apiSecret,
          tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
          // If user registered with email first, keep their auth provider
          // Otherwise set to ZERODHA
          authProvider: user.authProvider === AuthProvider.EMAIL ? user.authProvider : AuthProvider.ZERODHA
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email || `${user_id}@zerodha.temp`, // Temp email if not provided
          kiteUserId: user_id,
          accessToken: access_token,
          apiKey: apiKey,
          apiSecret: apiSecret,
          authProvider: AuthProvider.ZERODHA,
          tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    }

    // Initialize Kite API for real-time data (respects USE_KITE_REAL_DATA env var)
    try {
      await initializeKiteForUser(apiKey, access_token);

      // Subscribe to user's existing watchlist stocks
      const watchlist = await prisma.watchlist.findMany({
        where: { userId: user.id },
        select: { stockSymbol: true }
      });

      if (watchlist.length > 0) {
        const symbols = watchlist.map((w: { stockSymbol: string }) => w.stockSymbol);
        await subscribeToWatchlist(symbols);
        console.log(`📊 Auto-subscribed to ${symbols.length} watchlist stocks for user ${user_id}`);
      }
    } catch (error: any) {
      // Log error but don't fail the authentication
      console.error('⚠️  Failed to initialize Kite data:', error.message);
      console.log('User authenticated successfully, but using mock data mode');
    }

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

/**
 * Email/Password Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters'
        }
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email already exists'
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || undefined,
        authProvider: AuthProvider.EMAIL,
        emailVerified: false
      }
    });

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      userId: user.id,
      userName: user.name || email.split('@')[0],
      email: user.email,
      kiteAccessToken: null
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          authProvider: user.authProvider,
          kiteConnected: false
        }
      },
      message: 'Registration successful'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error.message || 'Registration failed'
      }
    });
  }
});

/**
 * Email/Password Login
 * POST /api/auth/login/email
 */
router.post('/login/email', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if user has password (might be Zerodha-only user)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_PASSWORD',
          message: 'This account uses Zerodha login. Please login with Zerodha or set a password.'
        }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      userId: user.id,
      userName: user.name || email.split('@')[0],
      email: user.email,
      kiteAccessToken: user.accessToken || null
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          authProvider: user.authProvider,
          kiteConnected: !!user.kiteUserId && !!user.accessToken
        }
      },
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error.message || 'Login failed'
      }
    });
  }
});

/**
 * Link Zerodha account to existing email user
 * GET /api/auth/link-zerodha
 * Requires JWT token as query param, stores user ID in cookie for callback
 */
router.get('/link-zerodha', (req: Request, res: Response) => {
  const apiKey = process.env.KITE_API_KEY;
  const token = req.query.token as string;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Kite API key not configured'
      }
    });
  }

  // Verify token and get user ID
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      // Store user ID in cookie for callback to use
      res.cookie('link_user_id', decoded.userId, {
        maxAge: 5 * 60 * 1000, // 5 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (err) {
      // Invalid token, proceed without linking
    }
  }

  // Redirect to Kite login URL
  const kiteLoginUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`;
  res.redirect(kiteLoginUrl);
});

export default router;
