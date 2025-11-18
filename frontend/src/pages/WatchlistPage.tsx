import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { Add, FilterList, Delete } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  setWatchlist,
  addStock,
  removeStock,
  updateStock,
  setCategories,
  setSelectedCategory,
  setLoading,
  setError,
} from '../store/watchlistSlice';
import { watchlistService } from '../services/watchlistService';
import type { StockSearchResult } from '../services/watchlistService';
import { analysisService, type TradingSignal } from '../services/analysisService';
import StockSearchInput from '../components/watchlist/StockSearchInput';
import StockCard from '../components/watchlist/StockCard';
import RecommendationCard from '../components/analysis/RecommendationCard';
import TechnicalIndicatorsPanel from '../components/analysis/TechnicalIndicatorsPanel';
import OrderDialog from '../components/trading/OrderDialog';
import type { WatchlistStock } from '../types';

const WatchlistPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stocks, categories, selectedCategory, isLoading } = useAppSelector(
    (state) => state.watchlist
  );

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedStock, setSelectedStock] = useState<WatchlistStock | null>(null);
  const [selectedStockForAdd, setSelectedStockForAdd] = useState<StockSearchResult | null>(null);
  const [stockCategories, setStockCategories] = useState<string[]>([]);
  const [operationLoading, setOperationLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TradingSignal | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
    loadCategories();
  }, []);

  // Poll for price updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (stocks.length > 0) {
        updatePrices();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [stocks]);

  const loadWatchlist = async () => {
    dispatch(setLoading(true));
    try {
      const data = await watchlistService.getWatchlist();
      dispatch(setWatchlist(data));

      // Load initial prices
      if (data.length > 0) {
        updatePrices();
      }
    } catch (error: any) {
      dispatch(setError(error.message));
      showSnackbar('Failed to load watchlist', 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await watchlistService.getCategories();
      dispatch(setCategories(cats));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const updatePrices = async () => {
    // TODO: Implement real-time price updates in Phase 3.3
    // For now, this is a placeholder that will be implemented when
    // we add WebSocket support for live price updates
    try {
      // const symbols = stocks.map(s => `${s.exchange}:${s.stockSymbol}`);
      // const quotes = await watchlistService.getQuotes(symbols);
      // Dispatch price updates to Redux store
    } catch (error) {
      console.error('Failed to update prices:', error);
    }
  };

  const handleAddStock = () => {
    setAddDialogOpen(true);
  };

  const handleStockSelect = (stock: StockSearchResult) => {
    setSelectedStockForAdd(stock);
    setStockCategories([]);
  };

  const handleConfirmAdd = async () => {
    if (!selectedStockForAdd) return;

    setOperationLoading(true);
    try {
      const newStock = await watchlistService.addStock({
        stockSymbol: selectedStockForAdd.tradingsymbol,
        companyName: selectedStockForAdd.name,
        exchange: selectedStockForAdd.exchange as 'NSE' | 'BSE',
        instrumentToken: selectedStockForAdd.instrumentToken,
        categories: stockCategories,
      });

      dispatch(addStock(newStock));
      loadCategories(); // Refresh categories
      showSnackbar('Stock added to watchlist', 'success');
      setAddDialogOpen(false);
      setSelectedStockForAdd(null);
      setStockCategories([]);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to add stock', 'error');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleRemoveClick = (stock: WatchlistStock) => {
    setSelectedStock(stock);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStock) return;

    setOperationLoading(true);
    try {
      await watchlistService.removeStock(selectedStock.id);
      dispatch(removeStock(selectedStock.id));
      loadCategories(); // Refresh categories
      showSnackbar('Stock removed from watchlist', 'success');
      setDeleteDialogOpen(false);
      setSelectedStock(null);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to remove stock', 'error');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditStock = (stock: WatchlistStock) => {
    setSelectedStock(stock);
    setStockCategories(stock.categories || []);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!selectedStock) return;

    setOperationLoading(true);
    try {
      const updated = await watchlistService.updateStock(selectedStock.id, {
        categories: stockCategories,
      });

      dispatch(updateStock(updated));
      loadCategories(); // Refresh categories
      showSnackbar('Stock updated successfully', 'success');
      setEditDialogOpen(false);
      setSelectedStock(null);
      setStockCategories([]);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update stock', 'error');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleAnalyzeStock = async (stock: WatchlistStock) => {
    setSelectedStock(stock);
    setAnalysisDialogOpen(true);
    setAnalysisLoading(true);
    setAnalysis(null);

    try {
      const result = await analysisService.getAnalysis(stock.instrumentToken);
      setAnalysis(result);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to analyze stock', 'error');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredStocks = selectedCategory
    ? stocks.filter(stock => stock.categories.includes(selectedCategory))
    : stocks;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📊 Watchlist
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddStock}
          size="large"
        >
          Add Stock
        </Button>
      </Box>

      {/* Category Filter */}
      {categories.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FilterList />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Filter by Category
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="All"
              onClick={() => dispatch(setSelectedCategory(null))}
              color={selectedCategory === null ? 'primary' : 'default'}
              variant={selectedCategory === null ? 'filled' : 'outlined'}
            />
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => dispatch(setSelectedCategory(category))}
                color={selectedCategory === category ? 'primary' : 'default'}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Stocks Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredStocks.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {selectedCategory ? 'No stocks in this category' : 'Your watchlist is empty'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {selectedCategory
              ? 'Try selecting a different category'
              : 'Start by adding stocks you want to monitor'}
          </Typography>
          {!selectedCategory && (
            <Button variant="contained" startIcon={<Add />} onClick={handleAddStock}>
              Add Your First Stock
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredStocks.map((stock) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={stock.id}>
              <StockCard
                stock={stock}
                onRemove={() => handleRemoveClick(stock)}
                onEdit={handleEditStock}
                onAnalyze={handleAnalyzeStock}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Stock Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setSelectedStockForAdd(null);
          setStockCategories([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Stock to Watchlist</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <StockSearchInput onStockSelect={handleStockSelect} />

            {selectedStockForAdd && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedStockForAdd.tradingsymbol} - {selectedStockForAdd.name}
                  </Typography>
                  <Typography variant="caption">
                    {selectedStockForAdd.exchange}
                  </Typography>
                </Alert>

                <Autocomplete
                  multiple
                  freeSolo
                  options={categories}
                  value={stockCategories}
                  onChange={(_, newValue) => setStockCategories(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Categories (optional)"
                      placeholder="Add categories"
                      helperText="Press Enter to create new categories"
                    />
                  )}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setSelectedStockForAdd(null);
              setStockCategories([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdd}
            variant="contained"
            disabled={!selectedStockForAdd || operationLoading}
            startIcon={operationLoading ? <CircularProgress size={20} /> : null}
          >
            {operationLoading ? 'Adding...' : 'Add to Watchlist'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedStock(null);
          setStockCategories([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Stock Categories</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedStock && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  {selectedStock.stockSymbol} - {selectedStock.companyName}
                </Typography>

                <Autocomplete
                  multiple
                  freeSolo
                  options={categories}
                  value={stockCategories}
                  onChange={(_, newValue) => setStockCategories(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Categories"
                      placeholder="Add categories"
                      helperText="Press Enter to create new categories"
                    />
                  )}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedStock(null);
              setStockCategories([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEdit}
            variant="contained"
            disabled={operationLoading}
            startIcon={operationLoading ? <CircularProgress size={20} /> : null}
          >
            {operationLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!operationLoading) {
            setDeleteDialogOpen(false);
            setSelectedStock(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove Stock from Watchlist?</DialogTitle>
        <DialogContent>
          {selectedStock && (
            <Typography>
              Are you sure you want to remove <strong>{selectedStock.stockSymbol}</strong> ({selectedStock.companyName}) from your watchlist?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedStock(null);
            }}
            disabled={operationLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={operationLoading}
            startIcon={operationLoading ? <CircularProgress size={20} /> : <Delete />}
          >
            {operationLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Technical Analysis Dialog */}
      <Dialog
        open={analysisDialogOpen}
        onClose={() => {
          setAnalysisDialogOpen(false);
          setAnalysis(null);
          setSelectedStock(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedStock && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Technical Analysis: {selectedStock.stockSymbol}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedStock.companyName}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {analysisLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
              <CircularProgress size={60} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Analyzing {selectedStock?.stockSymbol}... This may take a few seconds
              </Typography>
            </Box>
          ) : analysis && selectedStock ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <RecommendationCard
                  symbol={selectedStock.stockSymbol}
                  companyName={selectedStock.companyName}
                  signal={analysis.signal}
                  score={analysis.score}
                  confidence={analysis.confidence}
                  reasons={analysis.reasons}
                  price={analysis.price}
                  timestamp={new Date(analysis.timestamp)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TechnicalIndicatorsPanel
                  indicators={analysis.indicators}
                  currentPrice={analysis.price}
                />
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No analysis available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {analysis && selectedStock && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setOrderType('BUY');
                  setOrderDialogOpen(true);
                }}
                sx={{ mr: 'auto' }}
              >
                Buy
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setOrderType('SELL');
                  setOrderDialogOpen(true);
                }}
                sx={{ mr: 2 }}
              >
                Sell
              </Button>
            </>
          )}
          <Button
            onClick={() => {
              setAnalysisDialogOpen(false);
              setAnalysis(null);
              setSelectedStock(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Dialog */}
      {selectedStock && analysis && (
        <OrderDialog
          open={orderDialogOpen}
          onClose={() => setOrderDialogOpen(false)}
          stockSymbol={selectedStock.stockSymbol}
          companyName={selectedStock.companyName}
          exchange={selectedStock.exchange as 'NSE' | 'BSE'}
          instrumentToken={selectedStock.instrumentToken}
          currentPrice={analysis.price}
          transactionType={orderType}
          onSuccess={() => {
            showSnackbar(`${orderType} order placed successfully`, 'success');
            setOrderDialogOpen(false);
          }}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WatchlistPage;
