import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ExpandMore, ExpandLess, Info } from '@mui/icons-material';
import SignalBadge from './SignalBadge';
import type { SignalType } from './SignalBadge';

interface RecommendationCardProps {
  symbol: string;
  companyName: string;
  signal: SignalType;
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  price: number;
  timestamp: Date;
  loading?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  symbol,
  companyName,
  signal,
  score,
  confidence,
  reasons,
  price,
  timestamp,
  loading = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'HIGH':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'error';
      default:
        return 'default';
    }
  };

  const getScoreColor = () => {
    if (score >= 75) return '#00C853';
    if (score >= 60) return '#4CAF50';
    if (score >= 45) return '#FF9800';
    if (score >= 30) return '#F44336';
    return '#D32F2F';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Analyzing {symbol}...
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {symbol}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {companyName}
              </Typography>
            </Box>
            <SignalBadge signal={signal} size="medium" />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
            ₹{price.toFixed(2)}
          </Typography>
        </Box>

        {/* Score Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Signal Strength
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: getScoreColor() }}>
              {score}/100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E0E0E0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getScoreColor(),
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* Confidence */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Confidence:
          </Typography>
          <Chip
            label={confidence}
            size="small"
            color={getConfidenceColor()}
            variant="outlined"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Key Reasons */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Info fontSize="small" color="primary" />
              Key Signals
            </Typography>
            <Tooltip title={expanded ? 'Show less' : 'Show all'}>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>

          <Stack spacing={0.5}>
            {reasons.slice(0, 2).map((reason, index) => (
              <Typography
                key={index}
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  '&::before': {
                    content: '"•"',
                    mr: 0.5,
                    fontWeight: 700,
                  },
                }}
              >
                {reason}
              </Typography>
            ))}
          </Stack>

          <Collapse in={expanded}>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {reasons.slice(2).map((reason, index) => (
                <Typography
                  key={index}
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    '&::before': {
                      content: '"•"',
                      mr: 0.5,
                      fontWeight: 700,
                    },
                  }}
                >
                  {reason}
                </Typography>
              ))}
            </Stack>
          </Collapse>
        </Box>

        {/* Timestamp */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
          Updated: {new Date(timestamp).toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
