/**
 * AI Portfolio Review Component
 * AI-powered portfolio analysis and recommendations
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { aiService } from '../../services/aiService';

interface AIPortfolioReviewProps {
  holdings: any[];
  totalPnL: number;
  totalInvested: number;
  currentValue: number;
}

export const AIPortfolioReview: React.FC<AIPortfolioReviewProps> = ({
  holdings,
  totalPnL,
  totalInvested,
  currentValue,
}) => {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetReview = async () => {
    setLoading(true);
    setError(null);

    try {
      const context = {
        totalInvested,
        currentValue,
        returnPercentage: ((totalPnL / totalInvested) * 100).toFixed(2),
        holdingsCount: holdings.length,
      };

      const result = await aiService.reviewPortfolio(holdings, totalPnL, context);
      setReview(result);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to get portfolio review');
      console.error('[AI Portfolio Review Error]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AIIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" fontWeight="600">
              AI Portfolio Review
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Get personalized insights and recommendations
            </Typography>
          </Box>
        </Box>

        {!review && !loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Let AI analyze your portfolio performance, diversification, and risk exposure
            </Typography>
            <Button
              variant="contained"
              startIcon={<AIIcon />}
              onClick={handleGetReview}
              sx={{ mt: 2 }}
              disabled={holdings.length === 0}
            >
              Get AI Review
            </Button>
            {holdings.length === 0 && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                No holdings to analyze
              </Typography>
            )}
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              AI is analyzing your portfolio...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {review && !loading && (
          <Box>
            {/* Portfolio Stats */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {holdings.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Holdings
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    ₹{totalInvested.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Invested
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    color={totalPnL >= 0 ? 'success.main' : 'error.main'}
                  >
                    {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    P&L
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* AI Review */}
            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mt: 2 }}>
              AI Analysis
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {review}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Generated by AI. Not financial advice.
              </Typography>
              <Button size="small" startIcon={<TrendingUpIcon />} onClick={handleGetReview}>
                Refresh Analysis
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPortfolioReview;
