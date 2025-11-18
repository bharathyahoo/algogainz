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
  Alert,
  Divider,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  ExpandMore,
  Receipt,
  TrendingUp,
  TrendingDown,
  CalendarToday,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import {
  transactionService,
  type ManualTransactionRequest,
  type TransactionCharges,
} from '../../services/transactionService';

interface StockOption {
  symbol: string;
  name: string;
}

interface ManualTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  stockOptions?: StockOption[]; // Optional pre-populated stock list
}

const ManualTransactionDialog: React.FC<ManualTransactionDialogProps> = ({
  open,
  onClose,
  onSuccess,
  stockOptions = [],
}) => {
  // Form state
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [stockSymbol, setStockSymbol] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerShare, setPricePerShare] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [orderIdRef, setOrderIdRef] = useState<string>('');

  // Charges state
  const [charges, setCharges] = useState<TransactionCharges>({
    brokerage: 0,
    exchangeCharges: 0,
    gst: 0,
    sebiCharges: 0,
    stampDuty: 0,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [chargesExpanded, setChargesExpanded] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTransactionType('BUY');
      setStockSymbol('');
      setCompanyName('');
      setQuantity(1);
      setPricePerShare('');
      setTransactionDate(new Date());
      setOrderIdRef('');
      setCharges({
        brokerage: 0,
        exchangeCharges: 0,
        gst: 0,
        sebiCharges: 0,
        stampDuty: 0,
      });
      setError('');
      setChargesExpanded(false);
    }
  }, [open]);

  // Calculate totals
  const grossAmount = quantity * (parseFloat(pricePerShare) || 0);
  const totalCharges = transactionService.calculateTotalCharges(charges);
  const netAmount = transactionService.calculateNetAmount(
    transactionType,
    quantity,
    parseFloat(pricePerShare) || 0,
    charges
  );

  const handleStockSelect = (option: StockOption | null) => {
    if (option) {
      setStockSymbol(option.symbol);
      setCompanyName(option.name);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!stockSymbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (!pricePerShare || parseFloat(pricePerShare) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (transactionDate > new Date()) {
      setError('Transaction date cannot be in the future');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const request: ManualTransactionRequest = {
        transactionType,
        stockSymbol: stockSymbol.toUpperCase(),
        companyName,
        quantity,
        pricePerShare: parseFloat(pricePerShare),
        timestamp: transactionDate.toISOString(),
        charges,
        orderIdRef: orderIdRef.trim() || undefined,
      };

      await transactionService.recordManualTransaction(request);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const isBuy = transactionType === 'BUY';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Record Manual Transaction
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Record trades executed outside the app
          </Typography>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Transaction Type */}
          <FormControl component="fieldset" sx={{ mb: 3 }} fullWidth>
            <FormLabel component="legend">Transaction Type</FormLabel>
            <RadioGroup
              row
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as 'BUY' | 'SELL')}
            >
              <FormControlLabel
                value="BUY"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp color="success" fontSize="small" />
                    Buy
                  </Box>
                }
              />
              <FormControlLabel
                value="SELL"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingDown color="error" fontSize="small" />
                    Sell
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {/* Stock Selection */}
          <Autocomplete
            freeSolo
            options={stockOptions}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : `${option.symbol} - ${option.name}`
            }
            onChange={(_, value) => {
              if (value && typeof value !== 'string') {
                handleStockSelect(value);
              }
            }}
            onInputChange={(_, value) => {
              setStockSymbol(value.toUpperCase());
            }}
            renderInput={(params) => (
              <TextField {...params} label="Stock Symbol" required sx={{ mb: 2 }} />
            )}
          />

          <TextField
            label="Company Name"
            fullWidth
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          {/* Date & Time */}
          <DateTimePicker
            label="Transaction Date & Time"
            value={transactionDate}
            onChange={(newValue: Date | null) => newValue && setTransactionDate(newValue)}
            maxDateTime={new Date()}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { mb: 2 },
                InputProps: {
                  endAdornment: <CalendarToday color="action" />,
                },
              },
            }}
          />

          {/* Quantity & Price */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Price per Share (₹)"
                type="number"
                fullWidth
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                inputProps={{ step: '0.05', min: '0.05' }}
                required
              />
            </Grid>
          </Grid>

          {/* Kite Order ID (Optional) */}
          <TextField
            label="Kite Order ID (Optional)"
            fullWidth
            value={orderIdRef}
            onChange={(e) => setOrderIdRef(e.target.value)}
            sx={{ mb: 2 }}
            helperText="If you have the Kite order ID, enter it here"
          />

          {/* Charges Accordion */}
          <Accordion
            expanded={chargesExpanded}
            onChange={() => setChargesExpanded(!chargesExpanded)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2">
                Transaction Charges (Optional) - Total: ₹{totalCharges.toFixed(2)}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Brokerage (₹)"
                    type="number"
                    fullWidth
                    size="small"
                    value={charges.brokerage || ''}
                    onChange={(e) =>
                      setCharges({ ...charges, brokerage: parseFloat(e.target.value) || 0 })
                    }
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Exchange Charges (₹)"
                    type="number"
                    fullWidth
                    size="small"
                    value={charges.exchangeCharges || ''}
                    onChange={(e) =>
                      setCharges({
                        ...charges,
                        exchangeCharges: parseFloat(e.target.value) || 0,
                      })
                    }
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="GST (₹)"
                    type="number"
                    fullWidth
                    size="small"
                    value={charges.gst || ''}
                    onChange={(e) =>
                      setCharges({ ...charges, gst: parseFloat(e.target.value) || 0 })
                    }
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="SEBI Charges (₹)"
                    type="number"
                    fullWidth
                    size="small"
                    value={charges.sebiCharges || ''}
                    onChange={(e) =>
                      setCharges({ ...charges, sebiCharges: parseFloat(e.target.value) || 0 })
                    }
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Stamp Duty (₹)"
                    type="number"
                    fullWidth
                    size="small"
                    value={charges.stampDuty || ''}
                    onChange={(e) =>
                      setCharges({ ...charges, stampDuty: parseFloat(e.target.value) || 0 })
                    }
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Summary */}
          <Paper sx={{ p: 2, bgcolor: isBuy ? 'success.50' : 'error.50' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Transaction Summary
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Gross Amount:
              </Typography>
              <Typography variant="body2">₹{grossAmount.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Total Charges:
              </Typography>
              <Typography variant="body2">₹{totalCharges.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Net Amount:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                ₹{netAmount.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={isBuy ? 'success' : 'error'}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Recording...' : 'Record Transaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ManualTransactionDialog;
