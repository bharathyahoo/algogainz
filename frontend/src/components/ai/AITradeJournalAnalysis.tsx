/**
 * AI Trade Journal Analysis Component
 * Analyzes trading patterns and provides insights
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
  Chip,
  Divider,
} from '@mui/material';
import {
  AutoGraph as AnalysisIcon,
  Insights as InsightsIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { aiService } from '../../services/aiService';

interface AITradeJournalAnalysisProps {
  transactions: any[];
}

export const AITradeJournalAnalysis: React.FC<AITradeJournalAnalysisProps> = ({
  transactions,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.analyzeTradeJournal(transactions);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to analyze trade journal');
      console.error('[AI Trade Journal Analysis Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const totalTrades = transactions.length;
  const buyTrades = transactions.filter((t) => t.type === 'BUY').length;
  const sellTrades = transactions.filter((t) => t.type === 'SELL').length;

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AnalysisIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" fontWeight="600">
              AI Trade Journal Analysis
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Discover patterns and improve your trading strategy
            </Typography>
          </Box>
        </Box>

        {!analysis && !loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Chip label={`${totalTrades} Trades`} color="primary" />
              <Chip label={`${buyTrades} Buys`} color="success" variant="outlined" />
              <Chip label={`${sellTrades} Sells`} color="error" variant="outlined" />
            </Box>

            <InsightsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Let AI analyze your trading patterns, identify behavioral biases, and suggest
              improvements
            </Typography>
            <Button
              variant="contained"
              startIcon={<AIIcon />}
              onClick={handleAnalyze}
              sx={{ mt: 2 }}
              disabled={totalTrades === 0}
            >
              Analyze My Trading Patterns
            </Button>
            {totalTrades === 0 && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                No transactions to analyze
              </Typography>
            )}
            {totalTrades > 0 && totalTrades < 10 && (
              <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1 }}>
                At least 10 transactions recommended for meaningful insights
              </Typography>
            )}
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              AI is analyzing {totalTrades} transactions...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {analysis && !loading && (
          <Box>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mt: 2 }}>
              AI Insights from {totalTrades} Transactions
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: 2 }}>
              {analysis}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                AI-generated analysis. Review before implementing suggestions.
              </Typography>
              <Button size="small" startIcon={<AnalysisIcon />} onClick={handleAnalyze}>
                Re-analyze
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AITradeJournalAnalysis;
