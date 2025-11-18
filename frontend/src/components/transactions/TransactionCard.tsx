import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import { TrendingUp, TrendingDown, Receipt, Store } from '@mui/icons-material';
import { format } from 'date-fns';
import type { Transaction } from '../../services/transactionService';

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const isBuy = transaction.type === 'BUY';
  const isManual = transaction.source === 'MANUALLY_RECORDED';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {transaction.stockSymbol}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {transaction.companyName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip
              icon={isBuy ? <TrendingUp /> : <TrendingDown />}
              label={transaction.type}
              color={isBuy ? 'success' : 'error'}
              size="small"
            />
            <Chip
              icon={isManual ? <Receipt /> : <Store />}
              label={isManual ? 'Manual' : 'App'}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Transaction Details */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Date & Time
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {format(new Date(transaction.timestamp), 'MMM dd, yyyy')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(transaction.timestamp), 'hh:mm a')}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {transaction.quantity} shares
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Price per Share
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ₹{transaction.pricePerShare.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Gross Amount
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ₹{transaction.grossAmount.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Charges Breakdown */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Charges Breakdown
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Brokerage:
              </Typography>
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                ₹{transaction.brokerage.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Exchange:
              </Typography>
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                ₹{transaction.exchangeCharges.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                GST:
              </Typography>
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                ₹{transaction.gst.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                SEBI:
              </Typography>
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                ₹{transaction.sebiCharges.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Stamp Duty:
              </Typography>
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                ₹{transaction.stampDuty.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Net Amount */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: isBuy ? 'error.50' : 'success.50',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Net Amount {isBuy ? '(Paid)' : '(Received)'}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: isBuy ? 'error.main' : 'success.main',
              }}
            >
              {isBuy ? '-' : '+'}₹{transaction.netAmount.toFixed(2)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Total Charges: ₹{transaction.totalCharges.toFixed(2)}
          </Typography>
        </Box>

        {/* Order ID Reference */}
        {transaction.orderIdRef && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Order ID: {transaction.orderIdRef}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionCard;
