import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/watchlist
 * Get all stocks in user's watchlist
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' }
    });

    // Parse categories JSON for each item
    const watchlistWithParsedCategories = watchlist.map((item: any) => ({
      ...item,
      categories: JSON.parse(item.categories)
    }));

    res.json({
      success: true,
      data: watchlistWithParsedCategories
    });
  } catch (error: any) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch watchlist'
      }
    });
  }
});

/**
 * POST /api/watchlist
 * Add a stock to the watchlist
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { stockSymbol, companyName, exchange, instrumentToken, categories } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    // Validate required fields
    if (!stockSymbol || !companyName || !exchange || !instrumentToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: stockSymbol, companyName, exchange, instrumentToken'
        }
      });
    }

    // Check if stock already exists in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_stockSymbol: {
          userId,
          stockSymbol
        }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Stock already exists in watchlist'
        }
      });
    }

    // Get the highest sortOrder to add new stock at the end
    const lastStock = await prisma.watchlist.findFirst({
      where: { userId },
      orderBy: { sortOrder: 'desc' }
    });

    const sortOrder = lastStock ? lastStock.sortOrder + 1 : 0;

    // Add to watchlist
    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId,
        stockSymbol,
        companyName,
        exchange,
        instrumentToken,
        categories: JSON.stringify(categories || []),
        sortOrder
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...watchlistItem,
        categories: JSON.parse(watchlistItem.categories)
      },
      message: 'Stock added to watchlist'
    });
  } catch (error: any) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add stock to watchlist'
      }
    });
  }
});

/**
 * PUT /api/watchlist/:id
 * Update a watchlist item (categories, sortOrder)
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { categories, sortOrder } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    // Verify ownership
    const item = await prisma.watchlist.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Watchlist item not found'
        }
      });
    }

    if (item.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this item'
        }
      });
    }

    // Update
    const updated = await prisma.watchlist.update({
      where: { id },
      data: {
        ...(categories !== undefined && { categories: JSON.stringify(categories) }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });

    res.json({
      success: true,
      data: {
        ...updated,
        categories: JSON.parse(updated.categories)
      },
      message: 'Watchlist item updated'
    });
  } catch (error: any) {
    console.error('Update watchlist error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update watchlist item'
      }
    });
  }
});

/**
 * DELETE /api/watchlist/:id
 * Remove a stock from watchlist
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    // Verify ownership
    const item = await prisma.watchlist.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Watchlist item not found'
        }
      });
    }

    if (item.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this item'
        }
      });
    }

    // Delete
    await prisma.watchlist.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Stock removed from watchlist'
    });
  } catch (error: any) {
    console.error('Delete watchlist error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove stock from watchlist'
      }
    });
  }
});

/**
 * GET /api/watchlist/categories
 * Get all unique categories from user's watchlist
 */
router.get('/categories', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      select: { categories: true }
    });

    // Extract unique categories
    const categoriesSet = new Set<string>();
    watchlist.forEach((item: any) => {
      const parsedCategories = JSON.parse(item.categories);
      parsedCategories.forEach((cat: string) => categoriesSet.add(cat));
    });

    const categories = Array.from(categoriesSet).sort();

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch categories'
      }
    });
  }
});

/**
 * PUT /api/watchlist/reorder
 * Reorder watchlist items
 */
router.put('/reorder', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { items } = req.body; // Array of { id, sortOrder }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'items must be an array'
        }
      });
    }

    // Update all items in a transaction
    await prisma.$transaction(
      items.map(item =>
        prisma.watchlist.updateMany({
          where: {
            id: item.id,
            userId // Ensure user owns this item
          },
          data: {
            sortOrder: item.sortOrder
          }
        })
      )
    );

    res.json({
      success: true,
      message: 'Watchlist reordered successfully'
    });
  } catch (error: any) {
    console.error('Reorder watchlist error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reorder watchlist'
      }
    });
  }
});

export default router;
