import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import type { BacktestConfig, StrategyCondition, ExitCondition } from '../../types';

interface StrategyBuilderFormProps {
  onSubmit: (config: BacktestConfig) => void;
  isRunning: boolean;
}

const StrategyBuilderForm: React.FC<StrategyBuilderFormProps> = ({ onSubmit, isRunning }) => {
  // Basic configuration
  const [strategyName, setStrategyName] = useState('');
  const [stockSymbol, setStockSymbol] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialCapital, setInitialCapital] = useState('100000');

  // Entry conditions
  const [entryConditions, setEntryConditions] = useState<StrategyCondition[]>([
    { indicator: 'RSI', operator: '<', value: 30, combinator: 'AND' },
  ]);

  // Exit conditions
  const [exitConditions, setExitConditions] = useState<ExitCondition[]>([
    { type: 'profit_target', value: 10 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add entry condition
  const handleAddEntryCondition = () => {
    setEntryConditions([
      ...entryConditions,
      { indicator: 'RSI', operator: '<', value: 30, combinator: 'AND' },
    ]);
  };

  // Remove entry condition
  const handleRemoveEntryCondition = (index: number) => {
    setEntryConditions(entryConditions.filter((_, i) => i !== index));
  };

  // Update entry condition
  const handleUpdateEntryCondition = (index: number, field: keyof StrategyCondition, value: any) => {
    const updated = [...entryConditions];
    updated[index] = { ...updated[index], [field]: value };
    setEntryConditions(updated);
  };

  // Add exit condition
  const handleAddExitCondition = () => {
    setExitConditions([...exitConditions, { type: 'profit_target', value: 10 }]);
  };

  // Remove exit condition
  const handleRemoveExitCondition = (index: number) => {
    setExitConditions(exitConditions.filter((_, i) => i !== index));
  };

  // Update exit condition
  const handleUpdateExitCondition = (index: number, field: keyof ExitCondition, value: any) => {
    const updated = [...exitConditions];
    updated[index] = { ...updated[index], [field]: value };
    setExitConditions(updated);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!strategyName.trim()) {
      newErrors.strategyName = 'Strategy name is required';
    }

    if (!stockSymbol.trim()) {
      newErrors.stockSymbol = 'Stock symbol is required';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.dateRange = 'End date must be after start date';
    }

    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital <= 0) {
      newErrors.initialCapital = 'Initial capital must be greater than 0';
    }

    if (entryConditions.length === 0) {
      newErrors.entryConditions = 'At least one entry condition is required';
    }

    if (exitConditions.length === 0) {
      newErrors.exitConditions = 'At least one exit condition is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const config: BacktestConfig = {
      strategyName: strategyName.trim(),
      stockSymbol: stockSymbol.trim().toUpperCase(),
      startDate,
      endDate,
      initialCapital: parseFloat(initialCapital),
      entryConditions,
      exitConditions,
    };

    onSubmit(config);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Basic Configuration */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Basic Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Strategy Name"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            error={!!errors.strategyName}
            helperText={errors.strategyName || 'Give your strategy a descriptive name'}
            required
            disabled={isRunning}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Stock Symbol"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
            error={!!errors.stockSymbol}
            helperText={errors.stockSymbol || 'e.g., RELIANCE, TCS, INFY'}
            required
            disabled={isRunning}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={!!errors.startDate}
            helperText={errors.startDate}
            InputLabelProps={{ shrink: true }}
            required
            disabled={isRunning}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={!!errors.endDate || !!errors.dateRange}
            helperText={errors.endDate || errors.dateRange}
            InputLabelProps={{ shrink: true }}
            required
            disabled={isRunning}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Initial Capital"
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            error={!!errors.initialCapital}
            helperText={errors.initialCapital}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            required
            disabled={isRunning}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Entry Conditions */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Entry Conditions</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddEntryCondition}
            disabled={isRunning}
            size="small"
          >
            Add Condition
          </Button>
        </Box>

        {errors.entryConditions && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.entryConditions}
          </Alert>
        )}

        {entryConditions.map((condition, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Indicator</InputLabel>
                  <Select
                    value={condition.indicator}
                    label="Indicator"
                    onChange={(e) =>
                      handleUpdateEntryCondition(index, 'indicator', e.target.value)
                    }
                    disabled={isRunning}
                  >
                    <MenuItem value="RSI">RSI</MenuItem>
                    <MenuItem value="MACD">MACD</MenuItem>
                    <MenuItem value="SMA">SMA</MenuItem>
                    <MenuItem value="EMA">EMA</MenuItem>
                    <MenuItem value="PRICE">Price</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={condition.operator}
                    label="Operator"
                    onChange={(e) =>
                      handleUpdateEntryCondition(index, 'operator', e.target.value)
                    }
                    disabled={isRunning}
                  >
                    <MenuItem value="<">Less Than (&lt;)</MenuItem>
                    <MenuItem value=">">Greater Than (&gt;)</MenuItem>
                    <MenuItem value="=">Equals (=)</MenuItem>
                    <MenuItem value="crossover">Crossover Above</MenuItem>
                    <MenuItem value="crossunder">Crossunder Below</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Value"
                  type="number"
                  value={condition.value}
                  onChange={(e) =>
                    handleUpdateEntryCondition(index, 'value', parseFloat(e.target.value))
                  }
                  size="small"
                  disabled={isRunning}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                {index < entryConditions.length - 1 && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Link</InputLabel>
                    <Select
                      value={condition.combinator || 'AND'}
                      label="Link"
                      onChange={(e) =>
                        handleUpdateEntryCondition(index, 'combinator', e.target.value)
                      }
                      disabled={isRunning}
                    >
                      <MenuItem value="AND">AND</MenuItem>
                      <MenuItem value="OR">OR</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Grid>

              <Grid item xs={12} sm={2}>
                <IconButton
                  onClick={() => handleRemoveEntryCondition(index)}
                  color="error"
                  disabled={isRunning || entryConditions.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Exit Conditions */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Exit Conditions</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddExitCondition}
            disabled={isRunning}
            size="small"
          >
            Add Condition
          </Button>
        </Box>

        {errors.exitConditions && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.exitConditions}
          </Alert>
        )}

        {exitConditions.map((condition, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Exit Type</InputLabel>
                  <Select
                    value={condition.type}
                    label="Exit Type"
                    onChange={(e) => handleUpdateExitCondition(index, 'type', e.target.value)}
                    disabled={isRunning}
                  >
                    <MenuItem value="profit_target">Profit Target (%)</MenuItem>
                    <MenuItem value="stop_loss">Stop Loss (%)</MenuItem>
                    <MenuItem value="trailing_stop">Trailing Stop (%)</MenuItem>
                    <MenuItem value="time_based">Time-Based (Days)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Value"
                  type="number"
                  value={condition.value}
                  onChange={(e) =>
                    handleUpdateExitCondition(index, 'value', parseFloat(e.target.value))
                  }
                  size="small"
                  disabled={isRunning}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {condition.type === 'time_based' ? 'days' : '%'}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <IconButton
                  onClick={() => handleRemoveExitCondition(index)}
                  color="error"
                  disabled={isRunning || exitConditions.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          disabled={isRunning}
        >
          {isRunning ? 'Running Backtest...' : 'Run Backtest'}
        </Button>
      </Box>

      {/* Strategy Summary */}
      {strategyName && stockSymbol && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Strategy Summary:
          </Typography>
          <Typography variant="body2">
            <strong>{strategyName}</strong> on <Chip label={stockSymbol} size="small" /> from{' '}
            {startDate || 'TBD'} to {endDate || 'TBD'} with initial capital ₹
            {parseFloat(initialCapital || '0').toLocaleString('en-IN')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StrategyBuilderForm;
