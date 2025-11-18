import React, { useState } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { watchlistService } from '../../services/watchlistService';
import type { StockSearchResult } from '../../services/watchlistService';

interface StockSearchInputProps {
  onStockSelect: (stock: StockSearchResult) => void;
}

const StockSearchInput: React.FC<StockSearchInputProps> = ({ onStockSelect }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Debounced search
  const handleSearch = async (value: string) => {
    if (value.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await watchlistService.searchStocks(value);
      setOptions(results);
    } catch (error) {
      console.error('Search error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce timer
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue) {
        handleSearch(inputValue);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.instrumentToken === value.instrumentToken}
      getOptionLabel={(option) => option.tradingsymbol}
      options={options}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(_, newValue) => {
        setInputValue(newValue);
      }}
      onChange={(_, value) => {
        if (value) {
          onStockSelect(value);
          setInputValue('');
          setOptions([]);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search stocks..."
          placeholder="Type symbol or company name (e.g., RELIANCE)"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <Search sx={{ color: 'action.active', mr: 1 }} />
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {option.tradingsymbol}
              </Typography>
              <Chip
                label={option.exchange}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {option.name}
            </Typography>
          </Box>
        </Box>
      )}
      noOptionsText={
        inputValue.length < 2
          ? 'Type at least 2 characters to search'
          : 'No stocks found'
      }
    />
  );
};

export default StockSearchInput;
