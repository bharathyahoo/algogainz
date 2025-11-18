import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import { Receipt, FilterList, Refresh } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSearchParams } from 'react-router-dom';
import { transactionService, type Transaction, type TransactionFilters } from '../services/transactionService';
import TransactionCard from '../components/transactions/TransactionCard';

const TransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState<'BUY' | 'SELL' | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'APP_EXECUTED' | 'MANUALLY_RECORDED' | 'ALL'>('ALL');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // Check for symbol query parameter on initial load
    const symbolParam = searchParams.get('symbol');
    if (symbolParam && initialLoad) {
      setSymbolFilter(symbolParam);
      setInitialLoad(false);
      // Load transactions with the symbol filter
      const filters: TransactionFilters = {
        symbol: symbolParam,
        type: 'ALL',
        source: 'ALL',
      };
      loadTransactions(filters);
    } else if (initialLoad) {
      setInitialLoad(false);
      loadTransactions();
    }
  }, [searchParams, initialLoad]);

  const loadTransactions = async (filters?: TransactionFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await transactionService.getTransactions(filters);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const filters: TransactionFilters = {
      type: typeFilter,
      source: sourceFilter,
    };

    if (startDate) {
      filters.startDate = startDate.toISOString();
    }

    if (endDate) {
      filters.endDate = endDate.toISOString();
    }

    if (symbolFilter.trim()) {
      filters.symbol = symbolFilter.trim().toUpperCase();
    }

    loadTransactions(filters);
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setTypeFilter('ALL');
    setSourceFilter('ALL');
    setSymbolFilter('');
    loadTransactions();
  };

  // Calculate summary stats
  const buyTransactions = transactions.filter(t => t.type === 'BUY');
  const sellTransactions = transactions.filter(t => t.type === 'SELL');
  const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.netAmount, 0);
  const totalSellAmount = sellTransactions.reduce((sum, t) => sum + t.netAmount, 0);

  const activeFiltersCount = [
    startDate,
    endDate,
    typeFilter !== 'ALL',
    sourceFilter !== 'ALL',
    symbolFilter.trim(),
  ].filter(Boolean).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Receipt color="primary" />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Transactions
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            View and filter all your trading transactions
          </Typography>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <FilterList />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip label={`${activeFiltersCount} active`} size="small" color="primary" />
            )}
          </Box>

          <Grid container spacing={2}>
            {/* Date Range */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>

            {/* Type Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value as any)}>
                  <MenuItem value="ALL">All</MenuItem>
                  <MenuItem value="BUY">Buy</MenuItem>
                  <MenuItem value="SELL">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Source Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  label="Source"
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  <MenuItem value="APP_EXECUTED">App</MenuItem>
                  <MenuItem value="MANUALLY_RECORDED">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Symbol Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Stock Symbol"
                size="small"
                fullWidth
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                placeholder="e.g., RELIANCE"
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" startIcon={<FilterList />} onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
                <Button variant="outlined" startIcon={<Refresh />} onClick={handleClearFilters}>
                  Clear All
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Stats */}
        {transactions.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Total Transactions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {transactions.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Buy Transactions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {buyTransactions.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Sell Transactions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {sellTransactions.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Net Cash Flow
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: (totalSellAmount - totalBuyAmount) >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  ₹{(totalSellAmount - totalBuyAmount).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Transactions Grid */}
        {!loading && transactions.length > 0 && (
          <Grid container spacing={3}>
            {transactions.map((transaction) => (
              <Grid item xs={12} sm={6} md={4} key={transaction.id}>
                <TransactionCard transaction={transaction} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!loading && transactions.length === 0 && !error && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Transactions Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeFiltersCount > 0
                ? 'Try adjusting your filters to see more transactions.'
                : 'You don\'t have any transactions yet. Start trading or record manual transactions.'}
            </Typography>
          </Box>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default TransactionsPage;
