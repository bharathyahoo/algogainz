import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateTransactionReport, ReportFilters } from '../services/reportService';

const router = express.Router();

/**
 * GET /api/reports/transactions
 * Generate and download transaction report in Excel format
 * Query params: startDate, endDate, type, symbol, source
 */
router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const { startDate, endDate, type, symbol, source } = req.query;

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (start > end) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Start date must be before end date',
          },
        });
      }
    }

    // Validate type
    if (type && !['BUY', 'SELL', 'ALL'].includes(type as string)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction type. Must be BUY, SELL, or ALL',
        },
      });
    }

    // Validate source
    if (source && !['APP_EXECUTED', 'MANUALLY_RECORDED', 'ALL'].includes(source as string)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid source. Must be APP_EXECUTED, MANUALLY_RECORDED, or ALL',
        },
      });
    }

    // Build filters
    const filters: ReportFilters = {
      userId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      type: type as 'BUY' | 'SELL' | 'ALL' | undefined,
      symbol: symbol as string | undefined,
      source: source as 'APP_EXECUTED' | 'MANUALLY_RECORDED' | 'ALL' | undefined,
    };

    // Generate report
    console.log('Generating transaction report with filters:', filters);
    const excelBuffer = await generateTransactionReport(filters);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `AlgoGainz_Transactions_${timestamp}.xlsx`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_GENERATION_ERROR',
        message: error.message || 'Failed to generate report',
      },
    });
  }
});

export default router;
