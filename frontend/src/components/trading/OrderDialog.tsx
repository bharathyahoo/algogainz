import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import { ShoppingCart, TrendingUp, TrendingDown } from '@mui/icons-material';
import { tradingService, type OrderRequest, type OrderPreview } from '../../services/tradingService';

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  stockSymbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  instrumentToken: string;
  currentPrice: number;
  transactionType: 'BUY' | 'SELL';
  onSuccess?: () => void;
}

const OrderDialog: React.FC<OrderDialogProps> = ({
  open,
  onClose,
  stockSymbol,
  companyName,
  exchange,
  instrumentToken,
  currentPrice,
  transactionType,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toFixed(2));
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const steps = ['Enter Details', 'Review & Confirm', 'Order Placed'];

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setQuantity(1);
      setOrderType('MARKET');
      setLimitPrice(currentPrice.toFixed(2));
      setPreview(null);
      setError('');
    }
  }, [open, currentPrice]);

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate and get preview
      if (quantity <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
        setError('Please enter a valid limit price');
        return;
      }

      setError('');
      setLoading(true);

      try {
        console.log('OrderDialog - exchange value:', exchange, 'stockSymbol:', stockSymbol);

        const orderRequest: OrderRequest = {
          stockSymbol,
          companyName,
          exchange,
          instrumentToken,
          orderType,
          transactionType,
          quantity,
          price: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        };

        console.log('OrderDialog - orderRequest:', orderRequest);
        const orderPreview = await tradingService.getOrderPreview(orderRequest);
        setPreview(orderPreview);
        setActiveStep(1);
      } catch (err: any) {
        setError(err.message || 'Failed to get order preview');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Place order
      setLoading(true);
      setError('');

      try {
        console.log('OrderDialog - Placing order with exchange:', exchange);

        const orderRequest: OrderRequest = {
          stockSymbol,
          companyName,
          exchange,
          instrumentToken,
          orderType,
          transactionType,
          quantity,
          price: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        };

        console.log('OrderDialog - Final orderRequest:', orderRequest);
        await tradingService.placeOrder(orderRequest);
        setActiveStep(2);
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to place order');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleClose = () => {
    onClose();
  };

  const isBuy = transactionType === 'BUY';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart color={isBuy ? 'success' : 'error'} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isBuy ? 'Buy' : 'Sell'} {stockSymbol}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {companyName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Enter Details */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Current Price: ₹{currentPrice.toFixed(2)}
            </Typography>

            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              sx={{ mb: 3 }}
              inputProps={{ min: 1 }}
            />

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Order Type</FormLabel>
              <RadioGroup
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'MARKET' | 'LIMIT')}
              >
                <FormControlLabel value="MARKET" control={<Radio />} label="Market Order (Execute at current price)" />
                <FormControlLabel value="LIMIT" control={<Radio />} label="Limit Order (Set your price)" />
              </RadioGroup>
            </FormControl>

            {orderType === 'LIMIT' && (
              <TextField
                label="Limit Price"
                type="number"
                fullWidth
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ step: '0.05', min: '0.05' }}
              />
            )}
          </Box>
        )}

        {/* Step 2: Review & Confirm */}
        {activeStep === 1 && preview && (
          <Box>
            <Paper sx={{ p: 2, bgcolor: isBuy ? 'success.50' : 'error.50', mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Transaction Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isBuy ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                    {transactionType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Order Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {orderType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {preview.quantity}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Price per Share
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    ₹{preview.pricePerShare.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Gross Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ₹{preview.grossAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Charges:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ₹{preview.charges.total.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', pl: 2, color: 'text.secondary' }}>
                <Typography variant="caption">Brokerage:</Typography>
                <Typography variant="caption">₹{preview.charges.brokerage.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', pl: 2, color: 'text.secondary' }}>
                <Typography variant="caption">Exchange Charges:</Typography>
                <Typography variant="caption">₹{preview.charges.exchangeCharges.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', pl: 2, color: 'text.secondary' }}>
                <Typography variant="caption">GST:</Typography>
                <Typography variant="caption">₹{preview.charges.gst.toFixed(2)}</Typography>
              </Box>
              {preview.charges.stampDuty > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', pl: 2, color: 'text.secondary' }}>
                  <Typography variant="caption">Stamp Duty:</Typography>
                  <Typography variant="caption">₹{preview.charges.stampDuty.toFixed(2)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  Net Amount:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: isBuy ? 'error.main' : 'success.main' }}>
                  {isBuy ? '-' : '+'}₹{preview.netAmount.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {preview.marginCheck && (
              <Alert severity={preview.marginCheck.sufficient ? 'success' : 'error'} sx={{ mt: 2 }}>
                {preview.marginCheck.sufficient ? (
                  `Sufficient funds available. Balance: ₹${preview.marginCheck.available.toFixed(2)}`
                ) : (
                  `Insufficient funds! Required: ₹${preview.marginCheck.required.toFixed(2)}, Available: ₹${preview.marginCheck.available.toFixed(2)}`
                )}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 3: Success */}
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, color: 'success.main' }}>
              ✓ Order Placed Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your {transactionType} order for {quantity} shares of {stockSymbol} has been placed.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              You can check the order status in the Orders section.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {activeStep < 2 && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              variant="contained"
              color={isBuy ? 'success' : 'error'}
              disabled={loading || (activeStep === 1 && preview?.marginCheck && !preview.marginCheck.sufficient)}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Processing...' : activeStep === 0 ? 'Preview' : 'Place Order'}
            </Button>
          </>
        )}
        {activeStep === 2 && (
          <Button onClick={handleClose} variant="contained" color="primary">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OrderDialog;
