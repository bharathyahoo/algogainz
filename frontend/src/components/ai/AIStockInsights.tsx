/**
 * AI Stock Insights Component
 * Shows AI-powered analysis and sentiment for individual stocks
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Collapse,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SmartToy as AIIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { aiService, SentimentAnalysis } from '../../services/aiService';

interface AIStockInsightsProps {
  symbol: string;
  technicalIndicators: any;
  newsHeadlines?: string[];
  compact?: boolean;
}

export const AIStockInsights: React.FC<AIStockInsightsProps> = ({
  symbol,
  technicalIndicators,
  newsHeadlines = [],
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && !analysis) {
      fetchAIInsights();
    }
  }, [expanded]);

  const fetchAIInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch AI analysis
      const analysisResult = await aiService.analyzeStock(symbol, technicalIndicators);
      setAnalysis(analysisResult);

      // Fetch sentiment if news available
      if (newsHeadlines.length > 0) {
        const sentimentResult = await aiService.analyzeSentiment(symbol, newsHeadlines);
        setSentiment(sentimentResult);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch AI insights');
      console.error('[AI Stock Insights Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'success';
      case 'Negative':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return <TrendingUpIcon fontSize="small" />;
      case 'Negative':
        return <TrendingDownIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="subtitle2" fontWeight="600">
              AI Insights - {symbol}
            </Typography>
          </Box>
          <Box>
            {analysis && (
              <IconButton size="small" onClick={fetchAIInsights} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            )}
            {compact && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: '0.3s',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <Collapse in={expanded}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                AI is analyzing {symbol}...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {analysis && !loading && (
            <Box sx={{ mt: 2 }}>
              {/* Sentiment */}
              {sentiment && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={sentiment.sentiment}
                      color={getSentimentColor(sentiment.sentiment)}
                      size="small"
                      icon={getSentimentIcon(sentiment.sentiment)}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Score: {(sentiment.score * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  {sentiment.themes.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {sentiment.themes.map((theme, index) => (
                        <Chip key={index} label={theme} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                  {sentiment.impact && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {sentiment.impact}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1.5 }} />
                </Box>
              )}

              {/* AI Analysis */}
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {analysis}
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  AI-generated insights. Not financial advice.
                </Typography>
              </Box>
            </Box>
          )}

          {!analysis && !loading && !error && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AIIcon />}
                onClick={fetchAIInsights}
              >
                Get AI Analysis
              </Button>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AIStockInsights;
