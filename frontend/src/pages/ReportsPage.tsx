import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Stack,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Assessment,
  FilterList,
  Refresh,
  Download,
  TableChart,
  BarChart,
  PieChart,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { reportsService, type ReportFilters } from '../services/reportsService';

const ReportsPage: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState<'BUY' | 'SELL' | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'APP_EXECUTED' | 'MANUALLY_RECORDED' | 'ALL'>('ALL');
  const [symbolFilter, setSymbolFilter] = useState<string>('');

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Validate date range
      if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date must be before end date');
      }

      const filters: ReportFilters = {
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

      await reportsService.generateTransactionReport(filters);
      setSuccess('Report generated and downloaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setTypeFilter('ALL');
    setSourceFilter('ALL');
    setSymbolFilter('');
    setError('');
    setSuccess('');
  };

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
            <Assessment color="primary" />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Reports & Export
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Generate detailed Excel reports of your trading activity
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Filters */}
          <Grid item xs={12} md={7}>
            {/* Filters Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FilterList />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Report Filters
                </Typography>
                {activeFiltersCount > 0 && (
                  <Chip label={`${activeFiltersCount} active`} size="small" color="primary" />
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Date Range */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        helperText: 'Optional - Leave empty for all dates',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        helperText: 'Optional - Leave empty for all dates',
                      },
                    }}
                  />
                </Grid>

                {/* Type Filter */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Transaction Type</InputLabel>
                    <Select value={typeFilter} label="Transaction Type" onChange={(e) => setTypeFilter(e.target.value as any)}>
                      <MenuItem value="ALL">All Transactions</MenuItem>
                      <MenuItem value="BUY">Buy Only</MenuItem>
                      <MenuItem value="SELL">Sell Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Source Filter */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Source</InputLabel>
                    <Select
                      value={sourceFilter}
                      label="Source"
                      onChange={(e) => setSourceFilter(e.target.value as any)}
                    >
                      <MenuItem value="ALL">All Sources</MenuItem>
                      <MenuItem value="APP_EXECUTED">App Executed</MenuItem>
                      <MenuItem value="MANUALLY_RECORDED">Manually Recorded</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Symbol Filter */}
                <Grid item xs={12}>
                  <TextField
                    label="Stock Symbol (Optional)"
                    size="small"
                    fullWidth
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    placeholder="e.g., RELIANCE, TCS"
                    helperText="Leave empty to include all stocks"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={generating ? null : <Download />}
                  onClick={handleGenerateReport}
                  disabled={generating}
                  fullWidth
                >
                  {generating ? 'Generating Report...' : 'Generate & Download Report'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleClearFilters}
                  disabled={generating}
                >
                  Clear
                </Button>
              </Stack>
            </Paper>

            {/* Status Messages */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}
          </Grid>

          {/* Right Column - Report Info */}
          <Grid item xs={12} md={5}>
            {/* Report Structure Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TableChart color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Report Structure
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  The generated Excel file contains three comprehensive sheets:
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <TableChart color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sheet 1: Detailed Transactions"
                      secondary="Complete list of all transactions with dates, prices, charges, and P&L"
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemIcon>
                      <BarChart color="secondary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sheet 2: Summary Statistics"
                      secondary="Aggregated metrics including total trades, win rate, and overall P&L"
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemIcon>
                      <PieChart color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sheet 3: Stock-wise P&L"
                      secondary="Per-stock breakdown with realized and unrealized gains/losses"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Report Features
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="📊 Professional Formatting"
                      secondary="Color-coded cells and formatted currency values"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="💰 FIFO P&L Calculation"
                      secondary="Accurate profit/loss using First-In-First-Out method"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="📈 Complete Charge Breakdown"
                      secondary="Brokerage, GST, SEBI charges, and stamp duty"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="🎯 Flexible Filtering"
                      secondary="Filter by date range, type, source, or specific stock"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="💾 Instant Download"
                      secondary="Ready-to-share Excel file with timestamp"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tips Section */}
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.lighter' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.dark' }}>
            💡 Tips for Better Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Use date filters to generate monthly or quarterly reports for tax purposes
            <br />
            • Filter by stock symbol to analyze individual stock performance
            <br />
            • Generate separate reports for app-executed vs manually-recorded trades
            <br />
            • The report includes only transactions tracked within AlgoGainz
          </Typography>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ReportsPage;
